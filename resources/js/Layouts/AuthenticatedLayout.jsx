import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import DropdownNav from '@/Components/DropdownNav';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
	const user = usePage().props.auth.user;
	const roles = usePage().props.auth.roles || [];
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [settingsOpen, setSettingsOpen] = useState(false);

	const NavItem = ({ href, active, icon, children }) => (
		<Link
			href={href}
			className={`flex items-center gap-4 rounded-lg px-6 py-4 text-lg font-semibold transition-colors ${
				active
					? 'bg-brand-primary text-white'
					: 'text-gray-700 hover:bg-brand-primary/10'
			}`}
		>
			<div className="flex h-8 w-8 items-center justify-center">
				{icon}
			</div>
			<span className={`${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
				{children}
			</span>
		</Link>
	);

	return (
		<div className="relative flex min-h-screen bg-gradient-to-br from-emerald-50/70 via-lime-50/60 to-yellow-50/50">
			{/* soft gradient and blobs with low opacity for comfort */}
			<div className="pointer-events-none absolute inset-0 opacity-70">
				<div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/25 blur-2xl" />
				<div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-yellow-200/25 blur-2xl" />
			</div>
			{/* Sidebar */}
			<div className={`fixed inset-y-0 z-[200] flex w-72 flex-col bg-white transition-transform duration-300 ${
				sidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
			} border-r border-gray-200`}>
				{/* Logo */}
				<div className="flex h-20 items-center justify-between px-6">
					<Link href={route('admin.admin-page')} className="flex items-center gap-3">
						<ApplicationLogo className="h-12 w-12" />
						<span className={`text-2xl font-bold transition-opacity duration-200 ${
							sidebarOpen ? 'opacity-100' : 'opacity-0'
						}`}>
							SmartAttend
						</span>
					</Link>
				</div>

				{/* Navigation */}
				<div className="flex-1 space-y-2 px-4 py-6">
					{roles.includes('Admin') && !roles.includes('Super Admin') && (
						<>
							<NavItem
								href={route('admin.admin-page')}
								active={route().current('admin.admin-page*')}
								icon={
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
									</svg>
								}
							>
								Dashboard
							</NavItem>

							<NavItem
								href={route('admin.tracking')}
								active={route().current('admin.tracking*')}
								icon={
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
									</svg>
								}
							>
								Student Tracking
							</NavItem>

							<NavItem
								href={route('admin.students')}
								active={route().current('admin.students*')}
								icon={
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
									</svg>
								}
							>
								Students
							</NavItem>
						</>
					)}

					{roles.includes('Super Admin') && (
						<>
							<NavItem
								href={route('super.dashboard')}
								active={route().current('super.dashboard*')}
								icon={
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
									</svg>
								}
							>
								Dashboard
							</NavItem>

						<NavItem
							href={route('super.management')}
							active={route().current('super.management*')}
							icon={
								<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
							}
						>
							Management
						</NavItem>

							<NavItem
								href={route('super.attendance')}
								active={route().current('super.attendance*')}
								icon={
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
									</svg>
								}
							>
								Attendance
							</NavItem>


							<DropdownNav
								icon={
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
								}
								label="Settings"
								isOpen={settingsOpen}
								onToggle={() => setSettingsOpen(!settingsOpen)}
							>
								<NavItem
									href={route('super.settings') + '#students'}
									active={route().current('super.settings*')}
									icon={
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
										</svg>
									}
								>
									Student
								</NavItem>
								<NavItem
									href={route('super.teachers')}
									active={route().current('super.teachers*')}
									icon={
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
									}
								>
									Teachers/Advisers
								</NavItem>
								<NavItem
									href={route('super.sections')}
									active={route().current('super.sections*')}
									icon={
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
										</svg>
									}
								>
									Sections
								</NavItem>
								<NavItem
									href={route('super.subjects')}
									active={route().current('super.subjects*')}
									icon={
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
										</svg>
									}
								>
									Subjects
								</NavItem>
								<NavItem
									href={route('super.schedules')}
									active={route().current('super.schedules*')}
									icon={
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
									}
								>
									Schedules
								</NavItem>
								<NavItem
									href={route('super.departments')}
									active={route().current('super.departments*')}
									icon={
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
										</svg>
									}
								>
									Departments
								</NavItem>
								<NavItem
									href={route('super.users')}
									active={route().current('super.users*')}
									icon={
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
										</svg>
									}
								>
									Users
								</NavItem>
							<NavItem
								href={route('super.system-admin')}
								active={route().current('super.system-admin*')}
								icon={
									<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
								}
							>
								System Admin
							</NavItem>
							</DropdownNav>
						</>
					)}

					{roles.includes('CSDL') && !roles.includes('Admin') && !roles.includes('Super Admin') && (
						<>
							<NavItem
								href={route('csdl.dashboard')}
								active={route().current('csdl.dashboard*')}
								icon={
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
									</svg>
								}
							>
								Dashboard
							</NavItem>

							<NavItem
								href={route('csdl.csdl-page')}
								active={route().current('csdl.csdl-page*')}
								icon={
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
									</svg>
								}
							>
								Student Tracking
							</NavItem>

							<NavItem
								href={route('csdl.reports')}
								active={route().current('csdl.reports*')}
								icon={
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
									</svg>
								}
							>
								Reports
							</NavItem>
						</>
					)}
				</div>

				{/* User Info - Display only when sidebar is open */}
				{sidebarOpen && (
					<div className="border-t border-gray-200 p-6">
						<div className="flex items-center gap-4">
							<div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-brand-secondary">
								<svg className="h-full w-full text-gray-800" fill="currentColor" viewBox="0 0 24 24">
									<path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
								</svg>
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-base font-semibold text-gray-900">{user.name}</p>
								<div className="flex items-center gap-2">
									<p className="truncate text-base text-gray-500">{roles.join(', ')}</p>
									{roles.includes('Super Admin') && (
										<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
											<svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3.292 7.132a1 1 0 01-.372-1.364L5.618 4.504zm8.764 0a1 1 0 00.372 1.364L16.984 6l-.23.132a1 1 0 00.992 1.736L16.708 7.132a1 1 0 00.372-1.364L14.382 4.504z" clipRule="evenodd" />
											</svg>
											SUPER
										</span>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Top Navigation Bar */}
			<div className={`fixed top-0 right-0 z-[150] flex h-20 items-center justify-between bg-white shadow-sm transition-all duration-300 ${
				sidebarOpen ? 'left-72' : 'left-0'
			} border-b border-gray-200`}>
				<div className="flex items-center gap-4 px-4">
					<button
						onClick={() => setSidebarOpen(!sidebarOpen)}
						className="rounded-lg p-2 hover:bg-gray-100"
						aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
					>
						<svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
								sidebarOpen
									? "M11 19l-7-7 7-7m8 14l-7-7 7-7"
									: "M13 5l7 7-7 7M5 5l7 7-7 7"
							} />
						</svg>
					</button>
				</div>
				<div className="flex items-center gap-4 px-6">
					{/* Profile Button */}
					<Dropdown>
						<Dropdown.Trigger>
							<button className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
								<div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-brand-secondary">
									<svg className="h-full w-full text-gray-800" fill="currentColor" viewBox="0 0 24 24">
										<path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
									</svg>
								</div>
								<span className="hidden sm:block">{user.name}</span>
								{roles.includes('Super Admin') && (
									<span className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ml-2">
										<svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3.292 7.132a1 1 0 01-.372-1.364L5.618 4.504zm8.764 0a1 1 0 00.372 1.364L16.984 6l-.23.132a1 1 0 00.992 1.736L16.708 7.132a1 1 0 00.372-1.364L14.382 4.504z" clipRule="evenodd" />
										</svg>
										SUPER
									</span>
								)}
								<svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
								</svg>
							</button>
						</Dropdown.Trigger>
						<Dropdown.Content>
							<Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
						</Dropdown.Content>
					</Dropdown>

					{/* Logout Button */}
					<Link
						href={route('logout')}
						method="post"
						as="button"
						className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
					>
						<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
						<span className="hidden sm:block">Logout</span>
					</Link>
				</div>
			</div>

			{/* Main Content */}
			<div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-0'} pt-20`}>
				{header && (
					<header className="bg-white shadow">
						<div className="mx-auto px-6 py-8 sm:px-8 lg:px-10">
							{header}
						</div>
					</header>
				)}

				<main className="page mx-auto px-6 py-8 sm:px-8 lg:px-10">{children}</main>
			</div>
		</div>
	);
}