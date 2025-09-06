import { useState, useEffect } from "react";

interface Section {
	title: string;
	icon: string;
}

interface Sections {
	[key: string]: Section;
}

export default function ImprovedAdvancedDesignPage() {
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setIsLoaded(true), 100);
		return () => clearTimeout(timer);
	}, []);

	const sections: Sections = {
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

	const renderMainCategories = () => {
		return (
			<div className="flex flex-col items-center text-center">
				<div className={`mb-4 text-white/70 text-sm transition-all duration-700 delay-200 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
					Choose your design properties
				</div>
				
				<div className={`grid grid-cols-3 gap-4 w-full max-w-[350px] transition-all duration-700 delay-300 ease-out ${
					isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
				}`}>
					{Object.entries(sections).map(([key, section], index) => (
						<div
							key={key}
							className="flex flex-col items-center gap-2 p-3 rounded-[15px] bg-white/10 border border-white/10 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-pointer"
							style={{ transitionDelay: `${400 + index * 50}ms` }}
						>
							<div className="w-[60px] h-[80px] flex items-center justify-center bg-white/10">
								<img 
									src={section.icon} 
									alt={section.title} 
									className="w-[60px] h-[80px] object-contain" 
									style={{
										width: '60px',
										height: '80px',
										transform: 'rotate(0deg)',
										opacity: 1
									}}
								/>
							</div>
							<span className="text-xs font-medium text-white/90">{section.title}</span>
						</div>
					))}
				</div>

				<button 
					className={`mt-6 px-6 py-2 w-[120px] h-[35px] rounded-[30px] bg-[#E70D57] hover:bg-[#d10c50] text-white font-medium text-sm transition-all duration-700 delay-600 ease-out hover:scale-105 ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}
				>
					Create Design
				</button>
			</div>
		);
	};

	return (
		<div className="w-screen h-screen bg-white overflow-hidden flex p-4 gap-4">
			<aside className={`flex-shrink-0 w-full max-w-[476px] min-w-[320px] lg:w-[476px] bg-[#313131] rounded-[40px] relative overflow-hidden transition-all duration-1000 ease-out ${
				isLoaded ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-8'
			}`}>
				<div className="absolute top-4 right-4 sm:top-6 sm:right-6 text-sm text-white/70 z-10">Advanced</div>
				
				<div className="pt-[6.4rem] sm:pt-[7.6rem] px-4 sm:px-6 pb-4 text-white flex flex-col items-center text-center h-full">
					<div className={`mb-4 flex items-center px-1 gap-2 w-full max-w-[222px] h-[31px] rounded-full bg-black/50 transition-all duration-700 delay-200 ease-out ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}>
						<button className="flex-1 h-[22px] rounded-full text-xs text-white/90 transition-colors hover:bg-white/10">Live</button>
						<button className="flex-1 h-[22px] rounded-full text-xs bg-[#DFDFDF] text-black transition-colors">Chat</button>
						<button className="flex-1 h-[22px] rounded-full text-xs text-white/90 transition-colors hover:bg-white/10">Draw</button>
					</div>
					
					<h1 className={`font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight text-center max-w-full transition-all duration-700 delay-300 ease-out ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}>Playground</h1>
					<p className={`mt-1 lg:mt-4 opacity-80 text-xs sm:text-sm transition-all duration-700 delay-400 ease-out ${
						isLoaded ? 'opacity-80 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}>You are a Vibe Designer now</p>
					
					<input
						placeholder="I want a toy camera"
						className={`mt-3 lg:mt-8 px-4 py-2 outline-none w-full max-w-[350px] h-[40px] rounded-[20px] border border-white/35 bg-white text-black text-[20px] transition-all duration-700 delay-500 ease-out ${
							isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
						}`}
						style={{ caretColor: "#000" }}
					/>

					<div className={`mt-6 w-full max-w-[350px] transition-all duration-700 delay-600 ease-out ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
					}`}>
						{renderMainCategories()}
					</div>
				</div>
			</aside>

			<div className={`flex-1 min-w-0 transition-all duration-1000 delay-200 ease-out ${
				isLoaded ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-8'
			}`}>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full w-full">
					{['/camera1.png', '/camera2.png', '/camera3.png'].map((src, index) => (
						<div key={index} className={`bg-white border border-black/5 rounded-[40px] flex items-center justify-center min-h-[200px] sm:min-h-0 transition-all duration-700 ease-out hover:scale-[1.02] hover:shadow-lg ${
							isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
						}`} style={{ transitionDelay: `${800 + index * 100}ms` }}>
							<div className="w-full h-full max-w-[206px] max-h-[216px] flex items-center justify-center p-4">
								<img src={src} alt={`Toy camera design ${index + 1}`} className="max-w-full max-h-full w-auto h-auto object-contain rounded-[20px] transition-transform duration-300 hover:scale-105" />
							</div>
						</div>
					))}
					
					<div className={`bg-white border border-black/5 rounded-[40px] transition-all duration-700 delay-1100 ease-out hover:scale-[1.02] hover:shadow-lg min-h-[200px] sm:min-h-0 ${
						isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
					}`}>
						<div className="w-full h-full flex items-center justify-center">
							<button className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#F2F2F2] text-[#9B9B9B] flex items-center justify-center text-5xl sm:text-6xl transition-all duration-300 hover:bg-[#e8e8e8] hover:scale-110 border-0 outline-none m-0 p-0 leading-none">+</button>
						</div>
					</div>
				</div>
			</div>
			
			<button className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-xl overflow-hidden transition-all duration-700 delay-1200 ease-out hover:scale-110 z-20 ${
				isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
			}`}>
				<img src="/icon.png" alt="Help" className="w-full h-full object-cover" />
			</button>
		</div>
	);
}