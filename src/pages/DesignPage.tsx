import { useRef, useState, useEffect } from "react";
import ColorPicker from "../components/ColorPicker";
import SizeSelector from "../components/SizeSelector";
import ProductionSelector from "../components/ProductionSelector";
import StyleSelector from "../components/StyleSelector";
import MaterialSelector from "../components/MaterialSelector";
import DetailSelector from "../components/DetailSelector";
import QualitySelector from "../components/QualitySelector";
import ImageGenerationWorkflow from "../components/ImageGenerationWorkflow";
import { usePropertiesAggregator } from "../hooks/usePropertiesAggregator";
import { useUsageLimits } from "../hooks/useUsageLimits";
import SEO from "@/components/SEO";

export default function DesignPage() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const modalVideoRef = useRef<HTMLVideoElement>(null);
	const [isModalPlaying, setIsModalPlaying] = useState(false);
	const [showTourModal, setShowTourModal] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);
	const [isAdvanced, setIsAdvanced] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [selectedSize, setSelectedSize] = useState('M');
	const [customWidth, setCustomWidth] = useState('');
	const [customHeight, setCustomHeight] = useState('');
	const [selectedProduction, setSelectedProduction] = useState('');
	const [selectedStyle, setSelectedStyle] = useState('');
	const [selectedMaterial, setSelectedMaterial] = useState('');
	const [selectedDetails, setSelectedDetails] = useState<string[]>([]);
	const [selectedQuality, setSelectedQuality] = useState('balanced');
	const [prompt, setPrompt] = useState('');
	const [showWorkflow, setShowWorkflow] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [completedDesignId, setCompletedDesignId] = useState<string | null>(null);

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
		resetProperties,
		hasProperties
	} = usePropertiesAggregator();

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

	const handleTourClick = () => {
		setShowTourModal(true);
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
		setSelectedCategory(null);
	};

	const handleSelectAndReturn = () => {
		// Go back to main categories after selection
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
		if (!prompt.trim()) {
			setError('Please enter a prompt first');
			return;
		}

		// Check usage limits before starting workflow
		if (!canGenerateImages) {
			setError(`You have reached your monthly image generation limit (${usageLimits?.limits.imagesPerMonth || 3} images). Please upgrade your plan to continue.`);
			return;
		}

		setError(null);
		setShowWorkflow(true);
		
		// Auto-start generation immediately
		setTimeout(() => {
			// This will trigger the ImageGenerationWorkflow to start automatically
		}, 100);
	};

	const handleWorkflowComplete = (designId: string) => {
		setCompletedDesignId(designId);
		setShowWorkflow(false);
	};

	const handleViewDesign = () => {
		if (completedDesignId) {
			window.location.href = `/design/${completedDesignId}`;
		}
	};

	const handleWorkflowError = (errorMessage: string) => {
		setError(errorMessage);
		setShowWorkflow(false);
	};

	const handleColorChange = (color: string) => {
		// Strategic Enhancement: Add color to properties aggregator
		addColor(color);
	};

	const handleQualityChange = (quality: string) => {
		setSelectedQuality(quality);
	};

	const handleReset = () => {
		setShowWorkflow(false);
		setError(null);
		setCompletedDesignId(null);
		setPrompt('');
		// Strategic Enhancement: Reset properties aggregator
		resetProperties();
	};

	// Advanced mode sections
	const sections = {
		color: {
			title: 'Color',
			icon: '/advancedIcon1.png'
		},
		material: {
			title: 'Material',
			icon: '/advancedIcon2.png'
		},
		size: {
			title: 'Size',
			icon: '/advancedIcon3.png'
		},
		style: {
			title: 'Style',
			icon: '/advancedIcon4.png'
		},
		production: {
			title: 'Production',
			icon: '/advancedIcon5.png'
		},
		detail: {
			title: 'Detail',
			icon: '/advancedIcon6.png'
		},
		quality: {
			title: 'Quality',
			icon: '/advancedIcon1.png' // Reuse icon for now
		}
	};

	const renderSizeSelector = () => {
		return (
			<div className="flex flex-col items-center text-center w-full">
				{/* Breadcrumb Navigation */}
				<div className={`mb-4 flex items-center gap-2 text-sm transition-all duration-700 delay-200 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
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
				<div className={`transition-all duration-700 delay-300 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
					<SizeSelector
						selectedSize={selectedSize}
						onSizeChange={handleSizeChange}
						customWidth={customWidth}
						customHeight={customHeight}
						onCustomSizeChange={handleCustomSizeChange}
					/>
				</div>

				{/* Select Button */}
				<button 
					onClick={handleSelectAndReturn}
					className={`w-[133px] h-[39px] rounded-[40px] bg-[#575757] hover:bg-[#676767] text-white font-medium text-sm transition-all duration-300 ease-out hover:scale-105 shadow-lg ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}
				>
					Select
				</button>
			</div>
		);
	};

	const renderProductionSelector = () => {
		return (
			<div className="flex flex-col items-center text-center w-full">
				{/* Breadcrumb Navigation */}
				<div className={`mb-4 flex items-center gap-2 text-sm transition-all duration-700 delay-200 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
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
				<div className={`transition-all duration-700 delay-300 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
					<ProductionSelector
						selectedProduction={selectedProduction}
						onProductionChange={handleProductionChange}
					/>
				</div>

				{/* Select Button */}
				<button 
					onClick={handleSelectAndReturn}
					className={`w-[133px] h-[39px] rounded-[40px] bg-[#575757] hover:bg-[#676767] text-white font-medium text-sm transition-all duration-300 ease-out hover:scale-105 shadow-lg ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}
				>
					Select
				</button>
			</div>
		);
	};

	const renderStyleSelector = () => {
		return (
			<div className="flex flex-col items-center text-center w-full">
				{/* Breadcrumb Navigation */}
				<div className={`mb-4 flex items-center gap-2 text-sm transition-all duration-700 delay-200 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
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
				<div className={`transition-all duration-700 delay-300 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
					<StyleSelector
						selectedStyle={selectedStyle}
						onStyleChange={handleStyleChange}
					/>
				</div>

				{/* Select Button */}
				<button 
					onClick={handleSelectAndReturn}
					className={`w-[133px] h-[39px] rounded-[40px] bg-[#575757] hover:bg-[#676767] text-white font-medium text-sm transition-all duration-300 ease-out hover:scale-105 shadow-lg ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}
				>
					Select
				</button>
			</div>
		);
	};

	const renderMaterialSelector = () => {
		return (
			<div className="flex flex-col items-center text-center w-full">
				{/* Breadcrumb Navigation */}
				<div className={`mb-4 flex items-center gap-2 text-sm transition-all duration-700 delay-200 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
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
				<div className={`transition-all duration-700 delay-300 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
					<MaterialSelector
						selectedMaterial={selectedMaterial}
						onMaterialChange={handleMaterialChange}
					/>
				</div>

				{/* Select Button */}
				<button 
					onClick={handleSelectAndReturn}
					className={`w-[133px] h-[39px] rounded-[40px] bg-[#575757] hover:bg-[#676767] text-white font-medium text-sm transition-all duration-300 ease-out hover:scale-105 shadow-lg ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}
				>
					Select
				</button>
			</div>
		);
	};
	const renderDetailSelector = () => {
		return (
			<div className="flex flex-col items-center text-center w-full h-full max-h-[400px]">
				{/* Breadcrumb Navigation */}
				<div className={`mb-3 flex items-center gap-2 text-sm transition-all duration-700 delay-200 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
					<button 
						onClick={handleBackToCategories}
						className="text-white/70 hover:text-white transition-colors cursor-pointer"
					>
						Detail
					</button>
					<span className="text-white/30">{'>'}</span>
					<span className="text-white/90">Select Multiple</span>
				</div>

				{/* Detail Selector - with constrained height */}
				<div className={`flex-1 min-h-0 transition-all duration-700 delay-300 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
					<DetailSelector
						selectedDetails={selectedDetails}
						onDetailChange={handleDetailChange}
					/>
				</div>

				{/* Select Button - Fixed at bottom */}
				<div className="mt-3 flex-shrink-0">
					<button 
						onClick={handleSelectAndReturn}
						className={`w-[133px] h-[39px] rounded-[40px] bg-[#575757] hover:bg-[#676767] text-white font-medium text-sm transition-all duration-300 ease-out hover:scale-105 shadow-lg ${
							isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
						}`}
					>
						Select
					</button>
				</div>
			</div>
		);
	};

	const renderColorPalette = () => {
		return (
			<div className="flex flex-col items-center text-center w-full">
				{/* Breadcrumb Navigation */}
				<div className={`mb-4 flex items-center gap-2 text-sm transition-all duration-700 delay-200 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
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
				<div className={`transition-all duration-700 delay-300 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
					<ColorPicker
						onColorChange={handleColorChange}
					/>
				</div>

				{/* Select Button */}
				<button 
					onClick={handleSelectAndReturn}
					className={`w-[133px] h-[39px] rounded-[40px] bg-[#575757] hover:bg-[#676767] text-white font-medium text-sm transition-all duration-300 ease-out hover:scale-105 shadow-lg ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}
				>
					Select
				</button>
			</div>
		);
	};

	const renderQualitySelector = () => {
		return (
			<div className="flex flex-col items-center text-center w-full">
				{/* Breadcrumb Navigation */}
				<div className={`mb-4 flex items-center gap-2 text-sm transition-all duration-700 delay-200 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
					<button 
						onClick={handleBackToCategories}
						className="text-white/70 hover:text-white transition-colors cursor-pointer"
					>
						Quality
					</button>
					<span className="text-white/30">{'>'}</span>
					<span className="text-white/90">Select Quality</span>
				</div>

				{/* Quality Selector */}
				<div className={`transition-all duration-700 delay-300 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
					<QualitySelector
						selectedQuality={selectedQuality}
						onQualityChange={handleQualityChange}
					/>
				</div>

				{/* Select Button */}
				<button 
					onClick={handleSelectAndReturn}
					className={`w-[133px] h-[39px] rounded-[40px] bg-[#575757] hover:bg-[#676767] text-white font-medium text-sm transition-all duration-300 ease-out hover:scale-105 shadow-lg ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}
				>
					Select
				</button>
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
		const hasQualitySelection = !!selectedQuality;

		const categoryStatus = {
			color: hasColorSelection,
			size: hasSizeSelection,
			production: hasProductionSelection,
			style: hasStyleSelection,
			material: hasMaterialSelection,
			detail: hasDetailSelection,
			quality: hasQualitySelection
		};

		return (
			<div className="flex flex-col items-center text-center h-full">
				
				<div className={`grid grid-cols-3 gap-4 w-full max-w-[320px] transition-all duration-700 delay-300 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
					{Object.entries(sections).map(([key, section], index) => {
						const isSelected = categoryStatus[key as keyof typeof categoryStatus];
						return (
							<div
								key={key}
								className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 hover:scale-105 cursor-pointer relative ${
									isSelected ? 'ring-2 ring-[#E70D57] ring-opacity-60 rounded-lg' : ''
								}`}
								style={{ transitionDelay: `${400 + index * 50}ms` }}
								onClick={() => handleCategoryClick(key)}
							>
								{isSelected && (
									<div className="absolute -top-1 -right-1 w-4 h-4 bg-[#E70D57] rounded-full flex items-center justify-center">
										<svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
										</svg>
									</div>
								)}
								<img 
									src={section.icon} 
									alt={section.title} 
									className="w-[50px] h-[50px] object-contain mx-auto" 
									style={{
										width: '50px',
										height: '50px',
										transform: 'rotate(0deg)',
										opacity: isSelected ? 1 : 0.8
									}}
								/>
								<span className={`text-xs font-medium ${isSelected ? 'text-[#E70D57]' : 'text-white/90'}`}>
									{section.title}
								</span>
							</div>
						);
					})}
				</div>

				{/* Progress dots - Dynamic based on selections */}
				<div className={`mt-6 flex items-center justify-center gap-2 transition-all duration-700 delay-500 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
					{Object.entries(categoryStatus).map(([key, isSelected]) => (
						<div 
							key={key}
							className={`w-2 h-2 rounded-full transition-all duration-300 ${
								isSelected ? 'bg-[#E70D57]' : 'bg-white/30'
							}`}
						></div>
					))}
				</div>

				<button 
					onClick={handleCreateClick}
					disabled={!canGenerateImages}
					className={`mt-4 px-6 py-2 w-[120px] h-[35px] rounded-[30px] font-medium text-sm transition-all duration-700 delay-600 ease-out hover:scale-105 shadow-lg ${
						!canGenerateImages
							? 'bg-gray-400 text-gray-200 cursor-not-allowed'
							: 'bg-gradient-to-r from-[#E70D57] to-[#d10c50] hover:from-[#d10c50] hover:to-[#E70D57] text-white shadow-[#E70D57]/50'
					} ${isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}
				>
					Create
				</button>
			</div>
		);
	};
	
	return (
		<>
			<SEO 
				title="Design Playground - Create Your Toy"
				description="Use our AI-powered playground to design custom 3D toys. Choose colors, materials, styles and bring your imagination to life with advanced or basic mode."
				keywords="toy playground, 3D design tool, AI toy creator, custom toy design, color picker, material selector, toy customization"
				url="/design"
			/>
			<div className="w-screen h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden flex p-4 gap-4">
			{/* Left Pane */}
			<aside className={`flex-shrink-0 w-full max-w-[476px] min-w-[320px] lg:w-[476px] bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1f1f1f] rounded-[40px] relative overflow-hidden transition-all duration-1000 ease-out shadow-2xl border border-white/5 ${
				isLoaded ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-8'
			}`}>
				<div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 z-10">
					<button 
						onClick={() => window.location.href = '/dashboard'}
						className="px-4 py-2 text-sm text-white/80 hover:text-white transition-all duration-300 cursor-pointer bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/10 hover:border-white/20 shadow-lg"
					>
						Dashboard
					</button>
					<button 
						onClick={handleAdvancedClick}
						className="px-4 py-2 text-sm text-white/80 hover:text-white transition-all duration-300 cursor-pointer bg-gradient-to-r from-[#E70D57]/20 to-[#F4900C]/20 hover:from-[#E70D57]/30 hover:to-[#F4900C]/30 backdrop-blur-sm rounded-full border border-white/10 hover:border-white/20 shadow-lg"
					>
						{isAdvanced ? 'Basic' : 'Advanced'}
					</button>
				</div>
				
							{/* Brand and title area */}
			<div className="pt-[3rem] sm:pt-[4rem] px-4 sm:px-6 pb-4 text-white flex flex-col items-center text-center h-full overflow-y-auto">
					{/* Mode selector */}
					<div className={`mb-2 flex items-center px-1 gap-2 w-full max-w-[222px] h-[31px] rounded-full bg-white/5 backdrop-blur-md border border-white/10 transition-all duration-700 delay-200 ease-out shadow-lg ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}>
						<button className="flex-1 h-[22px] rounded-full text-xs text-white/90 transition-all duration-300 hover:bg-white/10 font-medium">
							Voice
						</button>
						<button className="flex-1 h-[22px] rounded-full text-xs bg-gradient-to-r from-white to-gray-100 text-black transition-all duration-300 font-medium shadow-lg">
							Chat
						</button>
						<button className="flex-1 h-[22px] rounded-full text-xs text-white/90 transition-all duration-300 hover:bg-white/10 font-medium">
							Draw
						</button>
					</div>
					
					{/* Title */}
					<h1 className={`font-serif text-2xl sm:text-3xl lg:text-4xl leading-tight text-center max-w-full transition-all duration-700 delay-300 ease-out ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}>
						Playground
					</h1>
					<p className={`mt-1 lg:mt-2 opacity-80 text-xs sm:text-sm transition-all duration-700 delay-400 ease-out ${
						isLoaded ? 'opacity-80 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}>
						You are a Vibe Designer now
					</p>
					
					{/* Input */}
					<input
						placeholder="I want a toy camera"
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						className={`mt-3 lg:mt-6 px-4 py-2 outline-none w-full max-w-[280px] h-[40px] rounded-[20px] border border-gray-200 bg-white text-black text-[18px] transition-all duration-700 delay-500 ease-out focus:border-[#E70D57] focus:ring-2 focus:ring-[#E70D57]/20 shadow-md hover:shadow-lg ${
							isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
						}`}
						style={{ caretColor: "#E70D57" }}
					/>

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
						<div className={`mt-4 w-full max-w-[320px] flex-grow min-h-0 transition-all duration-700 delay-600 ease-out ${
							isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
						}`}>
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
							) : selectedCategory === 'quality' ? (
								renderQualitySelector()
							) : (
								renderAdvancedCategories()
							)}
						</div>
					) : (
						/* Basic Mode Content - Show Create button and Tour section */
						<>
			<button 
				onClick={handleCreateClick}
				disabled={!canGenerateImages}
				className={`mt-3 lg:mt-6 px-5 py-2 w-[120px] h-[35px] rounded-[30px] font-medium text-sm transition-all duration-700 delay-600 ease-out hover:scale-105 shadow-lg ${
					!canGenerateImages
						? 'bg-gray-400 text-gray-200 cursor-not-allowed'
						: 'bg-gradient-to-r from-[#E70D57] to-[#d10c50] hover:from-[#d10c50] hover:to-[#E70D57] text-white shadow-[#E70D57]/50'
				} ${isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
				Create
			</button>

							{/* Tour section */}
							<div className={`mt-[2rem] w-full max-w-[320px] flex flex-col items-center text-center flex-grow min-h-0 transition-all duration-700 delay-700 ease-out ${
								isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
							}`}>
								<h3 className="font-semibold text-white text-base mb-2">Take a Tour 👋</h3>
								<p className="text-white/70 text-sm leading-relaxed mb-4">
									Let's show you around cudliy. Become a designer in 5 minutes.
								</p>
								
								{/* Video container - fits within pane */}
								<div className="w-full max-w-[280px] h-[140px] relative flex-shrink-0 group">
									<div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-[20px] blur-xl scale-105 opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
									<div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-[10px] overflow-hidden shadow-2xl">
										<video 
											ref={videoRef} 
											src="/final 2.mp4" 
											className="object-cover h-full w-full" 
											loop 
											muted 
											playsInline 
										/>
										<div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"></div>
										<button 
											onClick={handleTourClick} 
											aria-label="Take a tour" 
											className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 hover:from-white hover:to-white/90 shadow-lg group"
										>
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-0.5">
												<path d="M8 5v14l11-7L8 5z" fill="#333" />
											</svg>
											<div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/30 to-pink-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
										</button>
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</aside>

			{/* Right canvas grid */}
			<div className={`flex-1 min-w-0 transition-all duration-1000 delay-200 ease-out ${
				isLoaded ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-8'
			}`}>
				{showWorkflow ? (
					/* Workflow Display */
					<div className="h-full w-full bg-white rounded-[40px] p-6 overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-semibold text-gray-800">Creating Your Design</h2>
							<button
								onClick={handleReset}
								className="text-gray-500 hover:text-gray-700 transition-colors"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<ImageGenerationWorkflow
							prompt={prompt}
							enhancedPrompt={hasProperties() ? generateEnhancedPrompt(prompt) : undefined}
							onComplete={handleWorkflowComplete}
							onError={handleWorkflowError}
						/>
					</div>
				) : completedDesignId ? (
					/* Success Display */
					<div className="h-full w-full bg-white rounded-[40px] p-6 flex flex-col items-center justify-center">
						<div className="text-center">
							<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
							</div>
							<h2 className="text-2xl font-semibold text-gray-800 mb-2">Design Created Successfully!</h2>
							<p className="text-gray-600 mb-6">Your 3D model is ready for printing.</p>
							<div className="space-x-4">
								<button
									onClick={handleReset}
									className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-full transition-colors"
								>
									Create Another
								</button>
								<button 
									onClick={handleViewDesign}
									className="px-6 py-2 bg-[#E70D57] hover:bg-[#d10c50] text-white font-medium rounded-full transition-colors"
								>
									View Design
								</button>
							</div>
						</div>
					</div>
				) : (
					/* Default Grid Display */
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full w-full">
						{/* Grid items with staggered animation */}
						{['/camera1.png', '/camera2.png', '/camera3.png'].map((src, index) => (
							<div key={index} className={`bg-white border border-gray-200/50 rounded-[40px] flex items-center justify-center min-h-[200px] sm:min-h-0 transition-all duration-700 ease-out hover:scale-[1.02] hover:shadow-2xl hover:border-[#E70D57]/30 backdrop-blur-sm ${
								isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
							}`} style={{ transitionDelay: `${800 + index * 100}ms` }}>
								<div className="w-full h-full max-w-[206px] max-h-[216px] flex items-center justify-center p-4 relative group">
									<div className="absolute inset-0 bg-gradient-to-br from-[#E70D57]/5 to-[#F4900C]/5 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									<img 
										src={src} 
										alt={`Toy camera design ${index + 1}`} 
										className="max-w-full max-h-full w-auto h-auto object-contain rounded-[20px] transition-transform duration-300 hover:scale-105 relative z-10" 
									/>
								</div>
							</div>
						))}

						{/* Fixed plus icon container */}
						<div className={`bg-gradient-to-br from-white via-gray-50 to-white border-2 border-dashed border-gray-300 rounded-[40px] transition-all duration-700 delay-1100 ease-out hover:scale-[1.02] hover:shadow-2xl hover:border-[#E70D57]/50 min-h-[200px] sm:min-h-0 group ${
							isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
						}`}>
							<div className="w-full h-full flex items-center justify-center">
								<button className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 flex items-center justify-center text-5xl sm:text-6xl transition-all duration-300 hover:from-[#E70D57]/10 hover:to-[#F4900C]/10 hover:text-[#E70D57] hover:scale-110 border-0 outline-none m-0 p-0 leading-none shadow-lg group-hover:shadow-xl">
									+
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
			
			{/* Floating help button */}
			<button className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl overflow-hidden transition-all duration-700 delay-1200 ease-out hover:scale-110 z-20 border-2 border-white hover:border-[#E70D57] ${
				isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
			}`}>
				<img src="/icon.png" alt="Help" className="w-full h-full object-cover" />
			</button>

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