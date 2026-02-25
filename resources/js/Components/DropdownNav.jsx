import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

const DropdownNav = ({ icon, children, label, isOpen, onToggle }) => {
	const { url } = usePage();
	
	// Check if any child route is active
	const isAnyChildActive = () => {
		// Check if current URL matches any of the settings routes
		return url.includes('/admin/sections') || 
			   url.includes('/admin/subjects') || 
			   url.includes('/admin/schedules') || 
			   url.includes('/super/settings') ||
			   url.includes('/super/teachers') ||
			   url.includes('/super/sections') ||
			   url.includes('/super/subjects') ||
			   url.includes('/super/schedules') ||
			   url.includes('/super/departments') || 
			   url.includes('/super/users') ||
			   url.includes('/super/system-admin');
	};
	
	const anyActive = isAnyChildActive();

	// Auto-open only when entering a child route (prevents "re-opening" glitches)
	const prevAnyActiveRef = useRef(false);
	useEffect(() => {
		const wasActive = prevAnyActiveRef.current;
		if (!wasActive && anyActive && !isOpen) {
			onToggle();
		}
		prevAnyActiveRef.current = anyActive;
	}, [anyActive, isOpen, onToggle]);

	return (
		<div className="relative">
			<button
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onToggle();
				}}
				className={`flex items-center gap-4 rounded-lg px-6 py-4 text-lg font-semibold transition-colors w-full ${
					isOpen || anyActive
						? 'bg-brand-primary text-white'
						: 'text-gray-700 hover:bg-brand-primary/10'
				}`}
			>
				<div className="flex h-8 w-8 items-center justify-center">
					{icon}
				</div>
				<span className="flex-1 text-left">{label}</span>
				<svg
					className={`h-5 w-5 transition-transform duration-200 ${
						isOpen ? 'rotate-180' : ''
					}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>
			
			{isOpen && (
				<div 
					className="ml-4 mt-2 space-y-1 border-l-2 border-brand-primary/20 pl-4"
					onClick={(e) => e.stopPropagation()}
				>
					{children}
				</div>
			)}
		</div>
	);
};

export default DropdownNav;
