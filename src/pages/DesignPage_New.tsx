import { useState, useEffect } from "react";
import { useUsageLimits } from "../hooks/useUsageLimits";
import SEO from "@/components/SEO";
import ChatStyleMobileWorkflow from "../components/ChatStyleMobileWorkflow";

export default function DesignPage() {
	const [prompt, setPrompt] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isMobile, setIsMobile] = useState(false);

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
	const { canGenerateImages } = useUsageLimits(userId || '');

	// Detect mobile viewport
	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	const handleCreateClick = () => {
		if (!prompt.trim()) {
			setError('Please enter a prompt first');
			return;
		}

		if (!canGenerateImages) {
			setError(`You have reached your monthly image generation limit. Please upgrade your plan to continue.`);
			return;
		}

		setError(null);
		// Handle generation logic here

	};

	// Mobile Chat View
	if (isMobile) {
		return (
			<>
				<SEO 
					title="Design Playground - Create Your Toy"
					description="Use our AI-powered playground to design custom 3D toys."
					keywords="toy playground, 3D design tool, AI toy creator"
					url="/design"
				/>
				<div className="w-screen h-screen bg-white flex flex-col fixed inset-0 overflow-hidden">
					{/* Mobile Header */}
					<div className="bg-white text-[#212121] px-4 py-3 flex items-center justify-between shadow-sm border-b border-gray-200">
						<div className="flex items-center gap-2">
							<button
								onClick={() => window.location.href = '/dashboard'}
								className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
							</button>
							<h1 className="text-lg font-semibold">Cuddly</h1>
						</div>
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

	// Desktop View - Clean Minimal Design
	return (
		<>
			<SEO 
				title="Design Playground - Create Your Toy"
				description="Use our AI-powered playground to design custom 3D toys."
				keywords="toy playground, 3D design tool, AI toy creator"
				url="/design"
			/>
			<div className="w-screen h-screen bg-[#F5F5F5] flex flex-col fixed inset-0 overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4">
					<div className="flex items-center gap-4">
						<button 
							onClick={() => window.location.href = '/dashboard'}
							className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						</button>
						<h1 className="text-xl font-bold">Cuddly</h1>
					</div>
					<button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
						</svg>
					</button>
				</div>

				{/* Main Content */}
				<div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
					{/* Hero Title */}
					<h2 className="text-6xl font-bold text-center mb-12" style={{ fontFamily: 'serif' }}>
						Make It<br />Memorable
					</h2>

					{/* Example Cards */}
					<div className="flex flex-col gap-4 w-full max-w-md">
						<button 
							onClick={() => {
								setPrompt("Birthday gift for my mum. She is 50 years old");
								handleCreateClick();
							}}
							className="bg-white rounded-2xl p-6 text-left hover:shadow-lg transition-all"
						>
							<h3 className="font-semibold text-lg mb-1">Birthday gift for my mum</h3>
							<p className="text-gray-500 text-sm">She is 50 years old</p>
						</button>

						<button 
							onClick={() => {
								setPrompt("Anniversary Gift for my partner in New York");
								handleCreateClick();
							}}
							className="bg-white rounded-2xl p-6 text-left hover:shadow-lg transition-all"
						>
							<h3 className="font-semibold text-lg mb-1">Anniversary Gift</h3>
							<p className="text-gray-500 text-sm">for my partner in New York</p>
						</button>
					</div>
				</div>

				{/* Fixed Bottom Input Bar */}
				<div className="fixed bottom-6 left-6 right-6 bg-[#E5E5E5] rounded-full px-6 py-4 flex items-center gap-4 shadow-lg">
					<button className="p-2 hover:bg-gray-300 rounded-full transition-colors">
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
					</button>
					
					<input
						type="text"
						placeholder="Ask Cuddly"
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault();
								handleCreateClick();
							}
						}}
						className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
					/>

					<button className="p-2 hover:bg-gray-300 rounded-full transition-colors">
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
						</svg>
					</button>

					<button 
						onClick={handleCreateClick}
						disabled={!canGenerateImages}
						className="w-10 h-10 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors disabled:bg-gray-400"
					>
						<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
						</svg>
					</button>
				</div>

				{/* Error Message */}
				{error && (
					<div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
						{error}
					</div>
				)}
			</div>
		</>
	);
}
