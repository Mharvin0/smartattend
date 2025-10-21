import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function SystemAdmin() {
    const { users, systemStats, activityLogs, integrations } = usePage().props;
    const [currentTime, setCurrentTime] = useState(new Date());

    // Real-time clock update
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <AuthenticatedLayout header={<h2 className="text-2xl font-bold leading-tight text-gray-800">System Administration</h2>}>
            <Head title="System Administration" />
            
            <div className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-emerald-50/80 to-brand-secondary/5 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* System Overview */}
                    <section className="mb-12">
                        <div className="bg-white rounded-3xl shadow-lg p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-bold text-gray-900">System Overview</h2>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2 text-green-600">
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-medium">Live</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Last updated: {currentTime.toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-600">Total Users</p>
                                            <p className="text-2xl font-bold text-blue-900">{users?.length || 0}</p>
                                            <p className="text-xs text-blue-600">Active Users</p>
                                        </div>
                                        <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-green-600">System Health</p>
                                            <p className="text-2xl font-bold text-green-900">{systemStats?.systemHealth || 0}%</p>
                                            <p className="text-xs text-green-600">Uptime</p>
                                        </div>
                                        <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-purple-600">Database Size</p>
                                            <p className="text-2xl font-bold text-purple-900">{systemStats?.databaseSize || 'Unknown'}</p>
                                            <p className="text-xs text-purple-600">Storage Used</p>
                                        </div>
                                        <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-orange-600">Active Sessions</p>
                                            <p className="text-2xl font-bold text-orange-900">{systemStats?.activeSessions || 0}</p>
                                            <p className="text-xs text-orange-600">Current</p>
                                        </div>
                                        <div className="h-12 w-12 bg-orange-500 rounded-xl flex items-center justify-center">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* System Administration Tools */}
                    <section className="mb-12">
                        <div className="bg-white rounded-3xl shadow-lg p-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8">System Administration Tools</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 cursor-pointer">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                                            <p className="text-sm text-gray-600">Manage system users and permissions</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 hover:from-green-100 hover:to-green-200 transition-all duration-200 cursor-pointer">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
                                            <p className="text-sm text-gray-600">View and monitor system activity</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 cursor-pointer">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">Integrations</h3>
                                            <p className="text-sm text-gray-600">Manage external system connections</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 cursor-pointer">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 bg-orange-500 rounded-xl flex items-center justify-center">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">Backup & Restore</h3>
                                            <p className="text-sm text-gray-600">Data backup and recovery tools</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 hover:from-red-100 hover:to-red-200 transition-all duration-200 cursor-pointer">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 bg-red-500 rounded-xl flex items-center justify-center">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">Performance Monitor</h3>
                                            <p className="text-sm text-gray-600">System performance metrics</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 hover:from-indigo-100 hover:to-indigo-200 transition-all duration-200 cursor-pointer">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">Security Audit</h3>
                                            <p className="text-sm text-gray-600">Security logs and access control</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Recent Activity */}
                    <section>
                        <div className="bg-white rounded-3xl shadow-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-8">Recent System Activity</h2>
                            <div className="space-y-6">
                                {activityLogs?.slice(0, 5).map((log, index) => (
                                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                        <div className={`w-3 h-3 rounded-full ${
                                            log.type === 'error' ? 'bg-red-500' :
                                            log.type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{log.message}</p>
                                            <p className="text-xs text-gray-500">{log.timestamp} - {log.user}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            log.type === 'error' ? 'bg-red-100 text-red-800' :
                                            log.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {log.type}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}