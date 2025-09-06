import { useRef, useState, useEffect } from "react";

export default function DesignPage() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const modalVideoRef = useRef<HTMLVideoElement>(null);
	const [isModalPlaying, setIsModalPlaying] = useState(false);
	const [showTourModal, setShowTourModal] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);
	const [isAdvanced, setIsAdvanced] = useState(false);

	// Animate page load
	useEffect(() => {
		const timer = setTimeout(() => setIsLoaded(true), 100);
		return () => clearTimeout(timer);
	}, []);

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
		}
	};

	const renderAdvancedCategories = () => {
		return (
			<div className="flex flex-col items-center text-center">
				
				<div className={`grid grid-cols-3 gap-4 w-full max-w-[350px] transition-all duration-700 delay-300 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
					{Object.entries(sections).map(([key, section], index) => (
						<div
							key={key}
							className="flex flex-col items-center gap-2 p-3 transition-all duration-300 hover:scale-105 cursor-pointer"
							style={{ transitionDelay: `${400 + index * 50}ms` }}
						>
							<img 
								src={section.icon} 
								alt={section.title} 
								className="w-[55px] h-[55px] object-contain" 
								style={{
									width: '55px',
									height: '55px',
									transform: 'rotate(0deg)',
									opacity: 1
								}}
							/>
							<span className="text-xs font-medium text-white/90">{section.title}</span>
						</div>
					))}
				</div>

				{/* Progress dots */}
				<div className={`mt-8 flex items-center justify-center gap-2 transition-all duration-700 delay-500 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
					<div className="w-2 h-2 rounded-full bg-white/30"></div>
					<div className="w-2 h-2 rounded-full bg-white/30"></div>
					<div className="w-2 h-2 rounded-full bg-[#E70D57]"></div>
					<div className="w-2 h-2 rounded-full bg-white/30"></div>
					<div className="w-2 h-2 rounded-full bg-white/30"></div>
					<div className="w-2 h-2 rounded-full bg-white/30"></div>
				</div>

				<button 
					className={`mt-6 px-6 py-2 w-[120px] h-[35px] rounded-[30px] bg-[#E70D57] hover:bg-[#d10c50] text-white font-medium text-sm transition-all duration-700 delay-600 ease-out hover:scale-105 ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}
				>
					Create
				</button>
			</div>
		);
	};
	
	return (
		<div className="w-screen h-screen bg-white overflow-hidden flex p-4 gap-4">
			{/* Left Pane */}
			<aside className={`flex-shrink-0 w-full max-w-[476px] min-w-[320px] lg:w-[476px] bg-[#313131] rounded-[40px] relative overflow-hidden transition-all duration-1000 ease-out ${
				isLoaded ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-8'
			}`}>
				<button 
					onClick={handleAdvancedClick}
					className="absolute top-4 right-4 sm:top-6 sm:right-6 text-sm text-white/70 z-10 hover:text-white transition-colors cursor-pointer"
				>
					{isAdvanced ? 'Basic' : 'Advanced'}
				</button>
				
				{/* Brand and title area */}
				<div className="pt-[6.4rem] sm:pt-[7.6rem] px-4 sm:px-6 pb-4 text-white flex flex-col items-center text-center h-full">
					{/* Mode selector */}
					<div className={`mb-4 flex items-center px-1 gap-2 w-full max-w-[222px] h-[31px] rounded-full bg-black/50 transition-all duration-700 delay-200 ease-out ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}>
						<button className="flex-1 h-[22px] rounded-full text-xs text-white/90 transition-colors hover:bg-white/10">
							Voice
						</button>
						<button className="flex-1 h-[22px] rounded-full text-xs bg-[#DFDFDF] text-black transition-colors">
							Chat
						</button>
						<button className="flex-1 h-[22px] rounded-full text-xs text-white/90 transition-colors hover:bg-white/10">
							Draw
						</button>
					</div>
					
					{/* Title */}
					<h1 className={`font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight text-center max-w-full transition-all duration-700 delay-300 ease-out ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}>
						Playground
					</h1>
					<p className={`mt-1 lg:mt-4 opacity-80 text-xs sm:text-sm transition-all duration-700 delay-400 ease-out ${
						isLoaded ? 'opacity-80 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}>
						You are a Vibe Designer now
					</p>
					
					{/* Input */}
					<input
						placeholder="I want a toy camera"
						className={`mt-3 lg:mt-8 px-4 py-2 outline-none w-full max-w-[350px] h-[40px] rounded-[20px] border border-white/35 bg-white text-black text-[20px] transition-all duration-700 delay-500 ease-out ${
							isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
						}`}
						style={{ caretColor: "#000" }}
					/>

					{/* Content based on mode */}
					{isAdvanced ? (
						/* Advanced Mode Content - Show 6 categories */
						<div className={`mt-6 w-full max-w-[350px] transition-all duration-700 delay-600 ease-out ${
							isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
						}`}>
							{renderAdvancedCategories()}
						</div>
					) : (
						/* Basic Mode Content - Show Create button and Tour section */
						<>
							<button className={`mt-3 lg:mt-8 px-5 py-2 w-[120px] h-[35px] rounded-[30px] bg-[#E70D57] text-white font-medium text-sm transition-all duration-700 delay-600 ease-out hover:bg-[#d10c50] hover:scale-105 ${
								isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
							}`}>
								Create
							</button>

							{/* Tour section */}
							<div className={`mt-[3rem] w-full max-w-[280px] flex flex-col items-center text-center flex-grow min-h-0 transition-all duration-700 delay-700 ease-out ${
								isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
							}`}>
								<h3 className="font-semibold text-white text-base mb-2">Take a Tour 👋</h3>
								<p className="text-white/70 text-sm leading-relaxed mb-6">
									Let's show you around cudliy. Become a designer in 5 minutes.
								</p>
								
								{/* Video container - now matches input field size */}
								<div className=" w-[350px] h-[170px] relative flex-shrink-0 group">
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
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full w-full">
					{/* Grid items with staggered animation */}
					{['/camera1.png', '/camera2.png', '/camera3.png'].map((src, index) => (
						<div key={index} className={`bg-white border border-black/5 rounded-[40px] flex items-center justify-center min-h-[200px] sm:min-h-0 transition-all duration-700 ease-out hover:scale-[1.02] hover:shadow-lg ${
							isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
						}`} style={{ transitionDelay: `${800 + index * 100}ms` }}>
							<div className="w-full h-full max-w-[206px] max-h-[216px] flex items-center justify-center p-4">
								<img 
									src={src} 
									alt={`Toy camera design ${index + 1}`} 
									className="max-w-full max-h-full w-auto h-auto object-contain rounded-[20px] transition-transform duration-300 hover:scale-105" 
								/>
							</div>
						</div>
					))}
					
					{/* Fixed plus icon container - removed all potential interference */}
					<div className={`bg-white border border-black/5 rounded-[40px] transition-all duration-700 delay-1100 ease-out hover:scale-[1.02] hover:shadow-lg min-h-[200px] sm:min-h-0 ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
					}`}>
						<div className="w-full h-full flex items-center justify-center">
							<button className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#F2F2F2] text-[#9B9B9B] flex items-center justify-center text-5xl sm:text-6xl transition-all duration-300 hover:bg-[#e8e8e8] hover:scale-110 border-0 outline-none m-0 p-0 leading-none">
								+
							</button>
						</div>
					</div>
				</div>
			</div>
			
			{/* Floating help button */}
			<button className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-xl overflow-hidden transition-all duration-700 delay-1200 ease-out hover:scale-110 z-20 ${
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
	);
}