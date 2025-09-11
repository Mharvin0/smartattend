import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import { useState } from 'react';

export default function Attendance({ recentRecords, todayStats, sections, weeklyTrends }) {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedSection, setSelectedSection] = useState('');
	const [selectedStatus, setSelectedStatus] = useState('');

	// Filter records based on search and filters
	const filteredRecords = recentRecords.filter(record => {
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
	});

	const handleSearch = () => {
		// Trigger search - could be debounced in real implementation
	};

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
	return (
		<AuthenticatedLayout header={<h2 className="text-2xl font-bold leading-tight text-gray-800">Attendance</h2>}>
			<Head title="Attendance" />
			<div className="min-h-screen py-8">
				<div className="mx-auto max-w-full space-y-10 px-4 sm:px-6 lg:px-8 xl:px-12">
					{/* Welcome Section */}
					<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-10 text-white">
						<div className="absolute inset-0 bg-black/10"></div>
						<div className="relative">
							<div className="flex items-center justify-between">
						<div>
									<h1 className="text-4xl font-bold mb-4">Attendance Management</h1>
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
									<p className="text-4xl font-semibold text-gray-900">-</p>
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
									<p className="text-4xl font-semibold text-gray-900">-</p>
								</div>
							</div>
						</div>
					</div>

					{/* Quick Actions Section */}
					<div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-3xl p-10 border border-gray-200">
						<div className="text-center mb-8">
							<h3 className="text-3xl font-bold text-gray-900 mb-4">Quick Actions</h3>
							<p className="text-xl text-gray-700">Record daily attendance by section or schedule, or import from CSV.</p>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
							<Link href={route('admin.attendance.section')} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300 group">
								<div className="flex flex-col items-center text-center">
									<div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
										<svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
									</div>
									<h4 className="text-xl font-bold text-gray-900 mb-2">By Section</h4>
									<p className="text-gray-600">Record attendance for entire sections</p>
								</div>
							</Link>
							<Link href={route('admin.attendance.schedule')} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-300 group">
								<div className="flex flex-col items-center text-center">
									<div className="h-16 w-16 rounded-lg bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
										<svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
									</div>
									<h4 className="text-xl font-bold text-gray-900 mb-2">By Schedule</h4>
									<p className="text-gray-600">Record attendance for specific subjects</p>
								</div>
							</Link>
							<Link href={route('admin.attendance.import')} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-300 group">
								<div className="flex flex-col items-center text-center">
									<div className="h-16 w-16 rounded-lg bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
										<svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
								</svg>
									</div>
									<h4 className="text-xl font-bold text-gray-900 mb-2">Import CSV</h4>
									<p className="text-gray-600">Bulk import attendance records</p>
								</div>
							</Link>
							<Link href={route('admin.reports')} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-orange-300 group">
								<div className="flex flex-col items-center text-center">
									<div className="h-16 w-16 rounded-lg bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
										<svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
										</svg>
									</div>
									<h4 className="text-xl font-bold text-gray-900 mb-2">Reports</h4>
									<p className="text-gray-600">Generate attendance reports</p>
								</div>
							</Link>
							<Link href={route('admin.schedules')} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-teal-300 group">
								<div className="flex flex-col items-center text-center">
									<div className="h-16 w-16 rounded-lg bg-teal-100 flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
										<svg className="h-8 w-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
										</svg>
									</div>
									<h4 className="text-xl font-bold text-gray-900 mb-2">Schedules</h4>
									<p className="text-gray-600">Manage class schedules</p>
								</div>
							</Link>
						</div>
					</div>

					{/* Recent Records Section */}
					<div className="card p-10">
						<div className="mb-10 flex items-center justify-between">
							<div>
								<h3 className="text-3xl font-bold text-gray-900">Recent Records</h3>
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
									{sections.map(section => (
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
							<p className="text-xl text-gray-700">Showing {filteredRecords.length} of {recentRecords.length} entries</p>
							<div className="flex gap-6">
								<button className="rounded-xl border border-gray-300 px-8 py-4 text-lg hover:bg-gray-50 transition-colors">Previous</button>
								<button className="rounded-xl border border-gray-300 px-8 py-4 text-lg hover:bg-gray-50 transition-colors">Next</button>
							</div>
						</div>
					</div>

					{/* Weekly Trends Section */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
						<div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-200">
							<div className="flex items-center gap-4 mb-8">
								<div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
									<svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
									</svg>
								</div>
								<div>
									<h3 className="text-2xl font-bold text-gray-900">Weekly Trends</h3>
									<p className="text-gray-600">Attendance patterns over the last 7 days</p>
								</div>
							</div>
							<div className="flex items-center justify-center h-64 text-gray-500">
								<div className="text-center">
									<svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
									</svg>
									<p className="text-lg">Content coming soon...</p>
								</div>
							</div>
					</div>

						<div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-200">
							<div className="flex items-center gap-4 mb-8">
								<div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
									<svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
									</svg>
								</div>
								<div>
									<h3 className="text-2xl font-bold text-gray-900">Department Overview</h3>
									<p className="text-gray-600">Attendance by department and program</p>
								</div>
							</div>
							<div className="flex items-center justify-center h-64 text-gray-500">
								<div className="text-center">
									<svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
									</svg>
									<p className="text-lg">Content coming soon...</p>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-200">
							<div className="flex items-center gap-4 mb-8">
								<div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
									<svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
									</svg>
								</div>
								<div>
									<h3 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h3>
									<p className="text-gray-600">Important attendance alerts</p>
								</div>
							</div>
							<div className="flex items-center justify-center h-64 text-gray-500">
								<div className="text-center">
									<svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
									</svg>
									<p className="text-lg">Content coming soon...</p>
								</div>
							</div>
						</div>
					</div>

					{/* Footer Section */}
					<div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-3xl p-10 border border-gray-200">
						<div className="flex items-center justify-center h-64 text-gray-500">
							<div className="text-center">
								<svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<p className="text-lg">Content coming soon...</p>
							</div>
						</div>
					</div>

				</div>
			</div>
		</AuthenticatedLayout>
	);
}