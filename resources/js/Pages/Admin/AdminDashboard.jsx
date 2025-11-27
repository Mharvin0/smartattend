import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
    const { stats, recentRecords, recentInterventions, sections, subjects } = usePage().props;
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const renderOverview = () => (
        <>
            {/* Hero Section */}
            <div className="mb-8">
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Admin Control Center</h1>
                            <p className="text-emerald-100 text-lg">Comprehensive attendance management and analytics</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-emerald-200">Live Dashboard</div>
                            <div className="text-xl font-semibold">{currentTime.toLocaleTimeString()}</div>
                            <div className="flex items-center space-x-2 mt-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-sm text-green-200">System Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-emerald-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Students</p>
                            <p className="text-3xl font-bold text-gray-900">{stats?.presentToday?.total || 0}</p>
                            <p className="text-xs text-emerald-600 mt-1">Active Enrollments</p>
                        </div>
                        <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Present Today</p>
                            <p className="text-3xl font-bold text-gray-900">{stats?.presentToday?.count || 0}</p>
                            <p className="text-xs text-blue-600 mt-1">Current Attendance</p>
                        </div>
                        <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Absent Today</p>
                            <p className="text-3xl font-bold text-gray-900">{stats?.absentToday?.count || 0}</p>
                            <p className="text-xs text-red-600 mt-1">Requires Attention</p>
                        </div>
                        <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Sections</p>
                            <p className="text-3xl font-bold text-gray-900">{sections?.length || 0}</p>
                            <p className="text-xs text-purple-600 mt-1">Classes Managed</p>
                        </div>
                        <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Attendance Trends */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Attendance Trends</h3>
                        <div className="flex space-x-2">
                            <button className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-sm font-medium">Today</button>
                            <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">Week</button>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Present Rate</p>
                                    <p className="text-xs text-gray-500">Current session</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                    {stats?.presentToday?.total > 0 ? Math.round((stats?.presentToday?.count / stats?.presentToday?.total) * 100) : 0}%
                                </p>
                                <p className="text-xs text-emerald-600">+5% from yesterday</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Absence Rate</p>
                                    <p className="text-xs text-gray-500">Current session</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                    {stats?.presentToday?.total > 0 ? Math.round((stats?.absentToday?.count / stats?.presentToday?.total) * 100) : 0}%
                                </p>
                                <p className="text-xs text-red-600">-2% from yesterday</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Late Arrivals</p>
                                    <p className="text-xs text-gray-500">Current session</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">{stats?.lateToday?.count || 0}</p>
                                <p className="text-xs text-yellow-600">+1 from yesterday</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl hover:from-emerald-100 hover:to-emerald-200 transition-all duration-200 border border-emerald-200">
                            <div className="flex flex-col items-center space-y-2">
                                <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-gray-900">Record Attendance</span>
                            </div>
                        </button>

                        <button className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200">
                            <div className="flex flex-col items-center space-y-2">
                                <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center">
                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-gray-900">Create Intervention</span>
                            </div>
                        </button>

                        <button className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-200 border border-purple-200">
                            <div className="flex flex-col items-center space-y-2">
                                <div className="h-10 w-10 bg-purple-500 rounded-xl flex items-center justify-center">
                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-gray-900">Generate Reports</span>
                            </div>
                        </button>

                        <button className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all duration-200 border border-orange-200">
                            <div className="flex flex-col items-center space-y-2">
                                <div className="h-10 w-10 bg-orange-500 rounded-xl flex items-center justify-center">
                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-gray-900">Export Data</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
                    <div className="flex items-center space-x-2">
                        <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                            View All
                        </button>
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            Filter
                        </button>
                    </div>
                </div>
                
                <div className="space-y-4">
                    {recentRecords?.slice(0, 5).map((record, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className={`w-3 h-3 rounded-full ${
                                record.status === 'present' ? 'bg-emerald-500' :
                                record.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {record.student_name} - {record.section_name}
                                </p>
                                <p className="text-xs text-gray-500">{record.timestamp}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                record.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                                record.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {record.status}
                            </span>
                        </div>
                    ))}
                </div>
                
                {(!recentRecords || recentRecords.length === 0) && (
                    <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">No recent activity</p>
                    </div>
                )}
            </div>
        </>
    );

    const renderAnalytics = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h2>
                <p className="text-gray-600 mb-6">Comprehensive attendance analytics and insights.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Overview</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Total Students</span>
                                <span className="text-sm font-semibold">{stats?.presentToday?.total || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Present Today</span>
                                <span className="text-sm font-semibold text-emerald-600">{stats?.presentToday?.count || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Absent Today</span>
                                <span className="text-sm font-semibold text-red-600">{stats?.absentToday?.count || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Breakdown</h3>
                        <div className="space-y-3">
                            {sections?.slice(0, 3).map((section, index) => (
                                <div key={index} className="flex justify-between">
                                    <span className="text-sm text-gray-600">{section.name}</span>
                                    <span className="text-sm font-semibold">{section.students_count || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Interventions</h3>
                        <div className="space-y-3">
                            {recentInterventions?.slice(0, 3).map((intervention, index) => (
                                <div key={index} className="flex justify-between">
                                    <span className="text-sm text-gray-600">{intervention.student_name}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                        intervention.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                        intervention.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {intervention.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Admin Dashboard" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-zinc-50/70 py-8">
                <div className="w-full px-6 py-8 space-y-6">
                    {/* Header */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
                                    Admin Dashboard
                                </h2>
                                <p className="text-gray-600 mt-2 text-lg">
                                    Overview and analytics for attendance management
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Navigation Tabs */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-2 border border-white/20">
                            <nav className="flex space-x-1">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                                        activeTab === 'overview'
                                            ? 'bg-emerald-500 text-white shadow-lg'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab('analytics')}
                                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                                        activeTab === 'analytics'
                                            ? 'bg-emerald-500 text-white shadow-lg'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    Analytics
                                </button>
                            </nav>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'analytics' && renderAnalytics()}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
