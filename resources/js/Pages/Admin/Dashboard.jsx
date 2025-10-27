import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import StatsCard from '@/Components/StatsCard';
import DataTable from '@/Components/DataTable';

export default function Dashboard() {
	const { chart, recentInterventions, recentAbsences, stats, atRiskStudents, recentRecords, todayStats, sections, totalStudentsCount, overallAttendanceRate, priorityStats } = usePage().props;
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
		<AuthenticatedLayout>
			<Head title="Dashboard" />
			<div className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-emerald-50/80 to-brand-secondary/5">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
					{/* Hero Section */}
					<div className="mb-16">
						<div className="text-center">
							<div className="mb-6">
								<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-brand-primary to-emerald-600 rounded-2xl shadow-lg">
									<svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
							</div>
							<h1 className="text-5xl font-bold text-gray-900 mb-6">
								Welcome to SmartAttend
							</h1>
							<p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
								Streamline attendance management with intelligent insights and automated reporting for 
								<span className="text-brand-primary font-semibold"> PHINMA University of Pangasinan</span>
							</p>
						</div>
					</div>

					{/* Key Metrics */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
						<div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-base font-semibold text-gray-600 mb-2">Today's Attendance</p>
									<p className="text-4xl font-bold text-gray-900 mb-2">{overallAttendanceRate || 0}%</p>
									<p className="text-sm text-gray-500">{todayStats?.present || 0} of {totalStudentsCount || 0} students</p>
								</div>
								<div className="h-16 w-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300">
									<svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-base font-semibold text-gray-600 mb-2">Absent Today</p>
									<p className="text-4xl font-bold text-red-600 mb-2">{todayStats?.absent || 0}</p>
									<p className="text-sm text-gray-500">Students absent</p>
								</div>
								<div className="h-16 w-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center group-hover:from-red-200 group-hover:to-red-300 transition-all duration-300">
									<svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-base font-semibold text-gray-600 mb-2">At-Risk Students</p>
									<p className="text-4xl font-bold text-orange-600 mb-2">{atRiskStudents?.length || 0}</p>
									<p className="text-sm text-gray-500">Need attention</p>
								</div>
								<div className="h-16 w-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center group-hover:from-orange-200 group-hover:to-orange-300 transition-all duration-300">
									<svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
									</svg>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-base font-semibold text-gray-600 mb-2">Total Students</p>
									<p className="text-4xl font-bold text-gray-900 mb-2">{totalStudentsCount || 0}</p>
									<p className="text-sm text-gray-500">Enrolled</p>
								</div>
								<div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
									<svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
									</svg>
								</div>
							</div>
						</div>
					</div>

					{/* Priority Statistics */}
					<div className="mb-16">
						<div className="text-center mb-10">
							<h2 className="text-3xl font-bold text-gray-900 mb-4">Student Priority Overview</h2>
							<p className="text-lg text-gray-600">Monitor student attendance priorities and intervention needs</p>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							<div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-base font-semibold text-gray-600 mb-2">Safe Students</p>
										<p className="text-4xl font-bold text-green-600 mb-2">{priorityStats?.safe_count || 0}</p>
										<p className="text-sm text-gray-500">Less than 4 absences</p>
									</div>
									<div className="h-16 w-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300">
										<svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
								</div>
							</div>

							<div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-base font-semibold text-gray-600 mb-2">Call Needed</p>
										<p className="text-4xl font-bold text-yellow-600 mb-2">{priorityStats?.call_needed_count || 0}</p>
										<p className="text-sm text-gray-500">4-7 absences</p>
									</div>
									<div className="h-16 w-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center group-hover:from-yellow-200 group-hover:to-yellow-300 transition-all duration-300">
										<svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
								</div>
							</div>

							<div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-base font-semibold text-gray-600 mb-2">PNS Required</p>
										<p className="text-4xl font-bold text-red-600 mb-2">{priorityStats?.pns_count || 0}</p>
										<p className="text-sm text-gray-500">8+ absences</p>
									</div>
									<div className="h-16 w-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center group-hover:from-red-200 group-hover:to-red-300 transition-all duration-300">
										<svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
										</svg>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Quick Actions */}
					<div className="mb-16">
						<div className="text-center mb-10">
							<h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Actions</h2>
							<p className="text-lg text-gray-600">Access frequently used features and tools</p>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<Link href={route('admin.attendance.section')} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-primary transition-all">
								<div className="flex items-center space-x-4">
									<div className="h-12 w-12 bg-brand-primary/10 rounded-xl flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-colors">
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
										</svg>
									</div>
									<div>
										<h3 className="font-semibold text-gray-900 group-hover:text-brand-primary transition-colors">Record Attendance</h3>
										<p className="text-sm text-gray-500">Take daily attendance</p>
									</div>
								</div>
							</Link>

							<Link href={route('admin.interventions')} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-primary transition-all">
								<div className="flex items-center space-x-4">
									<div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
										</svg>
									</div>
									<div>
										<h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">Interventions</h3>
										<p className="text-sm text-gray-500">Manage student support</p>
									</div>
								</div>
							</Link>

							<Link href={route('admin.reports')} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-primary transition-all">
								<div className="flex items-center space-x-4">
									<div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
									</div>
									<div>
										<h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Reports</h3>
										<p className="text-sm text-gray-500">View analytics</p>
									</div>
								</div>
							</Link>

							<Link href={route('admin.students')} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-primary transition-all">
								<div className="flex items-center space-x-4">
									<div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
										</svg>
									</div>
									<div>
										<h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">Students</h3>
										<p className="text-sm text-gray-500">Manage priorities</p>
									</div>
								</div>
							</Link>

							<Link href={route('admin.sections')} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-primary transition-all">
								<div className="flex items-center space-x-4">
									<div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
										</svg>
									</div>
									<div>
										<h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Sections</h3>
										<p className="text-sm text-gray-500">Manage classes</p>
									</div>
								</div>
							</Link>
						</div>
					</div>

					{/* Attendance Trend Chart */}
					<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-12">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-bold text-gray-900">Attendance Trend</h2>
							<div className="flex items-center space-x-2 text-sm text-gray-500">
								<div className="h-2 w-2 bg-brand-primary rounded-full"></div>
								<span>Last 8 weeks</span>
							</div>
						</div>
						<canvas ref={canvasRef} height="120"></canvas>
					</div>

					{/* Department Overview */}
					<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-12">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-bold text-gray-900">Department Overview</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
								<div className="flex items-center justify-between mb-4">
									<div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
										<svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
										</svg>
									</div>
									<span className="text-2xl font-bold text-blue-600">{sections?.length || 0}</span>
								</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">Active Sections</h3>
								<p className="text-sm text-gray-600">Classes across all departments</p>
							</div>
							<div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
								<div className="flex items-center justify-between mb-4">
									<div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
										<svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
										</svg>
									</div>
									<span className="text-2xl font-bold text-green-600">{totalStudentsCount || 0}</span>
								</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">Total Students</h3>
								<p className="text-sm text-gray-600">Enrolled across all sections</p>
							</div>
							<div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
								<div className="flex items-center justify-between mb-4">
									<div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
										<svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<span className="text-2xl font-bold text-purple-600">{overallAttendanceRate || 0}%</span>
								</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">Overall Attendance</h3>
								<p className="text-sm text-gray-600">Current attendance rate</p>
							</div>
						</div>
					</div>

					{/* Recent Activity */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
						<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
							<div className="flex items-center justify-between mb-6">
								<h3 className="text-xl font-bold text-gray-900">Recent Absences</h3>
								<Link href={route('admin.attendance.section')} className="text-sm font-medium text-brand-primary hover:text-brand-primary/80">
									View All
								</Link>
							</div>
							<div className="space-y-4">
								{recentAbsences?.length > 0 ? recentAbsences.slice(0, 5).map((r) => (
									<div key={r.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
										<div>
											<p className="font-medium text-gray-900">{r.student?.first_name} {r.student?.last_name}</p>
											<p className="text-sm text-gray-500">{r.student?.section?.name} • {new Date(r.date).toLocaleDateString()}</p>
										</div>
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
											Absent
										</span>
									</div>
								)) : (
									<div className="text-center py-8">
										<svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<p className="text-gray-500">No recent absences</p>
									</div>
								)}
							</div>
						</div>

						<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
							<div className="flex items-center justify-between mb-6">
								<h3 className="text-xl font-bold text-gray-900">At-Risk Students</h3>
								<Link href={route('admin.interventions')} className="text-sm font-medium text-brand-primary hover:text-brand-primary/80">
									Create Intervention
								</Link>
							</div>
							<div className="space-y-4">
								{atRiskStudents?.length > 0 ? atRiskStudents.slice(0, 5).map((student) => (
									<div key={student.student_id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
										<div>
											<p className="font-medium text-gray-900">{student.student?.first_name} {student.student?.last_name}</p>
											<p className="text-sm text-gray-500">{student.absence_count} absences in 2 weeks</p>
										</div>
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
											At Risk
										</span>
									</div>
								)) : (
									<div className="text-center py-8">
										<svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
										</svg>
										<p className="text-gray-500">No at-risk students</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* System Status & Quick Stats */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
						<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
							<div className="flex items-center mb-6">
								<div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
									<svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<h3 className="text-xl font-bold text-gray-900">Today's Attendance</h3>
							</div>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-gray-600">Present</span>
									<span className="font-semibold text-green-600">{todayStats?.present || 0}</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-gray-600">Late</span>
									<span className="font-semibold text-yellow-600">{todayStats?.late || 0}</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-gray-600">Absent</span>
									<span className="font-semibold text-red-600">{todayStats?.absent || 0}</span>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
							<div className="flex items-center mb-6">
								<div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
									<svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
									</svg>
								</div>
								<h3 className="text-xl font-bold text-gray-900">Student Overview</h3>
							</div>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-gray-600">Total Students</span>
									<span className="font-semibold text-gray-900">{totalStudentsCount || 0}</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-gray-600">Active Sections</span>
									<span className="font-semibold text-gray-900">{sections?.length || 0}</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-gray-600">At-Risk Students</span>
									<span className="font-semibold text-orange-600">{atRiskStudents?.length || 0}</span>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
							<div className="flex items-center mb-6">
								<div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
									<svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
									</svg>
								</div>
								<h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
							</div>
							<div className="space-y-3">
								<Link href={route('admin.attendance.section')} className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
									📝 Take Attendance
								</Link>
								<Link href={route('admin.reports')} className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
									📊 Generate Report
								</Link>
								<Link href={route('admin.sections')} className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
									👥 Manage Sections
								</Link>
								<Link href={route('admin.interventions')} className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
									⚠️ Create Intervention
								</Link>
							</div>
						</div>
					</div>

					{/* Recent Activity Feed */}
					<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-12">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
							<Link href={route('admin.attendance')} className="text-sm font-medium text-brand-primary hover:text-brand-primary/80">
								View All Activity
							</Link>
						</div>
						<div className="space-y-4">
							{recentRecords?.length > 0 ? recentRecords.slice(0, 5).map((record) => (
								<div key={record.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
									<div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
										<svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
										</svg>
									</div>
									<div className="flex-1">
										<p className="text-sm font-medium text-gray-900">
											Attendance recorded for {record.student?.first_name} {record.student?.last_name}
										</p>
										<p className="text-xs text-gray-500">
											{record.student?.section?.name} • {new Date(record.date).toLocaleDateString()}
										</p>
									</div>
									<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
										record.status === 'present' ? 'bg-green-100 text-green-800' :
										record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
										record.status === 'absent' ? 'bg-red-100 text-red-800' :
										'bg-blue-100 text-blue-800'
									}`}>
										{record.status?.charAt(0).toUpperCase() + record.status?.slice(1)}
									</span>
								</div>
							)) : (
								<div className="text-center py-8">
									<svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
									<p className="text-gray-500">No recent activity</p>
								</div>
							)}
						</div>
					</div>

					{/* Footer Info */}
					<div className="bg-gradient-to-r from-brand-primary/5 to-emerald-50 rounded-2xl p-8 border border-brand-primary/10">
						<div className="text-center">
							<div className="flex items-center justify-center mb-4">
								<div className="h-12 w-12 bg-brand-primary rounded-lg flex items-center justify-center mr-4">
									<svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
									</svg>
								</div>
								<h3 className="text-xl font-bold text-gray-900">SmartAttend System</h3>
							</div>
							<p className="text-gray-600 mb-4">
								Powered by advanced analytics and intelligent insights for PHINMA University of Pangasinan
							</p>
							<div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
								<span>Total Students: {totalStudentsCount || 0}</span>
								<span>•</span>
								<span>Active Sections: {sections?.length || 0}</span>
								<span>•</span>
								<span>Attendance Rate: {overallAttendanceRate || 0}%</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}