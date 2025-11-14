import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import type { GenerateImagesRequest, Generate3DModelRequest } from '../services/api';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { usePropertiesAggregator } from '../hooks/usePropertiesAggregator';
import ColorPicker from './ColorPicker';
import SizeSelector from './SizeSelector';
import ProductionSelector from './ProductionSelector';
import StyleSelector from './StyleSelector';
import MaterialSelector from './MaterialSelector';
import DetailSelector from './DetailSelector';
import { toast } from '@/lib/sonner';

interface ChatStyleMobileWorkflowProps {
  onError: (error: string) => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  images?: string[];
  isGenerating?: boolean;
  sessionId?: string;
  creationId?: string;
}

export default function ChatStyleMobileWorkflow({ onError }: ChatStyleMobileWorkflowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [selectedProduction, setSelectedProduction] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedDetails, setSelectedDetails] = useState<string[]>([]);
  const [selectedQuality, setSelectedQuality] = useState('medium');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const userId = sessionStorage.getItem('user_id') || '';
  const token = sessionStorage.getItem('token');
  
  useEffect(() => {
    if (!userId || !token) {
      window.location.href = '/signin';
    }
  }, [userId, token]);

  const { canGenerateImages, canGenerateModels, checkLimits } = useUsageLimits(userId);
  
  const {
    addColor,
    addSize,
    addProduction,
    addStyle,
    addMaterial,
    addDetails,
    generateEnhancedPrompt,
    getProperties,
    hasProperties
  } = usePropertiesAggregator();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const get3DOptions = () => ({
    texture_size: 2048 as const,
    mesh_simplify: 0.2,
    ss_sampling_steps: 30,
    slat_sampling_steps: 15,
    ss_guidance_strength: 7.5,
    slat_guidance_strength: 3
  });

  const generateImages = useCallback(async (prompt: string) => {
    if (!prompt.trim()) {
      onError('Please enter a prompt first');
      return;
    }

    if (!canGenerateImages) {
      onError('You have reached your monthly image generation limit. Please upgrade your plan to continue.');
      return;
    }

    const userMessageId = `user_${Date.now()}`;
    const assistantMessageId = `assistant_${Date.now()}`;
    
    // Use enhanced prompt if properties are set
    const finalPrompt = hasProperties() ? generateEnhancedPrompt(prompt) : prompt;

    setMessages(prev => [
      ...prev,
      { id: userMessageId, type: 'user', content: prompt },
      { id: assistantMessageId, type: 'assistant', content: 'Generating images...', isGenerating: true }
    ]);

    // Don't set isGenerating for image generation - only for 3D model generation

    try {
      const newCreationId = `creation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const request: GenerateImagesRequest = {
        text: finalPrompt,
        user_id: userId || (() => {
          const storedUserId = sessionStorage.getItem('guest_user_id');
          if (storedUserId) return storedUserId;
          const newUserId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          sessionStorage.setItem('guest_user_id', newUserId);
          return newUserId;
        })(),
        creation_id: newCreationId,
        color: '#FF6B6B',
        size: 'M',
        style: 'realistic',
        material: 'plastic',
        production: 'digital',
        details: []
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      try {
        const response = await apiService.generateImages(request);
        
        if (response.success && response.data) {
          const imageUrls = response.data.images.map(img => img.url);
          
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { 
                  ...msg, 
                  content: 'Here are your generated images. Tap one to create a 3D model!', 
                  images: imageUrls,
                  isGenerating: false,
                  sessionId: response.data!.session_id,
                  creationId: newCreationId
                }
              : msg
          ));
          
          try {
            await apiService.trackUsage(userId, 'image', response.data.images.length);
            await checkLimits(true);
          } catch (trackingError) {
            try {
              await checkLimits(true);
            } catch (limitsError) {
              // Limits check failed, but generation succeeded
            }
          }
        } else {
          throw new Error(response.error || 'Failed to generate images');
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        onError('Image generation timed out. Please try again with a simpler prompt.');
      } else {
        onError(error instanceof Error ? error.message : 'Failed to generate images');
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: 'Sorry, something went wrong. Please try again.', isGenerating: false }
          : msg
      ));
    }
    // Don't set isGenerating to false here - it's not set to true for image generation
  }, [canGenerateImages, userId, checkLimits, onError, hasProperties, generateEnhancedPrompt]);

  const generate3DModel = async (imageUrl: string, sessionId: string, creationId: string) => {
    if (!canGenerateModels) {
      onError('You have reached your monthly model generation limit. Please upgrade your plan to continue.');
      return;
    }

    // Set generating state to show full-screen loading
    setIsGenerating(true);

    try {
      const request: Generate3DModelRequest = {
        image_url: imageUrl,
        session_id: sessionId,
        user_id: userId,
        creation_id: creationId,
        options: {
          generate_color: true,
          generate_model: true,
          randomize_seed: true,
          ...get3DOptions()
        }
      };

      const response = await apiService.generate3DModel(request);
      
      if (response.success && response.data) {
        try {
          await apiService.trackUsage(userId, 'model', 1);
          await checkLimits(true);
        } catch (trackingError) {
          // Don't fail the generation if tracking fails
        }
        
        window.location.href = `/design/${response.data.design_id}`;
      } else {
        throw new Error(response.error || 'Failed to generate 3D model');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to generate 3D model');
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isGenerating) {
      generateImages(inputValue);
      setInputValue('');
    }
  };

  // SVG Icon Components matching desktop
  const ColorIcon = () => (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
      <path d="M4.16667 33.3333C3.02084 33.3333 2.04028 32.9257 1.225 32.1104C0.409725 31.2952 0.00139242 30.3139 3.53108e-06 29.1667C-0.00138536 28.0195 0.406948 27.0389 1.225 26.225C2.04306 25.4111 3.02361 25.0028 4.16667 25C5.30973 24.9972 6.29098 25.4056 7.11042 26.225C7.92987 27.0445 8.3375 28.025 8.33334 29.1667C8.32917 30.3083 7.92153 31.2896 7.11042 32.1104C6.29931 32.9313 5.31806 33.3389 4.16667 33.3333ZM20.8333 33.3333C19.6875 33.3333 18.707 32.9257 17.8917 32.1104C17.0764 31.2952 16.6681 30.3139 16.6667 29.1667C16.6653 28.0195 17.0736 27.0389 17.8917 26.225C18.7097 25.4111 19.6903 25.0028 20.8333 25C21.9764 24.9972 22.9576 25.4056 23.7771 26.225C24.5965 27.0445 25.0042 28.025 25 29.1667C24.9958 30.3083 24.5882 31.2896 23.7771 32.1104C22.966 32.9313 21.9847 33.3389 20.8333 33.3333ZM12.5 25C11.3542 25 10.3736 24.5924 9.55834 23.7771C8.74306 22.9618 8.33473 21.9806 8.33334 20.8333C8.33195 19.6861 8.74028 18.7056 9.55834 17.8917C10.3764 17.0778 11.3569 16.6695 12.5 16.6667C13.6431 16.6639 14.6243 17.0722 15.4438 17.8917C16.2632 18.7111 16.6708 19.6917 16.6667 20.8333C16.6625 21.975 16.2549 22.9563 15.4438 23.7771C14.6326 24.5979 13.6514 25.0056 12.5 25ZM29.1667 25C28.0208 25 27.0403 24.5924 26.225 23.7771C25.4097 22.9618 25.0014 21.9806 25 20.8333C24.9986 19.6861 25.4069 18.7056 26.225 17.8917C27.0431 17.0778 28.0236 16.6695 29.1667 16.6667C30.3097 16.6639 31.291 17.0722 32.1104 17.8917C32.9299 18.7111 33.3375 19.6917 33.3333 20.8333C33.3292 21.975 32.9215 22.9563 32.1104 23.7771C31.2993 24.5979 30.3181 25.0056 29.1667 25ZM4.16667 16.6667C3.02084 16.6667 2.04028 16.259 1.225 15.4438C0.409725 14.6285 0.00139242 13.6472 3.53108e-06 12.5C-0.00138536 11.3528 0.406948 10.3722 1.225 9.55835C2.04306 8.74446 3.02361 8.33612 4.16667 8.33335C5.30973 8.33057 6.29098 8.7389 7.11042 9.55835C7.92987 10.3778 8.3375 11.3583 8.33334 12.5C8.32917 13.6417 7.92153 14.6229 7.11042 15.4438C6.29931 16.2646 5.31806 16.6722 4.16667 16.6667ZM20.8333 16.6667C19.6875 16.6667 18.707 16.259 17.8917 15.4438C17.0764 14.6285 16.6681 13.6472 16.6667 12.5C16.6653 11.3528 17.0736 10.3722 17.8917 9.55835C18.7097 8.74446 19.6903 8.33612 20.8333 8.33335C21.9764 8.33057 22.9576 8.7389 23.7771 9.55835C24.5965 10.3778 25.0042 11.3583 25 12.5C24.9958 13.6417 24.5882 14.6229 23.7771 15.4438C22.966 16.2646 21.9847 16.6722 20.8333 16.6667ZM12.5 8.33335C11.3542 8.33335 10.3736 7.92571 9.55834 7.11043C8.74306 6.29515 8.33473 5.3139 8.33334 4.16668C8.33195 3.01946 8.74028 2.0389 9.55834 1.22501C10.3764 0.411125 11.3569 0.00279185 12.5 1.40766e-05C13.6431 -0.0027637 14.6243 0.405569 15.4438 1.22501C16.2632 2.04446 16.6708 3.02501 16.6667 4.16668C16.6625 5.30835 16.2549 6.2896 15.4438 7.11043C14.6326 7.93126 13.6514 8.3389 12.5 8.33335ZM29.1667 8.33335C28.0208 8.33335 27.0403 7.92571 26.225 7.11043C25.4097 6.29515 25.0014 5.3139 25 4.16668C24.9986 3.01946 25.4069 2.0389 26.225 1.22501C27.0431 0.411125 28.0236 0.00279185 29.1667 1.40766e-05C30.3097 -0.0027637 31.291 0.405569 32.1104 1.22501C32.9299 2.04446 33.3375 3.02501 33.3333 4.16668C33.3292 5.30835 32.9215 6.2896 32.1104 7.11043C31.2993 7.93126 30.3181 8.3389 29.1667 8.33335Z" fill="currentColor"/>
    </svg>
  );

  const MaterialIcon = () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
      <path fillRule="evenodd" clipRule="evenodd" d="M33.8 0C34.2774 0 34.7352 0.189643172 35.0728 0.527208C35.4104 0.864774 35.6 1.32261 35.6 1.8V17.8C35.6 18.2774 35.4104 18.7352 35.0728 19.0728C34.7352 19.4104 34.2774 19.6 33.8 19.6C33.3226 19.6 32.8648 19.4104 32.5272 19.0728C32.1896 18.7352 32 18.2774 32 17.8V6.144L6.144 32H17.8C18.2774 32 18.7352 32.1896 19.0728 32.5272C19.4104 32.8648 19.6 33.3226 19.6 33.8C19.6 34.2774 19.4104 34.7352 19.0728 35.0728C18.7352 35.4104 18.2774 35.6 17.8 35.6H1.8C1.32261 35.6 0.864774 35.4104 0.527208 35.0728C0.189643 34.7352 0 34.2774 0 33.8V17.8C-7.04465e-09 17.5636 0.0465588 17.3296 0.137017 17.1112C0.227476 16.8928 0.360063 16.6944 0.527208 16.5272C0.694354 16.3601 0.892784 16.2275 1.11117 16.137C1.32956 16.0466 1.56362 16 1.8 16C2.03638 16 2.27044 16.0466 2.48883 16.137C2.70722 16.2275 2.90565 16.3601 3.07279 16.5272C3.23994 16.6944 3.37252 16.8928 3.46298 17.1112C3.55344 17.3296 3.6 17.5636 3.6 17.8V29.456L29.456 3.6H17.8C17.3226 3.6 16.8648 3.41036 16.5272 3.07279C16.1896 2.73523 16 2.27739 16 1.8C16 1.32261 16.1896 0.864774 16.5272 0.527208C16.8648 0.189643 17.3226 0 17.8 0H33.8Z" fill="currentColor"/>
    </svg>
  );

  const SizeIcon = () => (
    <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
      <path d="M0 1.40625C0 1.03329 0.148158 0.675604 0.411881 0.411881C0.675604 0.148158 1.03329 0 1.40625 0L15.4688 0C15.8417 0 16.1994 0.148158 16.4631 0.411881C16.7268 0.675604 16.875 1.03329 16.875 1.40625V16.2478L28.5384 4.62937C28.8021 4.36574 29.1598 4.21764 29.5327 4.21764C29.9055 4.21764 30.2632 4.36574 30.5269 4.62937L40.4691 14.5744C40.6 14.705 40.7039 14.8602 40.7748 15.031C40.8457 15.2019 40.8822 15.385 40.8822 15.57C40.8822 15.755 40.8457 15.9381 40.7748 16.109C40.7039 16.2798 40.6 16.435 40.4691 16.5656L28.8591 28.125H43.5938C43.9667 28.125 44.3244 28.2732 44.5881 28.5369C44.8518 28.8006 45 29.1583 45 29.5312V43.5938C45 43.9667 44.8518 44.3244 44.5881 44.5881C44.3244 44.8518 43.9667 45 43.5938 45H8.4375C6.19992 44.9995 4.05416 44.1103 2.47219 42.5278C0.919703 40.9763 0.0329066 38.8809 0 36.6862M16.875 36.0956L37.485 15.5644L29.5284 7.61063L16.875 20.2163V36.0956ZM12.6562 36.5625C12.6562 35.4436 12.2118 34.3706 11.4206 33.5794C10.6294 32.7882 9.55638 32.3438 8.4375 32.3438C7.31862 32.3438 6.24556 32.7882 5.45439 33.5794C4.66322 34.3706 4.21875 35.4436 4.21875 36.5625C4.21875 37.6814 4.66322 38.7544 5.45439 39.5456C6.24556 40.3368 7.31862 40.7812 8.4375 40.7812C9.55638 40.7812 10.6294 40.3368 11.4206 39.5456C12.2118 38.7544 12.6562 37.6814 12.6562 36.5625ZM42.1875 42.1875V30.9375H26.0381L14.7459 42.1875H42.1875Z" fill="currentColor"/>
    </svg>
  );

  const StyleIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
      <path d="M1.5 24.0585C1.5 35.637 10.2008 45.1793 21.4058 46.4685C23.0595 46.6598 24.6615 45.9555 25.8383 44.7742C26.5445 44.0657 26.941 43.1061 26.941 42.1058C26.941 41.1054 26.5445 40.1458 25.8383 39.4373C24.6615 38.256 23.7008 36.4965 24.5895 35.0858C28.1355 29.4428 46.5 42.4005 46.5 24.0608C46.5 11.598 36.4267 1.5 24 1.5C11.5733 1.5 1.5 11.6002 1.5 24.0585Z" stroke="currentColor" strokeWidth="3"/>
      <path d="M36.375 24.5625C37.307 24.5625 38.0625 23.807 38.0625 22.875C38.0625 21.943 37.307 21.1875 36.375 21.1875C35.443 21.1875 34.6875 21.943 34.6875 22.875C34.6875 23.807 35.443 24.5625 36.375 24.5625Z" fill="currentColor" stroke="currentColor" strokeWidth="3"/>
      <path d="M11.625 24.5625C12.557 24.5625 13.3125 23.807 13.3125 22.875C13.3125 21.943 12.557 21.1875 11.625 21.1875C10.693 21.1875 9.9375 21.943 9.9375 22.875C9.9375 23.807 10.693 24.5625 11.625 24.5625Z" fill="currentColor" stroke="currentColor" strokeWidth="3"/>
    </svg>
  );

  const ProductionIcon = () => (
    <svg width="30" height="32" viewBox="0 0 30 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
      <path d="M29.2146 7.9201C28.6979 7.03496 27.9524 6.30537 27.0562 5.80802L17.8062 0.705102C16.9462 0.242268 15.9848 0 15.0081 0C14.0315 0 13.07 0.242268 12.21 0.705102L2.96 5.80802C2.06388 6.30537 1.3183 7.03496 0.801667 7.9201C0.277492 8.80731 0.000667015 9.81878 0 10.8493V20.7314C0.00720179 21.7576 0.284568 22.7638 0.804188 23.6488C1.32381 24.5338 2.06735 25.2663 2.96 25.7726L12.21 30.8601C13.0661 31.3352 14.029 31.5846 15.0081 31.5846C15.9872 31.5846 16.9502 31.3352 17.8062 30.8601L27.0562 25.7572C27.9512 25.2588 28.6963 24.5298 29.2141 23.6459C29.7319 22.7621 30.0036 21.7557 30.0008 20.7314V10.9264C30.0269 9.87024 29.7544 8.8282 29.2146 7.9201ZM27.6729 20.7314C27.6791 21.3445 27.5189 21.9479 27.2094 22.4773C26.9 23.0066 26.4528 23.4422 25.9154 23.7376L16.6654 28.8405C16.503 28.932 16.3334 29.0039 16.1567 29.0564V16.4455L27.4108 9.6776C27.5527 10.0507 27.6205 10.4484 27.6112 10.8493L27.6729 20.7314Z" fill="currentColor"/>
    </svg>
  );

  const DetailIcon = () => (
    <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
      <path d="M23.8123 24.7188L30.6962 31.6026L14.9552 47.3424C14.0421 48.2548 12.8041 48.7673 11.5133 48.7673C10.2225 48.7673 8.98449 48.2548 8.07137 47.3424C7.15899 46.4293 6.64648 45.1913 6.64648 43.9004C6.64648 42.6096 7.15899 41.3716 8.07137 40.4585L23.8123 24.7188Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M30.6965 31.6027L35.9564 26.344C37.0221 26.8805 38.0069 27.811 38.7718 28.925L37.9344 29.7612C37.753 29.9425 37.6091 30.1578 37.5109 30.3948C37.4127 30.6318 37.3621 30.8858 37.3621 31.1423C37.3621 31.3989 37.4127 31.6529 37.5109 31.8898C37.6091 32.1268 37.753 32.3421 37.9344 32.5235L40.1831 34.771C40.5493 35.137 41.0459 35.3427 41.5636 35.3427C42.0814 35.3427 42.578 35.137 42.9442 34.771L50.7826 26.9337C51.1487 26.5675 51.3543 26.071 51.3543 25.5532C51.3543 25.0354 51.1487 24.5388 50.7826 24.1727L48.5351 21.924C48.3538 21.7423 48.1384 21.5983 47.9013 21.5C47.6642 21.4016 47.4101 21.351 47.1534 21.351C46.8967 21.351 46.6426 21.4016 46.4055 21.5C46.1684 21.5983 45.953 21.7423 45.7717 21.924L44.2613 23.4344L42.0983 21.2715C42.0983 21.2715 43.2765 18.166 40.2786 15.1682C35.154 10.0424 28.014 5.90267 18.5902 13.0669C17.4217 13.955 18.0477 15.8473 19.5146 15.8968C27.5983 16.1711 28.2569 20.2758 28.2569 20.2758L23.8126 24.7188" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // Advanced section icons - matching desktop layout
  const advancedSections = [
    { key: 'color', label: 'Color', icon: <StyleIcon /> },
    { key: 'size', label: 'Size', icon: <MaterialIcon /> },
    { key: 'style', label: 'Style', icon: <ColorIcon /> },
    { key: 'material', label: 'Material', icon: <SizeIcon /> },
    { key: 'production', label: 'Production', icon: <DetailIcon /> },
    { key: 'detail', label: 'Detail', icon: <ProductionIcon /> }
  ];

  const handleColorChange = (color: string) => addColor(color);
  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    addSize(size, customWidth, customHeight);
  };
  const handleCustomSizeChange = (width: string, height: string) => {
    setCustomWidth(width);
    setCustomHeight(height);
    addSize(selectedSize, width, height);
  };
  const handleProductionChange = (production: string) => {
    setSelectedProduction(production);
    addProduction(production as 'handmade' | 'digital');
  };
  const handleStyleChange = (style: string) => {
    setSelectedStyle(style);
    addStyle(style);
  };
  const handleMaterialChange = (material: string) => {
    setSelectedMaterial(material);
    addMaterial(material);
  };
  const handleDetailChange = (details: string[]) => {
    setSelectedDetails(details);
    addDetails(details);
  };

  const properties = getProperties();
  const hasColorSelection = !!properties.color;
  const hasSizeSelection = !!properties.size;
  const hasProductionSelection = !!properties.production;
  const hasStyleSelection = !!properties.style;
  const hasMaterialSelection = !!properties.material;
  const hasDetailSelection = !!properties.details && Object.keys(properties.details).some(key => properties.details![key as keyof typeof properties.details]?.length);

  const categoryStatus = {
    color: hasColorSelection,
    size: hasSizeSelection,
    production: hasProductionSelection,
    style: hasStyleSelection,
    material: hasMaterialSelection,
    detail: hasDetailSelection
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 relative overflow-hidden transition-colors duration-300">
      {/* Full-Screen Loading State for 3D Generation */}
      {isGenerating && (
        <div className="absolute inset-0 bg-white z-50 flex items-center justify-center transition-colors duration-300">
          <div className="flex flex-col items-center">
            <img
              src="/GIFS/Loading-State.gif"
              alt="Generating 3D Model"
              className="w-64 h-64 object-contain mb-6"
            />
            <p className="text-xl font-medium text-gray-800">Generating 3D...</p>
          </div>
        </div>
      )}

      {/* Messages Container - Increased bottom padding to ensure visibility */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-40 space-y-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 font-inter">
            {/* Hero Title - CudliyTrademark custom font */}
            <h2 
              className="text-gray-900 mb-6 text-center capitalize" 
              style={{ 
                fontFamily: 'CudliyTrademark, Abril Fatface, serif',
                fontWeight: 400,
                fontSize: '32px',
                lineHeight: '100%',
                letterSpacing: '0%'
              }}
            >
              Make It<br />Memorable
            </h2>

            {/* Example Cards - smaller, 180px width */}
            <div className="flex flex-col gap-3 w-full items-center">
              <button 
                onClick={() => {
                  setInputValue("Birthday gift for my mum. She is 50 years old");
                  setTimeout(() => {
                    const form = document.querySelector('form');
                    if (form) {
                      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }
                  }, 100);
                }}
                className="text-center hover:shadow-lg transition-all border border-gray-100"
                style={{
                  width: '240px',
                  borderRadius: '12px',
                  paddingTop: '12px',
                  paddingRight: '16px',
                  paddingBottom: '12px',
                  paddingLeft: '16px',
                  backgroundColor: '#F6F6F6'
                }}
              >
                <h3 
                  className="text-gray-900 mb-1"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '15px',
                    lineHeight: '20px',
                    letterSpacing: '-0.3px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Birthday gift for my mum
                </h3>
                <p className="text-gray-500 text-xs">She is 50 years old</p>
              </button>

              <button 
                onClick={() => {
                  setInputValue("Anniversary Gift for my partner in New York");
                  setTimeout(() => {
                    const form = document.querySelector('form');
                    if (form) {
                      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }
                  }, 100);
                }}
                className="text-center hover:shadow-lg transition-all border border-gray-100"
                style={{
                  width: '240px',
                  borderRadius: '12px',
                  paddingTop: '12px',
                  paddingRight: '16px',
                  paddingBottom: '12px',
                  paddingLeft: '16px',
                  backgroundColor: '#F6F6F6'
                }}
              >
                <h3 
                  className="text-gray-900 mb-1"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '15px',
                    lineHeight: '20px',
                    letterSpacing: '-0.3px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Anniversary Gift
                </h3>
                <p className="text-gray-500 text-xs">for my partner in New York</p>
              </button>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ opacity: 1, visibility: 'visible' }}
          >
            <div
              className={`max-w-[85%] relative px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-white text-black rounded-[18px] shadow-sm border border-gray-200'
                  : 'bg-gray-100 text-black rounded-[4px] shadow-none border border-gray-100'
              } transition-colors duration-300`}
              style={message.type === 'user' ? {
                borderBottomRightRadius: '4px',
                backgroundColor: '#ffffff !important',
                color: '#000000 !important'
              } : {
                borderBottomLeftRadius: '4px',
                backgroundColor: '#ffffff !important',
                color: '#000000 !important'
              }}
            >
              {/* Chat bubble tail - curved */}
              {message.type === 'user' && (
                <svg 
                  className="absolute -right-2 bottom-0" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    d="M 0 0 Q 8 5 15 18 Q 10 20 0 20 Z" 
                    className="fill-white"
                  />
                </svg>
              )}
              {message.isGenerating && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-black" style={{ color: '#000000 !important' }}>{message.content}</span>
                </div>
              )}
              
              {!message.isGenerating && (
                <>
                  <p className="text-sm whitespace-pre-wrap text-black" style={{ color: '#000000 !important' }}>{message.content}</p>
                  
                  {message.images && message.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      {message.images.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="relative overflow-hidden cursor-pointer transition-all hover:opacity-90 rounded-lg"
                          onClick={() => {
                            if (message.sessionId && message.creationId) {
                              generate3DModel(imageUrl, message.sessionId, message.creationId);
                            }
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={`Generated ${index + 1}`}
                            className="w-full h-auto rounded-lg"
                          />
                          {/* Professional 3D select overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <div className="bg-black rounded-full p-4 shadow-2xl transform hover:scale-110 transition-transform border-2 border-white/20">
                              <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 7.5l-9-4.5-9 4.5 9 4.5 9-4.5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7.5v9l9 4.5 9-4.5v-9" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v9" />
                              </svg>
                            </div>
                          </div>
                          {/* Professional select badge */}
                          <div className="absolute top-3 right-3 bg-none text-[#212121] px-3 py-1 rounded-full text-xs font-medium shadow-lg opacity-90">
                            View 3D
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container - Fixed at bottom matching image design */}
      <div className="fixed bottom-6 left-6 right-6 z-30">
        <form onSubmit={handleSubmit}>
          {/* Main input field - 118px height, 32px border radius - no visible border */}
          <div className="relative bg-[#E5E5EA]" style={{ height: '118px', borderRadius: '32px' }}>
            {/* Text input area - top portion */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask Cudliy"
              className="w-full pt-4 pb-12 pl-6 pr-20 bg-transparent text-gray-800 placeholder-gray-400 border-none focus:outline-none text-sm"
              style={{ borderRadius: '32px' }}
              disabled={isGenerating}
            />
            
            {/* Up arrow button - white when empty, #313131 when typing */}
            <button
              type="submit"
              disabled={!inputValue.trim() || isGenerating || !canGenerateImages}
              className={`absolute right-4 top-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                !inputValue.trim() || isGenerating || !canGenerateImages
                  ? 'bg-white cursor-not-allowed'
                  : 'bg-[#313131] hover:bg-gray-800'
              }`}
            >
              <svg className={`w-5 h-5 transition-colors ${
                !inputValue.trim() || isGenerating || !canGenerateImages
                  ? 'text-gray-400'
                  : 'text-white'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>

            {/* Bottom row with icons - INSIDE the field - scaled down */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-between px-4">
              {/* Plus button - left - dark - smaller - shows toast */}
              <button
                type="button"
                onClick={() => toast.info('Image upload coming soon!')}
                className="w-7 h-7 flex items-center justify-center text-gray-800 hover:text-black transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Right side icons - very close together - smaller */}
              <div className="flex items-center gap-1">
                {/* 3D cube icon - Model selector trigger */}
                <button
                  type="button"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="w-7 h-7 flex items-center justify-center text-gray-800 hover:text-black transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-4.5-9 4.5 9 4.5 9-4.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5v9l9 4.5 9-4.5v-9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v9" />
                  </svg>
                </button>

                {/* Settings/sliders icon - dark - smaller */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`w-7 h-7 flex items-center justify-center transition-all ${
                    showAdvanced || hasProperties()
                      ? 'text-black'
                      : 'text-gray-800'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Advanced Bottom Sheet */}
      {showAdvanced && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => {
              setShowAdvanced(false);
              setSelectedCategory(null);
            }}
          />
          
          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 bg-[#414141] rounded-t-3xl shadow-2xl z-50 max-h-[70vh] overflow-hidden flex flex-col animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {selectedCategory ? advancedSections.find(s => s.key === selectedCategory)?.label : 'Advanced Options'}
              </h3>
              <button
                onClick={() => {
                  if (selectedCategory) {
                    setSelectedCategory(null);
                  } else {
                    setShowAdvanced(false);
                  }
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {!selectedCategory ? (
                /* Category Grid */
                <div className="grid grid-cols-3 gap-4">
                  {advancedSections.map((section) => (
                    <button
                      key={section.key}
                      onClick={() => setSelectedCategory(section.key)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all relative ${
                        categoryStatus[section.key as keyof typeof categoryStatus]
                          ? 'bg-white/10 border-2 border-pink-400'
                          : 'bg-white/5 border-2 border-white/10'
                      }`}
                    >
                      <div className="text-white">{section.icon}</div>
                      <span className="text-xs font-medium text-white/90">{section.label}</span>
                      {categoryStatus[section.key as keyof typeof categoryStatus] && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full border-2 border-[#414141]" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                /* Selected Category Content */
                <div className="pb-6">
                  {selectedCategory === 'color' && (
                    <div className="flex justify-center">
                      <div style={{ transform: 'scale(0.85)' }}>
                        <ColorPicker onColorChange={handleColorChange} />
                      </div>
                    </div>
                  )}
                  {selectedCategory === 'size' && (
                    <SizeSelector
                      selectedSize={selectedSize}
                      onSizeChange={handleSizeChange}
                      customWidth={customWidth}
                      customHeight={customHeight}
                      onCustomSizeChange={handleCustomSizeChange}
                    />
                  )}
                  {selectedCategory === 'production' && (
                    <ProductionSelector
                      selectedProduction={selectedProduction}
                      onProductionChange={handleProductionChange}
                    />
                  )}
                  {selectedCategory === 'style' && (
                    <StyleSelector
                      selectedStyle={selectedStyle}
                      onStyleChange={handleStyleChange}
                    />
                  )}
                  {selectedCategory === 'material' && (
                    <MaterialSelector
                      selectedMaterial={selectedMaterial}
                      onMaterialChange={handleMaterialChange}
                    />
                  )}
                  {selectedCategory === 'detail' && (
                    <DetailSelector
                      selectedDetails={selectedDetails}
                      onDetailChange={handleDetailChange}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Model Quality Dropdown - Mobile Bottom Sheet */}
      {showModelDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setShowModelDropdown(false)}
          />
          
          {/* Bottom Sheet - Dark theme matching Advanced Options */}
          <div className="fixed bottom-0 left-0 right-0 bg-[#414141] rounded-t-3xl shadow-2xl z-50 animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Model Quality</h3>
              <button
                onClick={() => setShowModelDropdown(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quality Options */}
            <div className="px-6 py-4 space-y-3 pb-8">
              <button
                onClick={() => setSelectedQuality('fast')}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  selectedQuality === 'fast'
                    ? 'bg-white/10'
                    : 'bg-white/5 border border-white/10'
                }`}
                style={selectedQuality === 'fast' ? { border: '1px solid white' } : {}}
              >
                <div className="font-semibold mb-1 text-white">Fast</div>
                <div style={{ fontSize: '16px', color: '#FFFFFF99' }}>
                  Quick generation, lower quality
                </div>
              </button>

              <button
                onClick={() => setSelectedQuality('medium')}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  selectedQuality === 'medium'
                    ? 'bg-white/10'
                    : 'bg-white/5 border border-white/10'
                }`}
                style={selectedQuality === 'medium' ? { border: '1px solid white' } : {}}
              >
                <div className="font-semibold mb-1 text-white">Medium</div>
                <div style={{ fontSize: '16px', color: '#FFFFFF99' }}>
                  Balanced speed and quality
                </div>
              </button>

              <button
                onClick={() => setSelectedQuality('good')}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  selectedQuality === 'good'
                    ? 'bg-white/10'
                    : 'bg-white/5 border border-white/10'
                }`}
                style={selectedQuality === 'good' ? { border: '1px solid white' } : {}}
              >
                <div className="font-semibold mb-1 text-white">High Quality</div>
                <div style={{ fontSize: '16px', color: '#FFFFFF99' }}>
                  Best quality, slower generation
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        /* Hide scrollbar for Chrome, Safari and Opera */
        *::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}