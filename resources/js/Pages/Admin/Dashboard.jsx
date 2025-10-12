import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import StatsCard from '@/Components/StatsCard';
import DataTable from '@/Components/DataTable';

export default function Dashboard() {
	const { chart, recentInterventions, recentAbsences, stats, atRiskStudents, recentRecords, todayStats, sections, totalStudentsCount, overallAttendanceRate } = usePage().props;
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedSection, setSelectedSection] = useState('');
	const [selectedStatus, setSelectedStatus] = useState('');
	const canvasRef = useRef(null);

	// Filter records based on search and filters
	const filteredRecords = recentRecords?.filter(record => {
		const matchesSearch = !searchTerm || 
			record.student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			record.student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			record.student?.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			record.student?.section?.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			record.student?.section?.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			record.student?.section?.name?.toLowerCase().includes(searchTerm.toLowerCase());
		
		const matchesSection = !selectedSection || record.student?.section?.id == selectedSection;
		const matchesStatus = !selectedStatus || record.status === selectedStatus;
		
		return matchesSearch && matchesSection && matchesStatus;
	}) || [];

	const getStatusColor = (status) => {
		switch (status) {
			case 'present': return 'bg-green-100 text-green-800';
			case 'late': return 'bg-yellow-100 text-yellow-800';
			case 'absent': return 'bg-red-100 text-red-800';
			case 'excused': return 'bg-blue-100 text-blue-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	};

	const formatTime = (timeString) => {
		if (!timeString) return '-';
		return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	};

	useEffect(() => {
		if (!canvasRef.current || !chart) return;
		const ctx = canvasRef.current.getContext('2d');
		const instance = new Chart(ctx, {
			type: 'line',
			data: {
				labels: chart.labels,
				datasets: [
					{
						label: 'Weekly Attendance %',
						data: chart.weeklyRates,
						borderColor: '#3B4F26',
						backgroundColor: 'rgba(59, 79, 38, 0.1)',
						fill: true,
						tension: 0.3,
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					legend: { display: true },
					tooltip: {
						backgroundColor: '#3B4F26',
						titleColor: '#FFFFFF',
						bodyColor: '#FFFFFF',
						padding: 12,
						displayColors: false,
					},
				},
				scales: {
					y: {
						min: 0,
						max: 100,
						grid: {
							color: 'rgba(0, 0, 0, 0.05)',
						},
					},
					x: {
						grid: {
							display: false,
						},
					},
				},
			},
		});
		return () => instance.destroy();
	}, [chart]);

	return (
		<AuthenticatedLayout header={<h2 className="text-2xl font-bold leading-tight text-gray-800">Dashboard</h2>}>
			<Head title="Dashboard" />
			<div className="min-h-screen py-8">
				<div className="mx-auto max-w-full space-y-10 px-4 sm:px-6 lg:px-8 xl:px-12">
					{/* Attendance Management Header */}
					<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-10 text-white">
						<div className="absolute inset-0 bg-black/10"></div>
						<div className="relative">
							<div className="flex items-center justify-between">
								<div>
									<h1 className="text-4xl font-bold mb-4">Dashboard</h1>
									<p className="text-xl text-blue-100 mb-6">Monitor and manage student attendance across all departments and programs</p>
									<div className="flex items-center gap-6">
										<div className="flex items-center gap-3">
											<div className="h-3 w-3 bg-green-400 rounded-full"></div>
											<span className="text-blue-100">Real-time tracking</span>
										</div>
										<div className="flex items-center gap-3">
											<div className="h-3 w-3 bg-yellow-400 rounded-full"></div>
											<span className="text-blue-100">Automated reports</span>
										</div>
										<div className="flex items-center gap-3">
											<div className="h-3 w-3 bg-purple-400 rounded-full"></div>
											<span className="text-blue-100">Bulk operations</span>
										</div>
									</div>
								</div>
								<div className="hidden lg:block">
									<div className="h-32 w-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
										<svg className="h-16 w-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Today's Stats Cards */}
					{todayStats && (
						<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
							<div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<div className="h-16 w-16 rounded-lg bg-green-100 flex items-center justify-center">
											<svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										</div>
									</div>
									<div className="ml-6">
										<p className="text-lg font-medium text-gray-500">Present Today</p>
										<p className="text-4xl font-semibold text-gray-900">{todayStats.present || 0}</p>
									</div>
								</div>
							</div>
							<div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<div className="h-16 w-16 rounded-lg bg-yellow-100 flex items-center justify-center">
											<svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										</div>
									</div>
									<div className="ml-6">
										<p className="text-lg font-medium text-gray-500">Late Today</p>
										<p className="text-4xl font-semibold text-gray-900">{todayStats.late || 0}</p>
									</div>
								</div>
							</div>
							<div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<div className="h-16 w-16 rounded-lg bg-red-100 flex items-center justify-center">
											<svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
											</svg>
										</div>
									</div>
									<div className="ml-6">
										<p className="text-lg font-medium text-gray-500">Absent Today</p>
										<p className="text-4xl font-semibold text-gray-900">{todayStats.absent || 0}</p>
									</div>
								</div>
							</div>
							<div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center">
											<svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
										</div>
									</div>
									<div className="ml-6">
										<p className="text-lg font-medium text-gray-500">Excused Today</p>
										<p className="text-4xl font-semibold text-gray-900">{todayStats.excused || 0}</p>
									</div>
								</div>
							</div>
							<div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<div className="h-16 w-16 rounded-lg bg-purple-100 flex items-center justify-center">
											<svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
											</svg>
										</div>
									</div>
									<div className="ml-6">
										<p className="text-lg font-medium text-gray-500">Total Students</p>
										<p className="text-4xl font-semibold text-gray-900">{totalStudentsCount || 0}</p>
									</div>
								</div>
							</div>
							<div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<div className="h-16 w-16 rounded-lg bg-indigo-100 flex items-center justify-center">
											<svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
											</svg>
										</div>
									</div>
									<div className="ml-6">
										<p className="text-lg font-medium text-gray-500">Attendance Rate</p>
										<p className="text-4xl font-semibold text-gray-900">{overallAttendanceRate || 0}%</p>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Recent Records Section */}
					{recentRecords && (
						<div className="card p-10">
							<div className="mb-10 flex items-center justify-between">
								<div>
									<h3 className="text-3xl font-bold text-gray-900">Recent Attendance Records</h3>
									<p className="text-lg text-gray-600 mt-2">Latest attendance entries across all departments</p>
								</div>
								<div className="flex items-center gap-6">
									<div className="relative">
										<input 
											type="text" 
											className="rounded-lg border-gray-300 pl-12 pr-6 focus:border-brand-primary focus:ring-brand-primary text-lg py-4 w-80" 
											placeholder="Search by student, department, program, or section..." 
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
										/>
										<svg className="absolute left-4 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
										</svg>
									</div>
									<select 
										className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary text-lg py-4 px-4"
										value={selectedSection}
										onChange={(e) => setSelectedSection(e.target.value)}
									>
										<option value="">All Sections</option>
										{sections?.map(section => (
											<option key={section.id} value={section.id}>{section.name}</option>
										))}
									</select>
									<select 
										className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary text-lg py-4 px-4"
										value={selectedStatus}
										onChange={(e) => setSelectedStatus(e.target.value)}
									>
										<option value="">All Status</option>
										<option value="present">Present</option>
										<option value="late">Late</option>
										<option value="absent">Absent</option>
										<option value="excused">Excused</option>
									</select>
								</div>
							</div>

							<DataTable
								columns={[
									{ key: 'date', label: 'Date', render: (date) => new Date(date).toLocaleDateString() },
									{ key: 'department', label: 'Department', render: (_, row) => (
										<div className="font-medium text-gray-900">
											{row.student?.section?.department || '-'}
										</div>
									)},
									{ key: 'program', label: 'Program', render: (_, row) => (
										<div className="font-medium text-gray-900">
											{row.student?.section?.program || '-'}
										</div>
									)},
									{ key: 'year_level', label: 'Year Level', render: (_, row) => (
										<div className="font-medium text-gray-900">
											{row.student?.section?.year_level || '-'}
										</div>
									)},
									{ key: 'section', label: 'Section', render: (_, row) => (
										<div className="font-medium text-gray-900">
											{row.student?.section?.name || '-'}
										</div>
									)},
									{ key: 'student', label: 'Student', render: (_, row) => (
										<div>
											<div className="font-medium">{row.student?.first_name} {row.student?.last_name}</div>
											<div className="text-sm text-gray-500">{row.student?.student_number}</div>
										</div>
									)},
									{ key: 'status', label: 'Status', render: (status) => (
										<span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(status)}`}>
											{status?.toUpperCase()}
										</span>
									)},
									{ key: 'schedule', label: 'Subject', render: (_, row) => (
										<div>
											<div className="font-medium">{row.schedule?.subject?.name || 'General'}</div>
											{row.schedule && (
												<div className="text-sm text-gray-500">
													{formatTime(row.schedule.time_start)} - {formatTime(row.schedule.time_end)}
												</div>
											)}
										</div>
									)},
									{ key: 'remarks', label: 'Remarks', render: (remarks) => remarks || '-' },
									{ key: 'created_at', label: 'Recorded', render: (created_at) => new Date(created_at).toLocaleString() },
								]}
								data={filteredRecords}
							/>

							<div className="mt-10 flex items-center justify-between border-t border-gray-200 pt-10">
								<p className="text-xl text-gray-700">Showing {filteredRecords.length} of {recentRecords?.length || 0} entries</p>
								<div className="flex gap-6">
									<button className="rounded-xl border border-gray-300 px-8 py-4 text-lg hover:bg-gray-50 transition-colors">Previous</button>
									<button className="rounded-xl border border-gray-300 px-8 py-4 text-lg hover:bg-gray-50 transition-colors">Next</button>
								</div>
							</div>
						</div>
					)}

					{/* Quick Actions */}
					<div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
						<Link href={route('admin.attendance.section')} className="card group hover:border-brand-primary hover:shadow-lg transition-all duration-200 p-6">
							<div className="flex items-center gap-6">
								<div className="rounded-xl bg-brand-primary bg-opacity-10 p-4 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-200">
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900">Record Attendance</h3>
									<p className="text-base text-gray-500">Take daily attendance</p>
								</div>
							</div>
						</Link>

						<Link href={route('admin.interventions')} className="card group hover:border-brand-primary hover:shadow-lg transition-all duration-200 p-6">
							<div className="flex items-center gap-6">
								<div className="rounded-xl bg-brand-primary bg-opacity-10 p-4 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-200">
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
									</svg>
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900">Interventions</h3>
									<p className="text-base text-gray-500">Manage student interventions</p>
								</div>
							</div>
						</Link>

						<Link href={route('admin.reports')} className="card group hover:border-brand-primary hover:shadow-lg transition-all duration-200 p-6">
							<div className="flex items-center gap-6">
								<div className="rounded-xl bg-brand-primary bg-opacity-10 p-4 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-200">
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900">Reports</h3>
									<p className="text-base text-gray-500">View attendance reports</p>
								</div>
							</div>
						</Link>

						<Link href={route('admin.sections')} className="card group hover:border-brand-primary hover:shadow-lg transition-all duration-200 p-6">
							<div className="flex items-center gap-6">
								<div className="rounded-xl bg-brand-primary bg-opacity-10 p-4 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-200">
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900">Sections</h3>
									<p className="text-base text-gray-500">Manage class sections</p>
								</div>
							</div>
						</Link>

						<Link href={route('admin.attendance.import')} className="card group hover:border-brand-primary hover:shadow-lg transition-all duration-200 p-6">
							<div className="flex items-center gap-6">
								<div className="rounded-xl bg-brand-primary bg-opacity-10 p-4 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-200">
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
									</svg>
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900">Import Data</h3>
									<p className="text-base text-gray-500">Bulk import records</p>
								</div>
							</div>
						</Link>

						<Link href={route('admin.sections.import')} className="card group hover:border-brand-primary hover:shadow-lg transition-all duration-200 p-6">
							<div className="flex items-center gap-6">
								<div className="rounded-xl bg-brand-primary bg-opacity-10 p-4 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-200">
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
									</svg>
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900">Import Sections</h3>
									<p className="text-base text-gray-500">Import sections & students</p>
								</div>
							</div>
						</Link>

						<Link href="#" className="card group hover:border-brand-primary hover:shadow-lg transition-all duration-200 p-6">
							<div className="flex items-center gap-6">
								<div className="rounded-xl bg-brand-primary bg-opacity-10 p-4 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-200">
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900">Settings</h3>
									<p className="text-base text-gray-500">System configuration</p>
								</div>
							</div>
						</Link>
					</div>

					{/* Stats Overview */}
					<div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
						<StatsCard
							icon={<svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>}
							title="Present Today"
							value={`${stats?.presentToday?.rate || 0}%`}
							subtitle={`${stats?.presentToday?.count || 0} of ${stats?.presentToday?.total || 0} students`}
						/>
						<StatsCard
							icon={<svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>}
							title="Late Today"
							value={`${stats?.lateToday?.rate || 0}%`}
							subtitle={`${stats?.lateToday?.count || 0} students`}
						/>
						<StatsCard
							icon={<svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
							</svg>}
							title="Absent Today"
							value={`${stats?.absentToday?.rate || 0}%`}
							subtitle={`${stats?.absentToday?.count || 0} students`}
						/>
						<StatsCard
							icon={<svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
							</svg>}
							title="Weekly Average"
							value={`${stats?.weeklyAverage || 0}%`}
							subtitle="Last 8 weeks"
						/>
						<StatsCard
							icon={<svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>}
							title="Excused Today"
							value="12"
							subtitle="Students excused"
						/>
						<StatsCard
							icon={<svg className="h-6 w-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>}
							title="Total Classes"
							value="45"
							subtitle="Active sections"
						/>
					</div>

					{/* Additional Stats */}
					<div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-6">
						<StatsCard
							icon={<svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>}
							title="Open Interventions"
							value={stats?.openInterventions || 0}
							subtitle="Require attention"
						/>
						<StatsCard
							icon={<svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>}
							title="At-Risk Students"
							value={stats?.atRiskStudents || 0}
							subtitle="3+ absences (2 weeks)"
						/>
						<StatsCard
							icon={<svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>}
							title="Total Students"
							value={stats?.presentToday?.total || 0}
							subtitle="Enrolled"
						/>
						<StatsCard
							icon={<svg className="h-6 w-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>}
							title="Attendance Rate"
							value="94.2%"
							subtitle="Overall average"
						/>
						<StatsCard
							icon={<svg className="h-6 w-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
							</svg>}
							title="Trending Up"
							value="+2.3%"
							subtitle="This week"
						/>
					</div>

					{/* Attendance Trend */}
					<div className="card p-8">
						<h3 className="mb-6 text-2xl font-bold text-gray-800">Attendance Trend</h3>
						<canvas ref={canvasRef} height="120"></canvas>
					</div>

					{/* Recent Activities */}
					<div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
						<div className="card p-6">
							<div className="mb-6 flex items-center justify-between">
								<h3 className="text-xl font-bold text-gray-800">Recent Absences</h3>
								<Link href={route('admin.attendance.section')} className="text-base font-medium text-brand-primary hover:text-brand-primary/80">
									View All
								</Link>
							</div>
							<div className="divide-y">
								{recentAbsences?.length > 0 ? recentAbsences.map((r) => (
									<div key={r.id} className="flex items-center justify-between py-4">
										<div>
											<p className="text-lg font-semibold text-gray-900">{r.student?.first_name} {r.student?.last_name}</p>
											<p className="text-base text-gray-500">{new Date(r.date).toLocaleDateString()}</p>
										</div>
										<span className="rounded-full bg-red-100 px-4 py-2 text-sm font-medium uppercase text-red-800">{r.status}</span>
									</div>
								)) : (
									<p className="py-6 text-base text-gray-500 text-center">No recent absences</p>
								)}
							</div>
						</div>

						<div className="card p-6">
							<div className="mb-6 flex items-center justify-between">
								<h3 className="text-xl font-bold text-gray-800">Recent Interventions</h3>
								<Link href={route('admin.interventions')} className="text-base font-medium text-brand-primary hover:text-brand-primary/80">
									View All
								</Link>
							</div>
							<div className="divide-y">
								{recentInterventions?.length > 0 ? recentInterventions.map((i) => (
									<div key={i.id} className="flex items-center justify-between py-4">
										<div>
											<p className="text-lg font-semibold text-gray-900">{i.student?.first_name} {i.student?.last_name}</p>
											<p className="text-base text-gray-500">{new Date(i.date).toLocaleDateString()}</p>
										</div>
										<div className="flex flex-col items-end gap-2">
											<span className="rounded-full bg-brand-primary bg-opacity-10 px-4 py-2 text-sm font-medium text-brand-primary">{i.type}</span>
											<span className={`rounded-full px-3 py-1 text-sm font-medium ${
												i.status === 'resolved' ? 'bg-green-100 text-green-700' : 
												i.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
												'bg-yellow-100 text-yellow-800'
											}`}>
												{i.status?.replace('_', ' ')}
											</span>
										</div>
									</div>
								)) : (
									<p className="py-6 text-base text-gray-500 text-center">No recent interventions</p>
								)}
							</div>
						</div>

						<div className="card p-6">
							<div className="mb-6 flex items-center justify-between">
								<h3 className="text-xl font-bold text-gray-800">At-Risk Students</h3>
								<Link href={route('admin.interventions')} className="text-base font-medium text-brand-primary hover:text-brand-primary/80">
									Create Intervention
								</Link>
							</div>
							<div className="divide-y">
								{atRiskStudents?.length > 0 ? atRiskStudents.map((student) => (
									<div key={student.student_id} className="flex items-center justify-between py-4">
										<div>
											<p className="text-lg font-semibold text-gray-900">{student.student?.first_name} {student.student?.last_name}</p>
											<p className="text-base text-gray-500">{student.absence_count} absences (2 weeks)</p>
										</div>
										<span className="rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-800">At Risk</span>
									</div>
								)) : (
									<p className="py-6 text-base text-gray-500 text-center">No at-risk students</p>
								)}
							</div>
						</div>

						<div className="card p-6">
							<div className="mb-6 flex items-center justify-between">
								<h3 className="text-xl font-bold text-gray-800">System Status</h3>
								<span className="text-base font-medium text-green-600">All Systems Operational</span>
							</div>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-base text-gray-700">Database</span>
									<span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">Online</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-base text-gray-700">API Services</span>
									<span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">Online</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-base text-gray-700">Backup System</span>
									<span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">Online</span>
								</div>
							</div>
						</div>

						<div className="card p-6">
							<div className="mb-6 flex items-center justify-between">
								<h3 className="text-xl font-bold text-gray-800">Quick Stats</h3>
								<span className="text-base font-medium text-blue-600">Today</span>
							</div>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-base text-gray-700">Classes Today</span>
									<span className="text-lg font-bold text-gray-900">24</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-base text-gray-700">Teachers Active</span>
									<span className="text-lg font-bold text-gray-900">18</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-base text-gray-700">Records Updated</span>
									<span className="text-lg font-bold text-gray-900">156</span>
								</div>
							</div>
						</div>
					</div>


					{/* Recent Records Section */}
					{recentRecords && (
						<div className="card p-10">
							<div className="mb-10 flex items-center justify-between">
								<div>
									<h3 className="text-3xl font-bold text-gray-900">Recent Attendance Records</h3>
									<p className="text-lg text-gray-600 mt-2">Latest attendance entries across all departments</p>
								</div>
								<div className="flex items-center gap-6">
									<div className="relative">
										<input 
											type="text" 
											className="rounded-lg border-gray-300 pl-12 pr-6 focus:border-brand-primary focus:ring-brand-primary text-lg py-4 w-80" 
											placeholder="Search by student, department, program, or section..." 
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
										/>
										<svg className="absolute left-4 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
										</svg>
									</div>
									<select 
										className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary text-lg py-4 px-4"
										value={selectedSection}
										onChange={(e) => setSelectedSection(e.target.value)}
									>
										<option value="">All Sections</option>
										{sections?.map(section => (
											<option key={section.id} value={section.id}>{section.name}</option>
										))}
									</select>
									<select 
										className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary text-lg py-4 px-4"
										value={selectedStatus}
										onChange={(e) => setSelectedStatus(e.target.value)}
									>
										<option value="">All Status</option>
										<option value="present">Present</option>
										<option value="late">Late</option>
										<option value="absent">Absent</option>
										<option value="excused">Excused</option>
									</select>
								</div>
							</div>

							<DataTable
								columns={[
									{ key: 'date', label: 'Date', render: (date) => new Date(date).toLocaleDateString() },
									{ key: 'department', label: 'Department', render: (_, row) => (
										<div className="font-medium text-gray-900">
											{row.student?.section?.department || '-'}
										</div>
									)},
									{ key: 'program', label: 'Program', render: (_, row) => (
										<div className="font-medium text-gray-900">
											{row.student?.section?.program || '-'}
										</div>
									)},
									{ key: 'year_level', label: 'Year Level', render: (_, row) => (
										<div className="font-medium text-gray-900">
											{row.student?.section?.year_level || '-'}
										</div>
									)},
									{ key: 'section', label: 'Section', render: (_, row) => (
										<div className="font-medium text-gray-900">
											{row.student?.section?.name || '-'}
										</div>
									)},
									{ key: 'student', label: 'Student', render: (_, row) => (
										<div>
											<div className="font-medium">{row.student?.first_name} {row.student?.last_name}</div>
											<div className="text-sm text-gray-500">{row.student?.student_number}</div>
										</div>
									)},
									{ key: 'status', label: 'Status', render: (status) => (
										<span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(status)}`}>
											{status?.toUpperCase()}
										</span>
									)},
									{ key: 'schedule', label: 'Subject', render: (_, row) => (
										<div>
											<div className="font-medium">{row.schedule?.subject?.name || 'General'}</div>
											{row.schedule && (
												<div className="text-sm text-gray-500">
													{formatTime(row.schedule.time_start)} - {formatTime(row.schedule.time_end)}
												</div>
											)}
										</div>
									)},
									{ key: 'remarks', label: 'Remarks', render: (remarks) => remarks || '-' },
									{ key: 'created_at', label: 'Recorded', render: (created_at) => new Date(created_at).toLocaleString() },
								]}
								data={filteredRecords}
							/>

							<div className="mt-10 flex items-center justify-between border-t border-gray-200 pt-10">
								<p className="text-xl text-gray-700">Showing {filteredRecords.length} of {recentRecords?.length || 0} entries</p>
								<div className="flex gap-6">
									<button className="rounded-xl border border-gray-300 px-8 py-4 text-lg hover:bg-gray-50 transition-colors">Previous</button>
									<button className="rounded-xl border border-gray-300 px-8 py-4 text-lg hover:bg-gray-50 transition-colors">Next</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</AuthenticatedLayout>
	);
}