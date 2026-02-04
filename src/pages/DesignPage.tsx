import { useRef, useState, useEffect } from "react";
import ColorPicker from "../components/ColorPicker";
import SizeSelector from "../components/SizeSelector";
import ProductionSelector from "../components/ProductionSelector";
import StyleSelector from "../components/StyleSelector";
import MaterialSelector from "../components/MaterialSelector";
import DetailSelector from "../components/DetailSelector";
import ModelDropdown from "../components/modelDropdown";
import { usePropertiesAggregator } from "../hooks/usePropertiesAggregator";
import { useUsageLimits } from "../hooks/useUsageLimits";
import SEO from "@/components/SEO";
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/sonner';
import MobileOptimizedImageWorkflow from "../components/MobileOptimizedImageWorkflow";
import ChatStyleMobileWorkflow from "../components/ChatStyleMobileWorkflow";
import Simple3DViewer from "../components/Simple3DViewer";
import DesignViewLeftPane from "../components/DesignViewLeftPane";
import contentFilter from "../utils/contentFilter";

export default function DesignPage() {
	const modalVideoRef = useRef<HTMLVideoElement>(null);
	const [isModalPlaying, setIsModalPlaying] = useState(false);
	const [showTourModal, setShowTourModal] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);
	const [showIntroPopup, setShowIntroPopup] = useState(false);

	// Check if intro should be shown (for new signups)
	useEffect(() => {
		const shouldShowIntro = sessionStorage.getItem('show_intro');
		if (shouldShowIntro === 'true') {
			setShowIntroPopup(true);
			sessionStorage.removeItem('show_intro');
		}

		// Check if there's a new design prompt from DesignView
		const newDesignPrompt = sessionStorage.getItem('new_design_prompt');
		const fromDesignView = sessionStorage.getItem('from_design_view');
		
		if (newDesignPrompt) {

			setPrompt(newDesignPrompt);
			sessionStorage.removeItem('new_design_prompt');
			
			// Auto-trigger generation after a short delay
			setTimeout(() => {

				setGenerationCounter(prev => prev + 1);
				setShowWorkflow(true);
			}, 500);
		}
		
		// Store the flag for later use in completion handler
		if (fromDesignView === 'true') {

		}
	}, []);
	const [isAdvanced, setIsAdvanced] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [selectedSize, setSelectedSize] = useState('M');
	const [customWidth, setCustomWidth] = useState('');
	const [customHeight, setCustomHeight] = useState('');
	const [selectedProduction, setSelectedProduction] = useState('');
	const [selectedStyle, setSelectedStyle] = useState('');
	const [selectedMaterial, setSelectedMaterial] = useState('');
	const [selectedDetails, setSelectedDetails] = useState<string[]>([]);
	const [selectedQuality, setSelectedQuality] = useState('medium');
	const [prompt, setPrompt] = useState('');
	const [showWorkflow, setShowWorkflow] = useState(false);
	const [generationCounter, setGenerationCounter] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [show3DViewer, setShow3DViewer] = useState(false);
	const [completedDesign, setCompletedDesign] = useState<any>(null);
	
	// Image upload states
	const [uploadedImages, setUploadedImages] = useState<any[]>([]);
	const [isUploadMode, setIsUploadMode] = useState(false);
	const [isProcessingFiles, setIsProcessingFiles] = useState(false);
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
	
	// 3D Viewer control states
	const [lighting3D, setLighting3D] = useState(30);
	const [background3D, setBackground3D] = useState(0);
	const [size3D, setSize3D] = useState(50);
	const [cameraAngle3D, setCameraAngle3D] = useState(50);

	const [isMobile, setIsMobile] = useState(false);

	// Strategic Properties Aggregation System
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

	// Helper function to format file sizes
	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	};

  // Get user ID for usage limits (authenticated users only)
  const userId = sessionStorage.getItem('user_id');
  const token = sessionStorage.getItem('token');
  
  // Redirect to login if not authenticated
  useEffect(() => {
	if (!userId || !token) {
	  window.location.href = '/signin';
	}
  }, [userId, token]);

	// Usage limits and subscription status
	const { 
		usageLimits, 
		canGenerateImages, 
		canGenerateModels, 
		remainingImages
	} = useUsageLimits(userId || '');


	useEffect(() => {
		const timer = setTimeout(() => setIsLoaded(true), 100);
		return () => clearTimeout(timer);
	}, []);

	// Detect mobile viewport and devices (including iPads)
	useEffect(() => {
		const checkMobile = () => {
			const width = window.innerWidth;
			const userAgent = navigator.userAgent.toLowerCase();
			const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
			
			// Check for mobile devices, tablets (including iPads)
			const isMobileDevice = /iphone|ipod|android|blackberry|windows phone/i.test(userAgent);
			const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) || 
							 (isTouchDevice && width >= 768 && width <= 1024);
			
			// Consider both mobile phones and tablets (including iPads) as "mobile"
			setIsMobile(width < 768 || isMobileDevice || isTablet);
		};
		
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Debug: Track showWorkflow changes
	useEffect(() => {
		// showWorkflow changed
	}, [showWorkflow]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (_event: MouseEvent) => {
			if (openDropdownId) {
				setOpenDropdownId(null);
			}
		};

		if (openDropdownId) {
			document.addEventListener('click', handleClickOutside);
		}

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	}, [openDropdownId]);

	// Strategic Enhancement: Sync initial state with properties aggregator
	useEffect(() => {
		// Initialize with default size selection if not already set
		if (selectedSize === 'M' && !hasProperties()) {
			addSize(selectedSize, customWidth, customHeight);
		}
	}, [selectedSize, customWidth, customHeight, addSize, hasProperties]);

	const handleModalPlay = () => {
		if (modalVideoRef.current) {
			if (isModalPlaying) {
				modalVideoRef.current.pause();
				setIsModalPlaying(false);
			} else {
				modalVideoRef.current.play();
				setIsModalPlaying(true);
			}
		}
	};

	const handleModalVideoClick = () => {
		handleModalPlay();
	};

	const handleCloseModal = () => {
		if (modalVideoRef.current) {
			modalVideoRef.current.pause();
			setIsModalPlaying(false);
		}
		setShowTourModal(false);
	};

	const handleAdvancedClick = () => {
		setIsAdvanced(!isAdvanced);
		setSelectedCategory(null); // Reset category when switching modes
	};

	const handleCategoryClick = (categoryKey: string) => {
		setSelectedCategory(categoryKey);
	};

const handleBackToCategories = () => {

	// Always return to Advanced section with no subcategory selected
	if (!isAdvanced) setIsAdvanced(true);
	setSelectedCategory(null);

};


	const handleSizeChange = (size: string) => {
		setSelectedSize(size);
		// Strategic Enhancement: Add size to properties aggregator
		addSize(size, customWidth, customHeight);
	};

	const handleCustomSizeChange = (width: string, height: string) => {
		setCustomWidth(width);
		setCustomHeight(height);
		// Strategic Enhancement: Update size with custom dimensions
		addSize(selectedSize, width, height);
	};

	const handleProductionChange = (production: string) => {
		setSelectedProduction(production);
		// Strategic Enhancement: Add production to properties aggregator
		addProduction(production as 'handmade' | 'digital');
	};

	const handleStyleChange = (style: string) => {
		setSelectedStyle(style);
		// Strategic Enhancement: Add style to properties aggregator
		addStyle(style);
	};

	const handleMaterialChange = (material: string) => {
		setSelectedMaterial(material);
		// Strategic Enhancement: Add material to properties aggregator
		addMaterial(material);
	};

	const handleDetailChange = (details: string[]) => {
		setSelectedDetails(details);
		// Strategic Enhancement: Add details to properties aggregator
		addDetails(details);
	};

	const handleCreateClick = () => {
		// Check if in upload mode and prevent AI generation
		if (isUploadMode && uploadedImages.length > 0) {
			setError('Cannot generate AI images while in upload mode. Clear uploaded images first.');
			return;
		}

		if (!prompt.trim()) {
			setError('Please enter a prompt first');
			return;
		}

		// CLIENT-SIDE CONTENT FILTERING
		const userSelections = {
			text: prompt,
			style: selectedStyle,
			material: selectedMaterial,
			production: selectedProduction,
			details: selectedDetails
		};
		
		const contentCheck = contentFilter.checkUserSelections(userSelections);
		if (contentCheck.isInappropriate) {
			setError(`${contentCheck.reason} Try: ${contentCheck.suggestions?.join(', ') || 'family-friendly descriptions'}`);
			return;
		}

		// Check usage limits before starting workflow
		if (!canGenerateImages) {
			setError(`You have reached your monthly image generation limit. Please upgrade your plan to continue.`);
			return;
		}

		setError(null);
		
		// Increment generation counter to trigger new generation
		setGenerationCounter(prev => prev + 1);
		setShowWorkflow(true);
		

	};

	const handleWorkflowComplete = (designId: string, designData?: any) => {
		// Check if user came from DesignView
		const fromDesignView = sessionStorage.getItem('from_design_view');
		
		if (fromDesignView === 'true') {
			// User came from DesignView - navigate to the new design view page

			sessionStorage.removeItem('from_design_view');
			window.location.href = `/design/${designId}`;
		} else if (designData && designData.modelFiles) {
			// Normal flow: show the 3D viewer in the integrated view
			// Set 3D viewer state BEFORE hiding workflow to prevent flash
			setCompletedDesign(designData);
			setShow3DViewer(true);
			setShowWorkflow(false);
		} else {
			// Fallback: navigate to design view if no model data
			window.location.href = `/design/${designId}`;
		}
	};



	const handleWorkflowError = (errorMessage: string) => {
		setError(errorMessage);
		setShowWorkflow(false);
	};

	const handle3DViewerClose = () => {
		setShow3DViewer(false);
		setCompletedDesign(null);
	};

	const handle3DMakeOrder = (designId: string) => {
		// Navigate to checkout with the design data
		window.location.href = `/checkout/${designId}`;
	};

	const handle3DDownload = (designId: string) => {
		// Navigate to download page with the design data
		window.location.href = `/download/${designId}`;
	};

	const handleGenerateNewFromViewer = (newPrompt: string) => {

		
		// Switch back to image generation mode
		setShow3DViewer(false);
		setCompletedDesign(null);
		setShowWorkflow(false);
		
		// Update the prompt and trigger new generation
		setPrompt(newPrompt);
		setError(null);
		
		// Small delay to ensure state is updated before triggering workflow
		setTimeout(() => {

			setGenerationCounter(prev => prev + 1);
			setShowWorkflow(true);
		}, 200);
	};

	// Image upload handlers
	const handleImagesChange = (images: any[]) => {
		setUploadedImages(images);
		setIsUploadMode(images.length > 0);
		
		// Clear any existing workflow or 3D viewer when switching to upload mode
		if (images.length > 0) {
			setShowWorkflow(false);
			setShow3DViewer(false);
			setCompletedDesign(null);
		}
	};

	const toggleImageSelection = (imageId: string) => {
		const updatedImages = uploadedImages.map(img => 
			img.id === imageId ? { ...img, selected: !img.selected } : img
		);
		setUploadedImages(updatedImages);
	};

	const deleteImage = (imageId: string) => {
		const imageToDelete = uploadedImages.find(img => img.id === imageId);
		if (imageToDelete && imageToDelete.url && imageToDelete.url.startsWith('blob:')) {
			URL.revokeObjectURL(imageToDelete.url);
		}
		
		const updatedImages = uploadedImages.filter(img => img.id !== imageId);
		handleImagesChange(updatedImages);
	};

	const handleImageShare = async (selectedImages: any[]) => {
		if (selectedImages.length === 0) {
			toast.error('Please select at least one image to share');
			return;
		}
		
		try {
			console.log('=== STARTING IMAGE SHARE PROCESS ===');
			console.log('Selected images:', selectedImages);
			
			// Convert blob URLs to base64 data URLs immediately
			console.log('Converting images to base64 for sharing...');
			const convertedImages = await Promise.all(
				selectedImages.map(async (img, index) => {
					try {
						console.log(`Processing image ${index + 1}:`, img.url);
						if (img.url.startsWith('blob:')) {
							console.log(`Converting image ${index + 1} to base64...`);
							const response = await fetch(img.url);
							if (!response.ok) {
								throw new Error(`Failed to fetch blob: ${response.statusText}`);
							}
							const blob = await response.blob();
							console.log(`Blob size for image ${index + 1}:`, blob.size);
							
							return new Promise<typeof img>((resolve) => {
								const reader = new FileReader();
								reader.onload = () => {
									const result = reader.result as string;
									console.log(`Image ${index + 1} converted successfully, data URL length:`, result.length);
									resolve({
										...img,
										url: result,
										selected: true
									});
								};
								reader.onerror = (error) => {
									console.error(`Failed to convert image ${index + 1}:`, error);
									resolve({
										...img,
										selected: true
									});
								};
								reader.readAsDataURL(blob);
							});
						}
						console.log(`Image ${index + 1} already processed (not a blob URL)`);
						return {
							...img,
							selected: true
						};
					} catch (error) {
						console.error(`Error converting image ${index + 1}:`, error);
						return {
							...img,
							selected: true
						};
					}
				})
			);
			
			console.log('Conversion complete. Results:', convertedImages.map(img => ({
				id: img.id,
				urlType: img.url.startsWith('data:') ? 'base64' : img.url.startsWith('blob:') ? 'blob' : 'other',
				urlLength: img.url.length
			})));
			
			// Navigate to share page with converted images
			const imageData = {
				type: 'uploaded',
				images: convertedImages,
				userId: sessionStorage.getItem('user_id') || 'anonymous',
				createdAt: new Date().toISOString()
			};
			
			console.log('Storing converted image data:', imageData);
			
			// Store in session storage for share page
			sessionStorage.setItem('share_images', JSON.stringify(imageData));
			console.log('Data stored, navigating to share page...');
			window.location.href = '/share/images';
		} catch (error) {
			console.error('Error preparing images for sharing:', error);
			toast.error('Failed to prepare images for sharing');
		}
	};

	const clearUploadedImages = () => {
		// Revoke object URLs to prevent memory leaks
		uploadedImages.forEach(img => {
			if (img.url && img.url.startsWith('blob:')) {
				URL.revokeObjectURL(img.url);
			}
		});
		
		setUploadedImages([]);
		setIsUploadMode(false);
		setError(null);
		toast.success('Upload mode cleared');
	};

	const handleQualityChange = (quality: string) => {
		setSelectedQuality(quality);
	};

 const 	WorkspaceDropdown = ()=>{
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
	const handleClickOutside = (event: MouseEvent) => {
	  if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
		setOpen(false);
	  }
	};

	if (open) {
	  document.addEventListener('mousedown', handleClickOutside);
	}

	return () => {
	  document.removeEventListener('mousedown', handleClickOutside);
	};
  }, [open]);

  return (
	<div className='relative inline-block text-left' ref={dropdownRef}>
	  {/*Dropdown Button*/}
	  <Button 
		variant="ghost" 
		className="flex items-center gap-2 bg-transparent hover:bg-white/5 text-white px-2 py-2 transition-all duration-200 rounded-lg" 
		onClick={() => setOpen(!open)}
	  >
	   <img className="w-5 h-5" src="Asset 13.svg" alt="Workspace"/> 
	   <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`} />
	  </Button>
	  
	  {/* Dropdown Menu*/}
	  <AnimatePresence>
		{open && (
		  <motion.div
			initial={{ opacity: 0, scale: 0.95, y: -10 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95, y: -10 }}
			transition={{ duration: 0.2, ease: "easeOut" }}
			className="absolute mt-3 w-48 left-0 bg-[#313131] rounded-lg shadow-lg border border-gray-600 z-50 overflow-hidden"
		  >
			<div className="py-1">
			  <a 
				href="/dashboard" 
				className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-all duration-200 group rounded-lg"
			  >
				<svg className="w-4 h-4 text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
				  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
				</svg>
				<span className="font-medium text-white">Back to Workspace</span>
			  </a>
			</div>
		  </motion.div>
		)}
	  </AnimatePresence>
	</div>
  );
}

	const handleColorChange = (color: string) => {
		// Strategic Enhancement: Add color to properties aggregator
		addColor(color);
	};

	

	// SVG Icon Components
	const ColorIcon = () => (
		<svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white group-hover:text-[#FA7072] transition-colors duration-300">
			<path d="M4.16667 33.3333C3.02084 33.3333 2.04028 32.9257 1.225 32.1104C0.409725 31.2952 0.00139242 30.3139 3.53108e-06 29.1667C-0.00138536 28.0195 0.406948 27.0389 1.225 26.225C2.04306 25.4111 3.02361 25.0028 4.16667 25C5.30973 24.9972 6.29098 25.4056 7.11042 26.225C7.92987 27.0445 8.3375 28.025 8.33334 29.1667C8.32917 30.3083 7.92153 31.2896 7.11042 32.1104C6.29931 32.9313 5.31806 33.3389 4.16667 33.3333ZM20.8333 33.3333C19.6875 33.3333 18.707 32.9257 17.8917 32.1104C17.0764 31.2952 16.6681 30.3139 16.6667 29.1667C16.6653 28.0195 17.0736 27.0389 17.8917 26.225C18.7097 25.4111 19.6903 25.0028 20.8333 25C21.9764 24.9972 22.9576 25.4056 23.7771 26.225C24.5965 27.0445 25.0042 28.025 25 29.1667C24.9958 30.3083 24.5882 31.2896 23.7771 32.1104C22.966 32.9313 21.9847 33.3389 20.8333 33.3333ZM12.5 25C11.3542 25 10.3736 24.5924 9.55834 23.7771C8.74306 22.9618 8.33473 21.9806 8.33334 20.8333C8.33195 19.6861 8.74028 18.7056 9.55834 17.8917C10.3764 17.0778 11.3569 16.6695 12.5 16.6667C13.6431 16.6639 14.6243 17.0722 15.4438 17.8917C16.2632 18.7111 16.6708 19.6917 16.6667 20.8333C16.6625 21.975 16.2549 22.9563 15.4438 23.7771C14.6326 24.5979 13.6514 25.0056 12.5 25ZM29.1667 25C28.0208 25 27.0403 24.5924 26.225 23.7771C25.4097 22.9618 25.0014 21.9806 25 20.8333C24.9986 19.6861 25.4069 18.7056 26.225 17.8917C27.0431 17.0778 28.0236 16.6695 29.1667 16.6667C30.3097 16.6639 31.291 17.0722 32.1104 17.8917C32.9299 18.7111 33.3375 19.6917 33.3333 20.8333C33.3292 21.975 32.9215 22.9563 32.1104 23.7771C31.2993 24.5979 30.3181 25.0056 29.1667 25ZM4.16667 16.6667C3.02084 16.6667 2.04028 16.259 1.225 15.4438C0.409725 14.6285 0.00139242 13.6472 3.53108e-06 12.5C-0.00138536 11.3528 0.406948 10.3722 1.225 9.55835C2.04306 8.74446 3.02361 8.33612 4.16667 8.33335C5.30973 8.33057 6.29098 8.7389 7.11042 9.55835C7.92987 10.3778 8.3375 11.3583 8.33334 12.5C8.32917 13.6417 7.92153 14.6229 7.11042 15.4438C6.29931 16.2646 5.31806 16.6722 4.16667 16.6667ZM20.8333 16.6667C19.6875 16.6667 18.707 16.259 17.8917 15.4438C17.0764 14.6285 16.6681 13.6472 16.6667 12.5C16.6653 11.3528 17.0736 10.3722 17.8917 9.55835C18.7097 8.74446 19.6903 8.33612 20.8333 8.33335C21.9764 8.33057 22.9576 8.7389 23.7771 9.55835C24.5965 10.3778 25.0042 11.3583 25 12.5C24.9958 13.6417 24.5882 14.6229 23.7771 15.4438C22.966 16.2646 21.9847 16.6722 20.8333 16.6667ZM12.5 8.33335C11.3542 8.33335 10.3736 7.92571 9.55834 7.11043C8.74306 6.29515 8.33473 5.3139 8.33334 4.16668C8.33195 3.01946 8.74028 2.0389 9.55834 1.22501C10.3764 0.411125 11.3569 0.00279185 12.5 1.40766e-05C13.6431 -0.0027637 14.6243 0.405569 15.4438 1.22501C16.2632 2.04446 16.6708 3.02501 16.6667 4.16668C16.6625 5.30835 16.2549 6.2896 15.4438 7.11043C14.6326 7.93126 13.6514 8.3389 12.5 8.33335ZM29.1667 8.33335C28.0208 8.33335 27.0403 7.92571 26.225 7.11043C25.4097 6.29515 25.0014 5.3139 25 4.16668C24.9986 3.01946 25.4069 2.0389 26.225 1.22501C27.0431 0.411125 28.0236 0.00279185 29.1667 1.40766e-05C30.3097 -0.0027637 31.291 0.405569 32.1104 1.22501C32.9299 2.04446 33.3375 3.02501 33.3333 4.16668C33.3292 5.30835 32.9215 6.2896 32.1104 7.11043C31.2993 7.93126 30.3181 8.3389 29.1667 8.33335Z" fill="currentColor"/>
		</svg>
	);

	const MaterialIcon = () => (
		<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white group-hover:text-[#FA7072] transition-colors duration-300">
			<path fillRule="evenodd" clipRule="evenodd" d="M33.8 0C34.2774 0 34.7352 0.189643172 35.0728 0.527208C35.4104 0.864774 35.6 1.32261 35.6 1.8V17.8C35.6 18.2774 35.4104 18.7352 35.0728 19.0728C34.7352 19.4104 34.2774 19.6 33.8 19.6C33.3226 19.6 32.8648 19.4104 32.5272 19.0728C32.1896 18.7352 32 18.2774 32 17.8V6.144L6.144 32H17.8C18.2774 32 18.7352 32.1896 19.0728 32.5272C19.4104 32.8648 19.6 33.3226 19.6 33.8C19.6 34.2774 19.4104 34.7352 19.0728 35.0728C18.7352 35.4104 18.2774 35.6 17.8 35.6H1.8C1.32261 35.6 0.864774 35.4104 0.527208 35.0728C0.189643 34.7352 0 34.2774 0 33.8V17.8C-7.04465e-09 17.5636 0.0465588 17.3296 0.137017 17.1112C0.227476 16.8928 0.360063 16.6944 0.527208 16.5272C0.694354 16.3601 0.892784 16.2275 1.11117 16.137C1.32956 16.0466 1.56362 16 1.8 16C2.03638 16 2.27044 16.0466 2.48883 16.137C2.70722 16.2275 2.90565 16.3601 3.07279 16.5272C3.23994 16.6944 3.37252 16.8928 3.46298 17.1112C3.55344 17.3296 3.6 17.5636 3.6 17.8V29.456L29.456 3.6H17.8C17.3226 3.6 16.8648 3.41036 16.5272 3.07279C16.1896 2.73523 16 2.27739 16 1.8C16 1.32261 16.1896 0.864774 16.5272 0.527208C16.8648 0.189643 17.3226 0 17.8 0H33.8Z" fill="currentColor"/>
		</svg>
	);

	const SizeIcon = () => (
		<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white group-hover:text-[#FA7072] transition-colors duration-300">
			<path d="M0 1.40625C0 1.03329 0.148158 0.675604 0.411881 0.411881C0.675604 0.148158 1.03329 0 1.40625 0L15.4688 0C15.8417 0 16.1994 0.148158 16.4631 0.411881C16.7268 0.675604 16.875 1.03329 16.875 1.40625V16.2478L28.5384 4.62937C28.8021 4.36574 29.1598 4.21764 29.5327 4.21764C29.9055 4.21764 30.2632 4.36574 30.5269 4.62937L40.4691 14.5744C40.6 14.705 40.7039 14.8602 40.7748 15.031C40.8457 15.2019 40.8822 15.385 40.8822 15.57C40.8822 15.755 40.8457 15.9381 40.7748 16.109C40.7039 16.2798 40.6 16.435 40.4691 16.5656L28.8591 28.125H43.5938C43.9667 28.125 44.3244 28.2732 44.5881 28.5369C44.8518 28.8006 45 29.1583 45 29.5312V43.5938C45 43.9667 44.8518 44.3244 44.5881 44.5881C44.3244 44.8518 43.9667 45 43.5938 45H8.4375C6.19992 44.9995 4.05416 44.1103 2.47219 42.5278C0.919703 40.9763 0.0329066 38.8809 0 36.6862M16.875 36.0956L37.485 15.5644L29.5284 7.61063L16.875 20.2163V36.0956ZM12.6562 36.5625C12.6562 35.4436 12.2118 34.3706 11.4206 33.5794C10.6294 32.7882 9.55638 32.3438 8.4375 32.3438C7.31862 32.3438 6.24556 32.7882 5.45439 33.5794C4.66322 34.3706 4.21875 35.4436 4.21875 36.5625C4.21875 37.6814 4.66322 38.7544 5.45439 39.5456C6.24556 40.3368 7.31862 40.7812 8.4375 40.7812C9.55638 40.7812 10.6294 40.3368 11.4206 39.5456C12.2118 38.7544 12.6562 37.6814 12.6562 36.5625ZM42.1875 42.1875V30.9375H26.0381L14.7459 42.1875H42.1875Z" fill="currentColor"/>
		</svg>
	);

	const StyleIcon = () => (
		<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white group-hover:text-[#FA7072] transition-colors duration-300">
			<path d="M1.5 24.0585C1.5 35.637 10.2008 45.1793 21.4058 46.4685C23.0595 46.6598 24.6615 45.9555 25.8383 44.7742C26.5445 44.0657 26.941 43.1061 26.941 42.1058C26.941 41.1054 26.5445 40.1458 25.8383 39.4373C24.6615 38.256 23.7008 36.4965 24.5895 35.0858C28.1355 29.4428 46.5 42.4005 46.5 24.0608C46.5 11.598 36.4267 1.5 24 1.5C11.5733 1.5 1.5 11.6002 1.5 24.0585Z" stroke="currentColor" strokeWidth="3"/>
			<path d="M36.375 24.5625C37.307 24.5625 38.0625 23.807 38.0625 22.875C38.0625 21.943 37.307 21.1875 36.375 21.1875C35.443 21.1875 34.6875 21.943 34.6875 22.875C34.6875 23.807 35.443 24.5625 36.375 24.5625Z" fill="currentColor" stroke="currentColor" strokeWidth="3"/>
			<path d="M11.625 24.5625C12.557 24.5625 13.3125 23.807 13.3125 22.875C13.3125 21.943 12.557 21.1875 11.625 21.1875C10.693 21.1875 9.9375 21.943 9.9375 22.875C9.9375 23.807 10.693 24.5625 11.625 24.5625Z" fill="currentColor" stroke="currentColor" strokeWidth="3"/>
			<mask id="mask0_960_5026" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="15" y="9" width="7" height="8">
				<path d="M18.5662 10.875C19.0634 10.875 19.5407 11.0722 19.8923 11.4238C20.244 11.7755 20.4412 12.2527 20.4412 12.75C20.4412 13.2473 20.244 13.7245 19.8923 14.0762C19.5407 14.4278 19.0634 14.625 18.5662 14.625C18.0689 14.625 17.5916 14.4278 17.24 14.0762C16.8884 13.7245 16.6912 13.2473 16.6912 12.75C16.6912 12.2527 16.8884 11.7755 17.24 11.4238C17.5916 11.0722 18.0689 10.875 18.5662 10.875Z" fill="white" stroke="white" strokeWidth="3"/>
			</mask>
			<g mask="url(#mask0_960_5026)">
				<path d="M21.9412 12.75C21.9412 13.6451 21.5856 14.5036 20.9526 15.1365C20.3197 15.7694 19.4613 16.125 18.5662 16.125C17.6711 16.125 16.8126 15.7694 16.1797 15.1365C15.5467 14.5036 15.1912 13.6451 15.1912 12.75C15.1912 11.8549 15.5467 10.9964 16.1797 10.3635C16.8126 9.73058 17.6711 9.375 18.5662 9.375C19.4613 9.375 20.3197 9.73058 20.9526 10.3635C21.5856 10.9964 21.9412 11.8549 21.9412 12.75Z" fill="currentColor" stroke="currentColor" strokeWidth="3"/>
			</g>
			<mask id="mask1_960_5026" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="26" y="9" width="7" height="8">
				<path d="M29.625 10.875C30.1223 10.875 30.5995 11.0722 30.9512 11.4238C31.3028 11.7755 31.5 12.2527 31.5 12.75C31.5 13.2473 31.3028 13.7245 30.9512 14.0762C30.5995 14.4278 30.1223 14.625 29.625 14.625C29.1277 14.625 28.6505 14.4278 28.2988 14.0762C27.9472 13.7245 27.75 13.2473 27.75 12.75C27.75 12.2527 27.9472 11.7755 28.2988 11.4238C28.6505 11.0722 29.1277 10.875 29.625 10.875Z" fill="white" stroke="white" strokeWidth="3"/>
			</mask>
			<g mask="url(#mask1_960_5026)">
				<path d="M33 12.75C33 13.6451 32.6444 14.5036 32.0115 15.1365C31.3786 15.7694 30.5201 16.125 29.625 16.125C28.7299 16.125 27.8714 15.7694 27.2385 15.1365C26.6056 14.5036 26.25 13.6451 26.25 12.75C26.25 11.8549 26.6056 10.9964 27.2385 10.3635C27.8714 9.73058 28.7299 9.375 29.625 9.375C30.5201 9.375 31.3786 9.73058 32.0115 10.3635C32.6444 10.9964 33 11.8549 33 12.75Z" fill="currentColor" stroke="currentColor" strokeWidth="3"/>
			</g>
		</svg>
	);

	const ProductionIcon = () => (
		<svg width="30" height="32" viewBox="0 0 30 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white group-hover:text-[#FA7072] transition-colors duration-300">
			<path d="M29.2146 7.9201C28.6979 7.03496 27.9524 6.30537 27.0562 5.80802L17.8062 0.705102C16.9462 0.242268 15.9848 0 15.0081 0C14.0315 0 13.07 0.242268 12.21 0.705102L2.96 5.80802C2.06388 6.30537 1.3183 7.03496 0.801667 7.9201C0.277492 8.80731 0.000667015 9.81878 0 10.8493V20.7314C0.00720179 21.7576 0.284568 22.7638 0.804188 23.6488C1.32381 24.5338 2.06735 25.2663 2.96 25.7726L12.21 30.8601C13.0661 31.3352 14.029 31.5846 15.0081 31.5846C15.9872 31.5846 16.9502 31.3352 17.8062 30.8601L27.0562 25.7572C27.9512 25.2588 28.6963 24.5298 29.2141 23.6459C29.7319 22.7621 30.0036 21.7557 30.0008 20.7314V10.9264C30.0269 9.87024 29.7544 8.8282 29.2146 7.9201ZM27.6729 20.7314C27.6791 21.3445 27.5189 21.9479 27.2094 22.4773C26.9 23.0066 26.4528 23.4422 25.9154 23.7376L16.6654 28.8405C16.503 28.932 16.3334 29.0039 16.1567 29.0564V16.4455L27.4108 9.6776C27.5527 10.0507 27.6205 10.4484 27.6112 10.8493L27.6729 20.7314Z" fill="currentColor"/>
		</svg>
	);

	const DetailIcon = () => (
		<svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white group-hover:text-[#FA7072] transition-colors duration-300">
			<path d="M23.8123 24.7188L30.6962 31.6026L14.9552 47.3424C14.0421 48.2548 12.8041 48.7673 11.5133 48.7673C10.2225 48.7673 8.98449 48.2548 8.07137 47.3424C7.15899 46.4293 6.64648 45.1913 6.64648 43.9004C6.64648 42.6096 7.15899 41.3716 8.07137 40.4585L23.8123 24.7188Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
			<path d="M30.6965 31.6027L35.9564 26.344C37.0221 26.8805 38.0069 27.811 38.7718 28.925L37.9344 29.7612C37.753 29.9425 37.6091 30.1578 37.5109 30.3948C37.4127 30.6318 37.3621 30.8858 37.3621 31.1423C37.3621 31.3989 37.4127 31.6529 37.5109 31.8898C37.6091 32.1268 37.753 32.3421 37.9344 32.5235L40.1831 34.771C40.5493 35.137 41.0459 35.3427 41.5636 35.3427C42.0814 35.3427 42.578 35.137 42.9442 34.771L50.7826 26.9337C51.1487 26.5675 51.3543 26.071 51.3543 25.5532C51.3543 25.0354 51.1487 24.5388 50.7826 24.1727L48.5351 21.924C48.3538 21.7423 48.1384 21.5983 47.9013 21.5C47.6642 21.4016 47.4101 21.351 47.1534 21.351C46.8967 21.351 46.6426 21.4016 46.4055 21.5C46.1684 21.5983 45.953 21.7423 45.7717 21.924L44.2613 23.4344L42.0983 21.2715C42.0983 21.2715 43.2765 18.166 40.2786 15.1682C35.154 10.0424 28.014 5.90267 18.5902 13.0669C17.4217 13.955 18.0477 15.8473 19.5146 15.8968C27.5983 16.1711 28.2569 20.2758 28.2569 20.2758L23.8126 24.7188" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
		</svg>
	);

	// Advanced mode sections - Rearranged icons
	const sections = {
		color: {
			title: 'Color',
			icon: <StyleIcon />
		},
		material: {
			title: 'Material',
			icon: <SizeIcon />
		},
		size: {
			title: 'Size',
			icon: <MaterialIcon />
		},
		style: {
			title: 'Style',
			icon: <ColorIcon />
		},
		production: {
			title: 'Production',
			icon: <DetailIcon />
		},
		detail: {
			title: 'Detail',
			icon: <ProductionIcon />
		}
	};

	const renderSizeSelector = () => {
		return (
			<div className="flex flex-col items-center text-center w-full px-3" style={{ transform: 'scale(0.99)', transformOrigin: 'top center' }}>
				{/* Breadcrumb Navigation */}
				<div className="mb-4 flex items-center gap-1 text-base font-thin">
					<button 
						onClick={handleBackToCategories}
						className="text-white/70 hover:text-white transition-colors cursor-pointer"
					>
						Size
					</button>
					<span className="text-white/30">{'>'}</span>
					<span className="text-white/90">Size guide</span>
				</div>

				{/* Size Selector */}
				<div className="mb-4">
					<SizeSelector
						selectedSize={selectedSize}
						onSizeChange={handleSizeChange}
						customWidth={customWidth}
						customHeight={customHeight}
						onCustomSizeChange={handleCustomSizeChange}
					/>
				</div>

				{/* Create Button with Arrow */}
				<div className="mt-[-48px] flex items-center justify-center gap-3 relative z-50">
					<button 
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();

							handleBackToCategories();
						}}
						className="w-10 h-10 rounded-full border border-white/20 hover:border-white/40 text-white transition-all duration-300 ease-out hover:scale-105 flex items-center justify-center relative z-50 pointer-events-auto"
						style={{ zIndex: 9999 }}
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<button 
						onClick={handleCreateClick}
						disabled={!canGenerateImages}
						className={`px-6 py-3 w-[133px] h-[54px] rounded-[40px] font-medium text-sm transition-all duration-300 ease-out hover:scale-105 shadow-lg ${
							!canGenerateImages
								? 'bg-gray-400 text-gray-200 cursor-not-allowed'
								: 'bg-[#313131] hover:bg-[#414141] text-white shadow-lg'
						} ${isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}
					>
						Create
					</button>
				</div>
			</div>
		);
	};

	const renderProductionSelector = () => {
		return (
			<div className="flex flex-col items-center text-center w-full" style={{ transform: 'scale(0.99)', transformOrigin: 'top center' }}>
				{/* Breadcrumb Navigation */}
				<div className="mb-4 flex items-center gap-1 text-base font-thin">
					<button 
						onClick={handleBackToCategories}
						className="text-white/70 hover:text-white transition-colors cursor-pointer"
					>
						Production
					</button>
					<span className="text-white/30">{'>'}</span>
					<span className="text-white/90">Select method</span>
				</div>

				{/* Production Selector */}
				<div>
					<ProductionSelector
						selectedProduction={selectedProduction}
						onProductionChange={handleProductionChange}
					/>
				</div>

				{/* Create Button with Arrow */}
				<div className="mt-1 flex items-center justify-center gap-3 relative z-50">
					<button 
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();

							handleBackToCategories();
						}}
						className="w-10 h-10 rounded-full border border-white/20 hover:border-white/40 text-white transition-all duration-300 ease-out hover:scale-105 flex items-center justify-center relative z-50 pointer-events-auto"
						style={{ zIndex: 9999 }}
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<button 
						onClick={handleCreateClick}
						disabled={!canGenerateImages}
						className={`px-6 py-3 w-[133px] h-[54px] rounded-[40px] font-medium text-sm transition-all duration-300 ease-out hover:scale-105 shadow-lg ${
							!canGenerateImages
								? 'bg-gray-400 text-gray-200 cursor-not-allowed'
								: 'bg-[#313131] hover:bg-[#414141] text-white shadow-lg'
						} ${isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}
					>
						Create
					</button>
				</div>
			</div>
		);
	};

	const renderStyleSelector = () => {
		return (
			<div className="flex flex-col items-center text-center w-full" style={{ transform: 'scale(0.99)', transformOrigin: 'top center' }}>
				{/* Breadcrumb Navigation */}
				<div className="mb-4 flex items-center gap-1 text-base font-thin">
					<button 
						onClick={handleBackToCategories}
						className="text-white/70 hover:text-white transition-colors cursor-pointer"
					>
						Style
					</button>
					<span className="text-white/30">{'>'}</span>
					<span className="text-white/90">Choose Style</span>
				</div>

				{/* Style Selector */}
				<div>
					<StyleSelector
						selectedStyle={selectedStyle}
						onStyleChange={handleStyleChange}
					/>
				</div>

				{/* Create Button with Arrow */}
				<div className="mt-1 flex items-center justify-center gap-3 relative z-50">
					<button 
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();

							handleBackToCategories();
						}}
						className="w-10 h-10 rounded-full border border-white/20 hover:border-white/40 text-white transition-all duration-300 ease-out hover:scale-105 flex items-center justify-center relative z-50 pointer-events-auto"
						style={{ zIndex: 9999 }}
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<button 
						onClick={handleCreateClick}
						disabled={!canGenerateImages}
						className={`px-6 py-3 w-[133px] h-[54px] rounded-[40px] font-medium text-sm transition-all duration-300 ease-out hover:scale-105 shadow-lg ${
							!canGenerateImages
								? 'bg-gray-400 text-gray-200 cursor-not-allowed'
								: 'bg-[#313131] hover:bg-[#414141] text-white shadow-lg'
						} ${isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}
					>
						Create
					</button>
				</div>
			</div>
		);
	};

	const renderMaterialSelector = () => {
		return (
			<div className="flex flex-col items-center text-center w-full px-3" style={{ transform: 'scale(0.99)', transformOrigin: 'top center' }}>
				{/* Breadcrumb Navigation */}
				<div className="mb-2 flex items-center gap-1 text-base font-thin">
					<button 
						onClick={handleBackToCategories}
						className="text-white/70 hover:text-white transition-colors cursor-pointer"
					>
						Material
					</button>
					<span className="text-white/30">{'>'}</span>
					<span className="text-white/90">Material Mapping</span>
				</div>

				{/* Material Selector */}
				<div>
					<MaterialSelector
						selectedMaterial={selectedMaterial}
						onMaterialChange={handleMaterialChange}
					/>
				</div>

				{/* Create Button with Arrow */}
				<div className="mt-2 flex items-center justify-center gap-3 relative z-50">
					<button 
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();

							handleBackToCategories();
						}}
						className="w-10 h-10 rounded-full border border-white/20 hover:border-white/40 text-white transition-all duration-300 ease-out hover:scale-105 flex items-center justify-center relative z-50 pointer-events-auto"
						style={{ zIndex: 9999 }}
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<button 
						onClick={handleCreateClick}
						disabled={!canGenerateImages}
						className={`px-6 py-3 w-[133px] h-[54px] rounded-[40px] font-medium text-sm transition-all duration-300 ease-out hover:scale-105 shadow-lg ${
							!canGenerateImages
								? 'bg-gray-400 text-gray-200 cursor-not-allowed'
								: 'bg-[#313131] hover:bg-[#414141] text-white shadow-lg'
						} ${isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}
					>
						Create
					</button>
				</div>
			</div>
		);
	};
	const renderDetailSelector = () => {
		return (
			<div className="flex flex-col items-center text-center w-full" style={{ transform: 'scale(0.99)', transformOrigin: 'top center' }}>
				{/* Breadcrumb Navigation */}
				<div className="mb-4 flex items-center gap-1 text-base font-thin">
					<button 
						onClick={handleBackToCategories}
						className="text-white/70 hover:text-white transition-colors cursor-pointer"
					>
						Detail
					</button>
					<span className="text-white/30">{'>'}</span>
					<span className="text-white/90">Select Multiple</span>
				</div>

				{/* Detail Selector */}
				<div>
					<DetailSelector
						selectedDetails={selectedDetails}
						onDetailChange={handleDetailChange}
					/>
				</div>

				{/* Create Button with Arrow */}
				<div className="mt-1 flex items-center justify-center gap-3 relative z-50">
					<button 
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();

							handleBackToCategories();
						}}
						className="w-10 h-10 rounded-full border border-white/20 hover:border-white/40 text-white transition-all duration-300 ease-out hover:scale-105 flex items-center justify-center relative z-50 pointer-events-auto"
						style={{ zIndex: 9999 }}
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<button 
						onClick={handleCreateClick}
						disabled={!canGenerateImages}
						className={`px-6 py-3 w-[133px] h-[54px] rounded-[40px] font-medium text-sm transition-all duration-300 ease-out hover:scale-105 shadow-lg ${
							!canGenerateImages
								? 'bg-gray-400 text-gray-200 cursor-not-allowed'
								: 'bg-[#313131] hover:bg-[#414141] text-white shadow-lg'
						} ${isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}
					>
						Create
					</button>
				</div>
			</div>
		);
	};

	const renderColorPalette = () => {
		return (
			<div className="flex flex-col items-center text-center w-full" style={{ transform: 'scale(0.99)', transformOrigin: 'top center' }}>
				{/* Breadcrumb Navigation */}
				<div className="mb-4 flex items-center gap-1 text-base font-thin">
					<button 
						onClick={handleBackToCategories}
						className="text-white/70 hover:text-white transition-colors cursor-pointer"
					>
						Color
					</button>
					<span className="text-white/30">{'>'}</span>
					<span className="text-white/90">Swatch</span>
				</div>

				{/* iro.js Color Picker */}
				<div>
					<div style={{ transform: 'scale(0.8)', transformOrigin: 'top center', overflow: 'hidden' }}>
						<ColorPicker
						onColorChange={handleColorChange}
						/>
					</div>
				</div>

				{/* Create Button with Arrow */}
				<div className="mt-1 flex mt-[-30px] items-center justify-center gap-1 relative z-50">
					<button 
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();

							handleBackToCategories();
						}}
						className="w-10 h-10 rounded-full border border-white/20 hover:border-white/40 text-white transition-all duration-300 ease-out hover:scale-105 flex items-center justify-center relative z-50 pointer-events-auto"
						style={{ zIndex: 9999 }}
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<button 
						onClick={handleCreateClick}
						disabled={!canGenerateImages}
						className={`px-6 py-3  w-[133px] h-[54px] rounded-[40px] font-medium text-sm transition-all duration-300 ease-out hover:scale-105 shadow-lg ${
							!canGenerateImages
								? 'bg-gray-400 text-gray-200 cursor-not-allowed'
								: 'bg-[#313131] hover:bg-[#414141] text-white shadow-lg'
						} ${isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}
					>
						Create
					</button>
				</div>
			</div>
		);
	};

	
	const renderAdvancedCategories = () => {
		// Check which categories have selections
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
			<div className="flex flex-col items-center justify-start text-center w-full h-full pt-8">
				{/* Category Icons Grid */}
				<div className="flex flex-wrap justify-between gap-y-8 w-full max-w-[480px] mx-auto">
					{Object.entries(sections).map(([key, section], index) => {
						const isSelected = categoryStatus[key as keyof typeof categoryStatus];
						return (
							<div
								key={key}
								className="flex flex-col items-center justify-center gap-3 p-3 transition-all duration-200 cursor-pointer relative group rounded-lg"
								style={{ 
									transitionDelay: `${400 + index * 50}ms`,
									width: 'calc(33.333% - 4px)',
									textAlign: 'center'
								}}
								onClick={() => handleCategoryClick(key)}
							>
								{isSelected && (
									<div className="absolute -top-1 right-1 w-3 h-3 bg-[#313131] rounded-full flex items-center justify-center">
										<svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
										</svg>
									</div>
								)}
							<div className="w-12 h-12 transition-colors duration-200 group-hover:text-white text-white/90" style={{ transform: 'scale(1.3)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									{section.icon}
								</div>
							<span className="text-[12px] font-normal text-white/70 group-hover:text-white/90 transition-colors duration-200" style={{ textAlign: 'center', width: '100%', display: 'block' }}>
									{section.title}
								</span>
							</div>
						);
					})}
				</div>

				{/* Create Button with Back */}
				<div className="mt-8 flex items-center justify-center gap-3">
					<button 
						onClick={handleBackToCategories}
						className="w-10 h-10 rounded-full border border-white/40 text-white transition-all duration-300 ease-out hover:scale-105 flex items-center justify-center"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<button 
						onClick={handleCreateClick}
						disabled={!canGenerateImages}
						className={`w-[133px] h-[54px] rounded-[40px] font-medium text-sm transition-all duration-700 delay-600 ease-out ${
							!canGenerateImages
								? 'bg-gray-400 text-gray-200 cursor-not-allowed'
								: 'bg-[#313131] hover:bg-[#414141] text-white'
						} ${isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}
					>
						Create
					</button>
				</div>
			</div>
		);
	};
	
	// Mobile Chat View
	if (isMobile) {
		return (
			<>
				<SEO 
					title="Design Playground - Create Your Toy"
					description="Use our AI-powered playground to design custom 3D toys. Choose colors, materials, styles and bring your imagination to life with advanced or basic mode."
					keywords="toy playground, 3D design tool, AI toy creator, custom toy design, color picker, material selector, toy customization"
					url="/design"
				/>
				<div className="w-screen h-screen bg-[#2c2c2c] flex flex-col fixed inset-0 overflow-hidden">
					{/* Mobile Header - Clean with Inter font */}
					<div className="bg-[#2c2c2c] text-white px-4 py-3 flex items-center gap-2">
						<button
							onClick={() => window.location.href = '/dashboard'}
							className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>
						<h1 className="text-lg font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Cudliy</h1>
					</div>

					{/* Chat Interface */}
					<div className="flex-1 overflow-hidden">
						<ChatStyleMobileWorkflow onError={setError} />
					</div>

					{/* Error Toast */}
					{error && (
						<div className="absolute bottom-4 left-4 right-4 bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between">
							<span className="text-sm">{error}</span>
							<button onClick={() => setError(null)} className="ml-2">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					)}
				</div>
			</>
		);
	}

	// Desktop View
	return (
		<>
			<SEO 
				title="Design Playground - Create Your Toy"
				description="Use our AI-powered playground to design custom 3D toys. Choose colors, materials, styles and bring your imagination to life with advanced or basic mode."
				keywords="toy playground, 3D design tool, AI toy creator, custom toy design, color picker, material selector, toy customization"
				url="/design"
			/>
			<div className="w-screen h-screen bg-[#212121] flex justify-center p-0 fixed inset-0 overflow-hidden">
			
			{/* Conditional Left Sidebar */}
			{show3DViewer && completedDesign ? (
				/* DesignView Style Left Pane for 3D Controls */
				<DesignViewLeftPane
					lighting={lighting3D}
					setLighting={setLighting3D}
					background={background3D}
					setBackground={setBackground3D}
					size={size3D}
					setSize={setSize3D}
					cameraAngle={cameraAngle3D}
					setCameraAngle={setCameraAngle3D}
					onClose={handle3DViewerClose}
					onGenerateNew={handleGenerateNewFromViewer}
				/>
			) : (
				/* Original DesignPage Left Sidebar */
				<aside className={`left-pane-scale bg-[#313131] border border-white/5 ${
					isLoaded ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-8'
				} transition-all duration-500 relative flex-shrink-0 overflow-hidden`}
				style={{
					width: 'clamp(400px, 476px, 476px)',
					minWidth: '400px',
					height: 'calc(100vh - 8px)',
					borderRadius: '20px',
					margin: '4px 0 4px 4px'
				}}>
				{/* Workspace Dropdown */}
			<div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
				<WorkspaceDropdown/>
			</div>

			{/* Cancel Button - Top Right */}
			{showWorkflow && (
				<div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
					<button
						onClick={() => {
							setShowWorkflow(false);
							setError(null);
						}}
						className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			)}


				
							{/* Brand and title area */}
			<div className="left-pane-content pt-[5.5rem] pb-2 text-white flex flex-col h-full overflow-hidden" style={{ 
				scrollbarWidth: 'none', 
				msOverflowStyle: 'none',
				paddingLeft: 'clamp(20px, 2vw, 40px)',
				paddingRight: 'clamp(20px, 2vw, 40px)'
			}}>
					
					{/* Title and Input Container - Same Width */}
					<div className={`w-full max-w-[420px] transition-all duration-500 ease-out ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					} ${isAdvanced ? 'mt-6' : 'mt-32'}`}>
						{/* Title - Make It Memorable */}
						<h1
							className="font-abril leading-[1.1] tracking-tight text-center font-normal w-full text-white mb-4"
							style={{ 
								fontFamily: 'CudliyTrademark, Abril Fatface, serif',
								fontSize: 'clamp(30px, 7vw, 42.5px)'
							}}
						>
							Make It Memorable
						</h1>
						
						{/* Input Field with Icon Dropdown */}
						{/* Main Input Container - Dark Style */}
						<div className="relative w-full bg-[#515151]" style={{ height: '100px', borderRadius: '25px' }}>
							{/* Input Field - Top portion */}
							<input
								placeholder="Ask Cudliy"
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault();
										handleCreateClick();
									}
								}}
								className="w-full pt-3 pb-10 pl-6 pr-20 bg-transparent text-white placeholder-gray-400 border-none focus:outline-none text-sm"
								style={{ borderRadius: '25px' }}
							/>
							
							{/* Up arrow button - #313131 when empty, white when typing */}
							<button
								onClick={handleCreateClick}
								disabled={!prompt.trim() || !canGenerateImages}
								className={`absolute right-4 top-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
									!prompt.trim() || !canGenerateImages
										? 'bg-[#313131] cursor-not-allowed'
										: 'bg-white hover:bg-gray-100'
								}`}
							>
								<svg className={`w-5 h-5 transition-colors ${
									!prompt.trim() || !canGenerateImages
										? 'text-gray-400'
										: 'text-black'
								}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
								</svg>
							</button>

							{/* Bottom row with icons - INSIDE the field */}
							<div className="absolute bottom-4 left-0 right-0 flex items-center justify-between px-4">
								{/* Plus button - left */}
								<button
									type="button"
									onClick={() => {
										if (showWorkflow || show3DViewer) {
											toast.info('Please complete or cancel current session first');
										} else {
											document.getElementById('image-upload-input')?.click();
										}
									}}
									className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
									</svg>
								</button>
								
								{/* Hidden file input for image upload */}
								<input
									id="image-upload-input"
									type="file"
									multiple
									accept="image/*"
									onChange={async (e) => {
										if (e.target.files) {
											setIsProcessingFiles(true);
											
											try {
												const files = Array.from(e.target.files);
												
												// Check if adding these files would exceed the 5 image limit
												if (files.length + uploadedImages.length > 5) {
													toast.error(`Cannot upload ${files.length} images. Maximum 5 images allowed (currently have ${uploadedImages.length}).`);
													return;
												}
												
												// Validate file sizes and types
												const maxFileSize = 100 * 1024 * 1024; // 100MB in bytes
												const validFiles: File[] = [];
												const errors: string[] = [];
												
												files.forEach((file) => {
													// Check file size
													if (file.size > maxFileSize) {
														errors.push(`${file.name} is too large (${formatFileSize(file.size)}). Maximum size is 100MB.`);
														return;
													}
													
													// Check if file size is 0 (corrupted file)
													if (file.size === 0) {
														errors.push(`${file.name} appears to be empty or corrupted.`);
														return;
													}
													
													// Check file type
													if (!file.type.startsWith('image/')) {
														errors.push(`${file.name} is not a valid image file.`);
														return;
													}
													
													// Additional check for common image formats
													const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
													if (!allowedTypes.includes(file.type.toLowerCase())) {
														errors.push(`${file.name} format not supported. Please use JPEG, PNG, WebP, or GIF.`);
														return;
													}
													
													validFiles.push(file);
												});
												
												// Show errors if any
												if (errors.length > 0) {
													errors.forEach(error => toast.error(error));
													if (validFiles.length === 0) {
														return; // Don't proceed if no valid files
													}
												}
												
												// Process valid files
												if (validFiles.length > 0) {
													const newImages = validFiles.map(file => ({
														id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
														file,
														url: URL.createObjectURL(file),
														selected: false
													}));
													
													handleImagesChange([...uploadedImages, ...newImages]);
													
													// Show success message
													if (validFiles.length === 1) {
														toast.success(`Image uploaded successfully`);
													} else {
														toast.success(`${validFiles.length} images uploaded successfully`);
													}
												}
											} catch (error) {
												console.error('Error processing files:', error);
												toast.error('An error occurred while processing the files. Please try again.');
											} finally {
												setIsProcessingFiles(false);
											}
										}
										e.target.value = ''; // Reset input
									}}
									className="hidden"
								/>

								{/* Right side icons */}
								<div className="flex items-center gap-1">
									{/* Model selector with 3D box icon */}
									<div className="relative" style={{ zIndex: 9999999 }}>
										<ModelDropdown 
											selectedQuality={selectedQuality}
											onQualityChange={handleQualityChange}
											use3DIcon={true}
										/>
									</div>

									{/* Advanced settings icon */}
									<button
										type="button"
										onClick={handleAdvancedClick}
										className={`w-7 h-7 flex items-center justify-center transition-all ${
											isAdvanced || hasProperties()
												? 'text-white'
												: 'text-gray-300'
										}`}
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
										</svg>
									</button>
								</div>
							</div>
						</div>

					</div>

					{/* Example Prompts - Only show in basic mode */}
					{!isAdvanced && (
						<div className={`mt-6 w-full max-w-[420px] space-y-3 transition-all duration-700 delay-600 ease-out ${
							isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
						}`}>
						<button
							onClick={() => {
								const promptText = "Birthday Gift for my Mom";
								setPrompt(promptText);
								setError(null);
								// Don't auto-trigger workflow - let user click Create button
							}}
							className="w-full text-left text-white hover:text-white/80 transition-colors"
							style={{
								fontFamily: 'Manrope, sans-serif',
								fontWeight: 400,
								fontSize: '14px',
								lineHeight: '20px',
								letterSpacing: '0px'
							}}
						>
							Birthday Gift for my Mom
						</button>
						<button
							onClick={() => {
								const promptText = "Gift for my partner";
								setPrompt(promptText);
								setError(null);
								// Don't auto-trigger workflow - let user click Create button
							}}
							className="w-full text-left text-white hover:text-white/80 transition-colors"
							style={{
								fontFamily: 'Manrope, sans-serif',
								fontWeight: 400,
								fontSize: '14px',
								lineHeight: '20px',
								letterSpacing: '0px'
							}}
						>
							Gift for my partner
						</button>
						<button
							onClick={() => {
								const promptText = "Graduation gift for my Daughter";
								setPrompt(promptText);
								setError(null);
								// Don't auto-trigger workflow - let user click Create button
							}}
							className="w-full text-left text-white hover:text-white/80 transition-colors"
							style={{
								fontFamily: 'Manrope, sans-serif',
								fontWeight: 400,
								fontSize: '14px',
								lineHeight: '20px',
								letterSpacing: '0px'
							}}
						>
							Graduation gift for my  Daughter
						</button>
						<button
							onClick={() => {
								const promptText = "My dog statue";
								setPrompt(promptText);
								setError(null);
								// Don't auto-trigger workflow - let user click Create button
							}}
							className="w-full text-left text-white hover:text-white/80 transition-colors"
							style={{
								fontFamily: 'Manrope, sans-serif',
								fontWeight: 400,
								fontSize: '14px',
								lineHeight: '20px',
								letterSpacing: '0px'
							}}
						>
							My dog statue
						</button>
						</div>
					)}

					{/* Usage Limits Banner */}
					{usageLimits && (!canGenerateImages || !canGenerateModels) && (
						<div className={`mt-3 w-full max-w-[280px] transition-all duration-700 delay-500 ease-out ${
							isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
						}`}>
							<div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
											<svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
											</svg>
										</div>
										<div>
											<h4 className="text-xs font-semibold text-red-800">Limit Reached</h4>
											<p className="text-xs text-red-600">
												{!canGenerateImages && `Images: ${remainingImages}/${usageLimits.limits.imagesPerMonth === -1 ? '∞' : usageLimits.limits.imagesPerMonth}`}
											</p>
										</div>
									</div>
									<button
										onClick={() => window.location.href = '/pricing'}
										className="px-3 py-1 bg-[#E70D57] hover:bg-[#d10c50] text-white text-xs font-medium rounded transition-colors"
									>
										Upgrade
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className={`mt-2 text-red-400 text-sm transition-all duration-300 ${
							isLoaded ? 'opacity-100' : 'opacity-0'
						}`}>
							{error}
						</div>
					)}

					{/* Content based on mode */}
					{isAdvanced ? (
						/* Advanced Mode Content - Show 6 categories */
						<div className="w-full flex-grow flex items-center justify-center">
							{selectedCategory === 'color' ? (
								renderColorPalette()
							) : selectedCategory === 'size' ? (
								renderSizeSelector()
							) : selectedCategory === 'production' ? (
								renderProductionSelector()
							) : selectedCategory === 'style' ? (
								renderStyleSelector()
							) : selectedCategory === 'material' ? (
								renderMaterialSelector()
							) : selectedCategory === 'detail' ? (
								renderDetailSelector()
							) : (
								renderAdvancedCategories()
							)}
						</div>
					) : (
						/* Basic Mode Content - Clean minimal view */
						<div className="flex flex-col items-center w-full mt-8">
							{/* Clean minimal design with no text */}
						</div>
					)}
				</div>
			</aside>
			)}

			{/* Main Content Area */}
			<div className="flex-1 min-w-0 flex flex-col relative bg-[2C2C2C] border-none"
				 style={{ 
					borderRadius: 'clamp(16px, 2vw, 28px)',
					marginTop: '4px',
					marginRight: '4px',
					marginBottom: '4px',
					marginLeft: '4px',
					height: 'calc(100vh - 8px)'
				 }}>

				
				{/* Content - No scroll */}
				<div className="flex-1 pl-0 pr-0 sm:pr-0 lg:pr-0 pb-2 sm:pb-2 lg:pb-4 overflow-hidden flex items-center justify-center">
					{show3DViewer && completedDesign ? (
						/* 3D Viewer Mode - Center panel only */
						<div className="flex-1 bg-[#1a1a1a] flex flex-col overflow-hidden shadow-xl border border-white/5 rounded-[10px]">
							{/* 3D Model Area */}
							<div className="flex-1 flex items-center justify-center p-8 relative">
								<Simple3DViewer
									design={completedDesign}
									lighting={lighting3D}
									background={background3D}
									size={size3D}
									cameraAngle={cameraAngle3D}
								/>
							</div>

							{/* Bottom Section */}
							<div className="p-6 space-y-4 flex-shrink-0">
								{/* Interaction Hint */}
								<div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
									<span className="text-sm">Click & hold to rotate</span>
								</div>

								{/* Action Buttons */}
								<div className="flex justify-center gap-4">
									<button 
										onClick={() => handle3DDownload(completedDesign.id)}
										className="px-10 h-[54px] bg-white rounded-full text-black font-normal hover:bg-gray-100 transition-colors flex items-center justify-center"
									>
										Download
									</button>
									<button 
										onClick={() => handle3DMakeOrder(completedDesign.id)}
										className="px-8 h-[54px] rounded-full font-normal transition-all duration-300 bg-[#313131] text-white hover:bg-[#414141] hover:scale-105 flex items-center justify-center"
									>
										Make Order
									</button>
								</div>
							</div>
						</div>
					) : showWorkflow ? (
						<>
						
							{/* Workflow Display - Show Loading State in Grid (hidden when workflow is active) */}
							{!showWorkflow && (
								<div className="grid grid-cols-2 gap-0.5 lg:gap-1 xl:gap-1.5 w-full ml-0 lg:ml-0 xl:ml-0 min-h-[600px] py-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
							{/* Camera 1 - Top Left - Show Loading GIF */}
								<div className={`bg-[#1a1a1a] rounded-[40px] ml-0 lg:ml-1 xl:ml-1 flex items-center justify-center h-[280px] min-h-[250px] transition-all duration-700 ease-out backdrop-blur-sm ${
								isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
							}`} style={{ transitionDelay: '800ms' }}>
								<div className="w-full h-full flex ml-[-25px] lg:ml[-15px] xl:ml-0 flex-col items-center justify-center p-6 text-center relative">
									<img 
										src="/GIFS/Loading-State.gif" 
										alt="Loading" 
										className="w-24 h-24 object-contain mb-4"
									/>
									<h3 className="text-lg font-semibold text-gray-200 mb-2">Generating...</h3>
									<p className="text-sm text-gray-400">Creating your design</p>
								</div>
							</div>

							{/* Camera 2 - Top Right - Show Loading GIF */}
								<div className={`bg-[#1a1a1a] rounded-[40px] flex items-center justify-center h-[280px] min-h-[250px] transition-all duration-700 ease-out backdrop-blur-sm ${
								isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
							}`} style={{ transitionDelay: '900ms' }}>
								<div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative">
									<img 
										src="/GIFS/Loading-State.gif" 
										alt="Loading" 
										className="w-24 h-24 object-contain mb-4"
									/>
									<h3 className="text-lg font-semibold text-gray-200 mb-2">Processing...</h3>
									<p className="text-sm text-gray-400">AI at work</p>
								</div>
							</div>

							{/* Camera 3 - Bottom Left - Show Loading GIF */}
								<div className={`bg-[#1a1a1a] rounded-[40px] flex items-center justify-center h-[280px] min-h-[250px] transition-all duration-700 ease-out backdrop-blur-sm ${
								isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
							}`} style={{ transitionDelay: '1000ms' }}>
								<div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative">
									<img 
										src="/GIFS/Loading-State.gif" 
										alt="Loading" 
										className="w-24 h-24 object-contain mb-4"
									/>
									<h3 className="text-lg font-semibold text-gray-200 mb-2">Working...</h3>
									<p className="text-sm text-gray-400">Almost done</p>
								</div>
							</div>

							{/* Empty 4th Grid - Bottom Right - Clean loading state */}
								<div className={`bg-[#1a1a1a] rounded-[40px] flex items-center justify-center h-[280px] min-h-[250px] transition-all duration-700 ease-out backdrop-blur-sm ${
								isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
							}`} style={{ transitionDelay: '1100ms' }}>
								<div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative">
									{/* Empty space - no button */}
								</div>
							</div>
						</div>
						)}
						
						{/* Workflow Component - Replace the loading grid when active */}
						{showWorkflow && (
							<MobileOptimizedImageWorkflow
								prompt={prompt}
								enhancedPrompt={hasProperties() ? generateEnhancedPrompt(prompt) : undefined}
								quality={selectedQuality as 'fast' | 'medium' | 'good'}
								onComplete={handleWorkflowComplete}
								onError={handleWorkflowError}
								generationTrigger={generationCounter}
								showImageUpload={true}
							/>
						)}
						</>
					) : (
						/* Default Grid Display or Upload Mode */
						isUploadMode && uploadedImages.length > 0 ? (
							/* Upload Mode - Show uploaded images in grid */
							<div className="w-full h-full flex flex-col">
								{/* Upload Mode Header */}
								<div className="flex items-center justify-between mb-4 px-4 pt-4">
									{/* Left side - X button and title */}
									<div className="flex items-center gap-3">
										{/* X Close Button */}
										<button
											onClick={() => {
												setIsUploadMode(false);
												setUploadedImages([]);
											}}
											className="p-2 hover:bg-white/10 rounded-full transition-colors"
											title="Close"
										>
											<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
										
										<h3 className="text-white text-lg font-medium">Uploaded Images ({uploadedImages.length}/5)</h3>
										{uploadedImages.filter(img => img.selected).length > 0 && (
											<span className="text-sm text-gray-400">
												{uploadedImages.filter(img => img.selected).length} selected
											</span>
										)}
									</div>
									
									{/* Right side - Action buttons exactly as shown in image */}
									<div className="flex items-center gap-3">
										{/* Delete All Icon */}
										<button
											onClick={clearUploadedImages}
											className="p-2 hover:bg-white/10 rounded-full transition-colors"
											title="Delete all"
										>
											<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
										
										{/* Select/Deselect Toggle Icon - SQUARE with checkmark */}
										<button
											onClick={() => {
												const selectedCount = uploadedImages.filter(img => img.selected).length;
												const allSelected = selectedCount === uploadedImages.length;
												if (allSelected) {
													const updatedImages = uploadedImages.map(img => ({ ...img, selected: false }));
													setUploadedImages(updatedImages);
												} else {
													const updatedImages = uploadedImages.map(img => ({ ...img, selected: true }));
													setUploadedImages(updatedImages);
												}
											}}
											className="p-2 hover:bg-white/10 rounded-full transition-colors"
											title={uploadedImages.filter(img => img.selected).length === uploadedImages.length ? "Deselect all" : "Select all"}
										>
											<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={2}/>
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
											</svg>
										</button>
										
										{/* Share Selected Button */}
										<button
											onClick={() => handleImageShare(uploadedImages.filter(img => img.selected))}
											disabled={uploadedImages.filter(img => img.selected).length === 0}
											className="px-3 py-1.5 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Share selected
										</button>
									</div>
								</div>

								{/* Scrollable Images Grid */}
								<div className="flex-1 overflow-y-auto px-4 image-upload-scroll">
									<div className="grid grid-cols-2 gap-2 pb-4" style={{ gridTemplateRows: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
										{uploadedImages.map((image, index) => (
											<div
												key={image.id}
												className="relative group rounded-lg overflow-hidden transition-all duration-200 cursor-pointer"
												style={{ minHeight: '280px' }}
												onClick={() => toggleImageSelection(image.id)}
											>
												{/* Image Display */}
												<img
													src={image.url}
													alt={`Uploaded image ${index + 1}`}
													className="w-full h-full object-cover"
												/>
												
												{/* Selection Overlay */}
												<div className={`absolute inset-0 bg-black/20 transition-opacity ${
													image.selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
												}`}>
													{/* Selection Checkbox */}
													<div className="absolute top-2 left-2">
														<div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
															image.selected 
																? 'bg-white border-white' 
																: 'bg-black/50 border-white/70'
														}`}>
															{image.selected && (
																<svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
																	<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
																</svg>
															)}
														</div>
													</div>
													
													{/* Three-dot Menu - horizontal dots, no background, shows on hover */}
													<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
														<div className="relative">
															<button
																onClick={(e) => {
																	e.stopPropagation();
																	setOpenDropdownId(openDropdownId === image.id ? null : image.id);
																}}
																className="p-2 transition-colors cursor-pointer"
															>
																{/* Horizontal three dots - BIGGER */}
																<svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
																	<circle cx="5" cy="12" r="2.5"/>
																	<circle cx="12" cy="12" r="2.5"/>
																	<circle cx="19" cy="12" r="2.5"/>
																</svg>
															</button>
															
															{/* Dropdown Menu - shows only when clicked, 1.2x bigger, no red background */}
															{openDropdownId === image.id && (
																<div className="absolute right-0 top-full mt-1 mr-2 w-48 rounded-2xl shadow-lg z-50 scale-110" style={{ backgroundColor: '#313131' }}>
																	<button
																		onClick={(e) => {
																			e.stopPropagation();
																			window.open(image.url, '_blank');
																			setOpenDropdownId(null);
																		}}
																		className="w-full px-4 py-3 text-left text-white rounded-t-2xl flex items-center gap-3 text-base cursor-pointer"
																	>
																		<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
																		</svg>
																		Open in new tab
																	</button>
																	<button
																		onClick={(e) => {
																			e.stopPropagation();
																			deleteImage(image.id);
																			setOpenDropdownId(null);
																		}}
																		className="w-full px-4 py-3 text-left text-white rounded-b-2xl flex items-center gap-3 text-base cursor-pointer"
																	>
																		<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
																		</svg>
																		Delete Image
																	</button>
																</div>
															)}
														</div>
													</div>
												</div>
											</div>
										))}
										
										{/* Add More Images Button (if less than 5) */}
										{uploadedImages.length < 5 && (
											<div
												className={`aspect-square rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${
													isProcessingFiles 
														? 'border-blue-400 cursor-wait' 
														: 'border-gray-600 hover:border-gray-500 cursor-pointer'
												}`}
												onClick={() => !isProcessingFiles && document.getElementById('image-upload-input')?.click()}
											>
												<div className="text-center">
													{isProcessingFiles ? (
														<>
															<div className="w-8 h-8 mx-auto mb-2 animate-spin">
																<svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24">
																	<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
																	<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
																</svg>
															</div>
															<p className="text-blue-400 text-sm">Processing...</p>
														</>
													) : (
														<>
															<svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
															</svg>
															<p className="text-gray-400 text-sm">Add Image</p>
															<p className="text-gray-500 text-xs">{uploadedImages.length}/5</p>
														</>
													)}
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						) : (
							/* Default Grid Display */
							<div className="grid grid-cols-2 gap-0.5 lg:gap-1 xl:gap-1.5 relative w-full h-full border-none pl-1 lg:pl-1 xl:pl-2 pr-1 lg:pr-1 xl:pr-2 ml-0 lg:ml-0 xl:ml-1" style={{
								paddingTop: window.innerWidth >= 1420 ? '60px' : '0'
							}}>
								{/* Camera 1 - Top Left */}
								<div className={`bg-transparent rounded-[32px] lg:rounded-[40px] flex items-center justify-center w-full h-full min-h-[280px] transition-all duration-700 ease-out backdrop-blur-sm ${
									isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
								}`} style={{ transitionDelay: '800ms' }}>
									<div className="w-full h-full flex items-center justify-center p-0 relative">
										<img 
											src="/image1.png" 
											alt="Toy design 1" 
											className="max-w-full max-h-full object-contain rounded-[16px]" 
										/>
									</div>
								</div>

								{/* Camera 2 - Top Right */}
								<div className={`bg-transparent rounded-[32px] lg:rounded-[40px] flex items-center justify-center w-full h-full min-h-[280px] transition-all duration-700 ease-out backdrop-blur-sm ${
									isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
								}`} style={{ transitionDelay: '900ms' }}>
									<div className="w-full h-full flex items-center justify-center p-0 relative">
										<img 
											src="/image2.png" 
											alt="Toy design 2" 
											className="max-w-full max-h-full object-contain rounded-[16px]" 
										/>
									</div>
								</div>

								{/* Camera 3 - Bottom Left */}
								<div className={`bg-transparent rounded-[32px] lg:rounded-[40px] flex items-center justify-center relative w-full h-full min-h-[280px] transition-all duration-700 ease-out backdrop-blur-sm ml-0 lg:ml-0 xl:ml-0 ${
									isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
								}`} style={{ transitionDelay: '1000ms' }}>
									<div className="w-full h-full flex items-center justify-center p-0 relative">
										<img 
											src="/image3.png" 
											alt="Toy design 3" 
											className="max-w-full max-h-full object-contain rounded-[16px]" 
										/>
									</div>
								</div>

								{/* Camera 4 - Bottom Right - Empty */}
								<div className={`bg-transparent rounded-[32px] lg:rounded-[40px] flex items-center justify-center relative w-full h-full min-h-[280px] transition-all duration-700 ease-out backdrop-blur-sm ml-0 lg:ml-0 xl:ml-0 ${
									isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
								}`} style={{ transitionDelay: '1100ms' }}>
									<div className="w-full h-full flex items-center justify-center p-6 text-center">
										{/* Empty space */}
									</div>
								</div>
							</div>
						)
					)}
				</div>
			</div>
			
			{/* Floating live chat button */}
			<a 
				href="mailto:support@cudliy.com"
				className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl transition-all duration-700 delay-1200 ease-out hover:scale-110 z-20 bg-transparent flex items-center justify-center ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
				}`}
			>
				<img 
					src="/live-chat (1).png" 
					alt="Live Chat Support" 
					className="w-full h-full object-contain"
				/>
			</a>

			{/* Intro Popup for New Users */}
			{showIntroPopup && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					{/* Backdrop */}
					<div 
						className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-500 ease-out"
						style={{
							animation: showIntroPopup ? 'fadeIn 0.5s ease-out' : 'fadeOut 0.3s ease-in'
						}}
					></div>
					
					{/* Modal */}
					<div 
						className="relative bg-gradient-to-br from-white via-gray-50 to-white rounded-[32px] flex flex-col items-center gap-[30px] z-10 shadow-2xl border border-gray-200/50 transition-all duration-700 ease-out max-w-[90vw] md:max-w-[773px]"
						style={{
							width: '90vw',
							maxWidth: '773px',
							height: 'auto',
							maxHeight: '90vh',
							transform: showIntroPopup ? 'rotate(-0.03deg) scale(1)' : 'rotate(-0.03deg) scale(0.9)',
							opacity: showIntroPopup ? 1 : 0,
							paddingTop: '40px',
							paddingRight: '20px',
							paddingBottom: '40px',
							paddingLeft: '20px',
							animation: showIntroPopup ? 'modalSlideIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'modalSlideOut 0.3s ease-in'
						}}
					>
						{/* Close button */}
						<button 
							onClick={() => setShowIntroPopup(false)}
							className="absolute top-6 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-300 hover:scale-110 shadow-md border border-gray-200/50"
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>

						{/* Title */}
						<h2 className="font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent text-2xl" style={{ fontFamily: 'Nohemi' }}>
							Welcome to Cudliy! 👋
						</h2>

						{/* Subtitle */}
						<p 
							style={{ 
								fontFamily: 'Manrope',
								fontWeight: 500,
								fontSize: '18px',
								lineHeight: '140%',
								letterSpacing: '-0.01em',
								textAlign: 'center',
								maxWidth: '100%',
								color: '#666'
							}}
						>
							Let's show you around. Become a designer in 5 minutes.
						</p>

						{/* Video container */}
						<div 
							className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 overflow-hidden relative flex-shrink-0 shadow-lg cursor-pointer w-full"
							style={{
								maxWidth: '677px',
								height: 'auto',
								aspectRatio: '16/9',
								transform: 'rotate(0.27deg)',
								opacity: 1,
								borderRadius: '11.13px',
								borderWidth: '1.85px'
							}}
							onClick={() => {
								if (modalVideoRef.current) {
									if (isModalPlaying) {
										modalVideoRef.current.pause();
										setIsModalPlaying(false);
									} else {
										modalVideoRef.current.play();
										setIsModalPlaying(true);
									}
								}
							}}
						>
							<video 
								ref={modalVideoRef}
								src="/final 2.mp4" 
								className="w-full h-full object-cover" 
								loop 
								muted 
								playsInline 
							/>
							{!isModalPlaying && (
								<button 
									aria-label="Play intro video" 
									className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-black/80 pointer-events-none"
								>
									<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M8 5v14l11-7L8 5z" fill="#fff" />
									</svg>
								</button>
							)}
						</div>

						{/* Buttons */}
						<div className="flex gap-3">
							<button 
								onClick={() => setShowIntroPopup(false)}
								className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-base transition-all duration-300 hover:scale-105 shadow-md px-6 py-3 rounded-full"
							>
								Skip
							</button>
							<button 
								onClick={() => {
									setShowIntroPopup(false);
									setShowTourModal(true);
								}}
								className="bg-gradient-to-r from-[#E70D57] to-[#d10c50] text-white font-medium text-base transition-all duration-300 hover:scale-105 hover:shadow-lg px-6 py-3 rounded-full"
							>
								Watch Tour
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Enhanced Tour Modal */}
			{showTourModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					{/* Animated blurred background */}
					<div 
						className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-500 ease-out"
						onClick={handleCloseModal}
						style={{
							animation: showTourModal ? 'fadeIn 0.5s ease-out' : 'fadeOut 0.3s ease-in'
						}}
					></div>
					
					{/* Enhanced Modal container */}
					<div 
						className="relative bg-gradient-to-br from-white via-gray-50 to-white rounded-[32px] flex flex-col items-center gap-[30px] z-10 shadow-2xl border border-gray-200/50 transition-all duration-700 ease-out"
						style={{
							width: '773.8763875527198px',
							height: '636.8912210757093px',
							transform: showTourModal ? 'rotate(-0.03deg) scale(1)' : 'rotate(-0.03deg) scale(0.9)',
							opacity: showTourModal ? 1 : 0,
							paddingTop: '40px',
							paddingRight: '20px',
							paddingBottom: '40px',
							paddingLeft: '20px',
							animation: showTourModal ? 'modalSlideIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'modalSlideOut 0.3s ease-in'
						}}
					>
						{/* Enhanced Close button */}
						<button 
							onClick={handleCloseModal}
							className="absolute top-6 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-300 hover:scale-110 shadow-md border border-gray-200/50"
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>

						{/* Title with gradient */}
						<h2 className="font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent text-2xl" style={{ fontFamily: 'Nohemi' }}>
							Take a Tour 👋
						</h2>

						{/* Subtitle */}
						<p 
							style={{ 
								fontFamily: 'Manrope',
								fontWeight: 500,
								fontSize: '18px',
								lineHeight: '140%',
								letterSpacing: '-0.01em',
								textAlign: 'center',
								width: '731.0000342468708px',
								maxWidth: '100%',
								height: 'auto',
								transform: 'rotate(0.27deg)',
								opacity: 1,
								color: '#666'
							}}
						>
							Let's show you around cudliy. Become a designer in 5 minutes.
						</p>

						{/* Video container */}
						<div 
							className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 overflow-hidden relative flex-shrink-0 shadow-lg cursor-pointer"
							style={{
								width: '677.8353589045782px',
								height: '380.49517107814376px',
								transform: 'rotate(0.27deg)',
								opacity: 1,
								borderRadius: '11.13px',
								borderWidth: '1.85px'
							}}
							onClick={handleModalVideoClick}
						>
							<video 
								ref={modalVideoRef}
								src="/final 2.mp4" 
								className="w-full h-full object-cover" 
								loop 
								muted 
								playsInline 
							/>
							{!isModalPlaying && (
								<button 
									aria-label="Play tour video" 
									className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-black/80 pointer-events-none"
								>
									<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M8 5v14l11-7L8 5z" fill="#fff" />
									</svg>
								</button>
							)}
						</div>

						{/* Next button */}
						<button 
							className="bg-gradient-to-r from-[#E70D57] to-[#d10c50] mb-2 text-white font-medium text-base transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center"
							style={{
								width: '275.00154701758447px',
								height: '53.99969346760363px',
								maxWidth: '275px',
								transform: 'rotate(-0.03deg)',
								opacity: 1,
								borderRadius: '40px',
								paddingTop: '14px',
								paddingRight: '10px',
								paddingBottom: '14px',
								paddingLeft: '10px'
							}}
						>
							Next
						</button>
					</div>
				</div>
			)}
			
			<style>{`
				/* Prevent page scrolling and hide scrollbars */
				html, body {
					overflow: hidden;
					height: 100vh;
					width: 100vw;
					margin: 0;
					padding: 0;
				}
				
				* {
					scrollbar-width: none; /* Firefox */
					-ms-overflow-style: none; /* Internet Explorer 10+ */
				}
				
				*::-webkit-scrollbar {
					display: none; /* WebKit */
				}
				
				@keyframes fadeIn {
					from { opacity: 0; }
					to { opacity: 1; }
				}
				
				@keyframes fadeOut {
					from { opacity: 1; }
					to { opacity: 0; }
				}
				
				@keyframes modalSlideIn {
					0% {
						opacity: 0;
						transform: rotate(-0.03deg) scale(0.8) translateY(20px);
					}
					100% {
						opacity: 1;
						transform: rotate(-0.03deg) scale(1) translateY(0px);
					}
				}
				
				@keyframes modalSlideOut {
					0% {
						opacity: 1;
						transform: rotate(-0.03deg) scale(1) translateY(0px);
					}
					100% {
						opacity: 0;
						transform: rotate(-0.03deg) scale(0.8) translateY(20px);
					}
				}
			`}</style>
			</div>
		</>
	);
}