import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
	const user = usePage().props.auth.user;
	const roles = usePage().props.auth.roles || [];
	const [sidebarOpen, setSidebarOpen] = useState(true);

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
			<div className={`fixed inset-y-0 z-50 flex flex-col bg-white transition-all duration-300 ${
				sidebarOpen ? 'w-72' : 'w-24'
			} border-r border-gray-200`}>
				{/* Logo */}
				<div className="flex h-20 items-center justify-between px-6">
					<Link href={route('admin.dashboard')} className="flex items-center gap-3">
						<ApplicationLogo className="h-12 w-12" />
						<span className={`text-2xl font-bold transition-opacity duration-200 ${
							sidebarOpen ? 'opacity-100' : 'opacity-0'
						}`}>
							SmartAttend
						</span>
					</Link>
					<button
						onClick={() => setSidebarOpen(!sidebarOpen)}
						className="rounded-lg p-2 hover:bg-gray-100"
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

				{/* Navigation */}
				<div className="flex-1 space-y-2 px-4 py-6">
					{(roles.includes('Admin') || roles.includes('Super Admin')) && (
						<>
							<NavItem
								href={route('admin.attendance')}
								active={route().current('admin.attendance*')}
								icon={
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
								}
							>
								Attendance
							</NavItem>

							<NavItem
								href={route('admin.interventions')}
								active={route().current('admin.interventions*')}
								icon={
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
									</svg>
								}
							>
								Interventions
							</NavItem>

							<NavItem
								href={route('admin.reports')}
								active={route().current('admin.reports*')}
								icon={
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								}
							>
								Reports
							</NavItem>

							<NavItem
								href={route('admin.sections')}
								active={route().current('admin.sections*')}
								icon={
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
								}
							>
								Sections
							</NavItem>

							<NavItem
								href={route('admin.subjects')}
								active={route().current('admin.subjects*')}
								icon={
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
									</svg>
								}
							>
								Subjects
							</NavItem>

							<NavItem
								href={route('admin.schedules')}
								active={route().current('admin.schedules*')}
								icon={
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
								}
							>
								Schedules
							</NavItem>
						</>
					)}

					{roles.includes('Super Admin') && (
						<NavItem
							href={route('super.users')}
							active={route().current('super.users*')}
							icon={
								<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
								</svg>
							}
						>
							Users
						</NavItem>
					)}
				</div>

				{/* User Profile */}
				<div className="border-t border-gray-200 p-6">
					<div className="flex items-center gap-4">
						<div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-brand-secondary">
							<svg className="h-full w-full text-gray-800" fill="currentColor" viewBox="0 0 24 24">
								<path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
							</svg>
						</div>
						{sidebarOpen && (
							<div className="min-w-0 flex-1">
								<div className="flex items-center justify-between">
									<p className="truncate text-base font-semibold text-gray-900">{user.name}</p>
									<Dropdown>
										<Dropdown.Trigger>
											<button className="rounded-full p-2 hover:bg-gray-100">
												<svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
												</svg>
											</button>
										</Dropdown.Trigger>
										<Dropdown.Content>
											<Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
											<Dropdown.Link href={route('logout')} method="post" as="button">Log Out</Dropdown.Link>
										</Dropdown.Content>
									</Dropdown>
								</div>
								<p className="truncate text-base text-gray-500">{roles.join(', ')}</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-24'}`}>
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