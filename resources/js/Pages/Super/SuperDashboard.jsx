import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function SuperDashboard({ auth, users, systemStats, activityLogs, integrations, systemTools, auditLogs }) {
    const { flash } = usePage().props;
    const [currentTime, setCurrentTime] = useState(new Date());
    const [notification, setNotification] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTool, setSelectedTool] = useState(null);
    const [showLogs, setShowLogs] = useState(false);
    const [systemLogs, setSystemLogs] = useState([]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (notification) {
            const timeout = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timeout);
        }
    }, [notification]);

    const handleToolAction = async (action, toolName) => {
        console.log('Tool action triggered:', action, toolName);
        setIsLoading(true);
        setSelectedTool(toolName);
        
        try {
            let response;
            let data;
            
            switch (action) {
                case 'clear-cache':
                    console.log('Attempting to clear cache...');
                    response = await fetch(route('super.system-admin.clear-cache'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    data = await response.json();
                    
                    if (data.success) {
                        setNotification({ type: 'success', message: data.message });
                        console.log('Cache cleared successfully:', data);
                    } else {
                        setNotification({ type: 'error', message: data.message });
                        console.error('Cache clear failed:', data.message);
                    }
                    break;
                    
                case 'optimize':
                    console.log('Attempting to optimize system...');
                    response = await fetch(route('super.system-admin.optimize'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    data = await response.json();
                    
                    if (data.success) {
                        setNotification({ type: 'success', message: data.message });
                        console.log('System optimized successfully:', data);
                    } else {
                        setNotification({ type: 'error', message: data.message });
                        console.error('System optimization failed:', data.message);
                    }
                    break;
                    
                case 'backup':
                    console.log('Attempting to create backup...');
                    response = await fetch(route('super.system-admin.backup'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    data = await response.json();
                    
                    if (data.success) {
                        setNotification({ type: 'success', message: `${data.message} - File: ${data.filename} (${data.size})` });
                        console.log('Backup created successfully:', data);
                    } else {
                        setNotification({ type: 'error', message: data.message });
                        console.error('Backup creation failed:', data.message);
                    }
                    break;
                    
                case 'maintenance':
                    console.log('Attempting to run maintenance...');
                    response = await fetch(route('super.system-admin.maintenance'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    data = await response.json();
                    
                    if (data.success) {
                        setNotification({ type: 'success', message: data.message });
                        console.log('Maintenance completed successfully:', data);
                    } else {
                        setNotification({ type: 'error', message: data.message });
                        console.error('Maintenance failed:', data.message);
                    }
                    break;
                    
                case 'audit-logs':
                    console.log('Attempting to get system logs...');
                    response = await fetch(route('super.system-admin.logs'), {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    data = await response.json();
                    
                    if (data.success) {
                        setSystemLogs(data.logs || []);
                        setShowLogs(true);
                        console.log('System logs retrieved successfully:', data);
                    } else {
                        setNotification({ type: 'error', message: data.message });
                        console.error('Failed to get system logs:', data.message);
                    }
                    break;
                    
                default:
                    console.log('Unknown action:', action);
                    setNotification({ type: 'error', message: 'Unknown action requested' });
            }
        } catch (error) {
            console.error('Error executing tool action:', error);
            setNotification({ type: 'error', message: 'An error occurred while executing the action' });
        } finally {
            setIsLoading(false);
            setSelectedTool(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'text-green-600 bg-green-100';
            case 'warning': return 'text-yellow-600 bg-yellow-100';
            case 'error': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return 'ℹ️';
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="System Admin Control Center" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-zinc-50/70 py-8">
                <div className="w-full px-6 py-8 space-y-6">
                    {flash.success && (
                        <div className="pointer-events-none fixed right-6 top-6 z-50 rounded bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">{flash.success}</div>
                    )}
                    {flash.error && (
                        <div className="pointer-events-none fixed right-6 top-6 z-50 rounded bg-red-600 px-4 py-2 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">{flash.error}</div>
                    )}
                    
                    {/* Custom Notification */}
                    {notification && (
                        <div className={`fixed right-6 top-20 z-50 rounded-lg px-6 py-4 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards] ${
                            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                            <div className="flex items-center space-x-2">
                                <span>{notification.type === 'success' ? '✅' : '❌'}</span>
                                <span>{notification.message}</span>
                                <button 
                                    onClick={() => setNotification(null)}
                                    className="ml-2 text-white hover:text-gray-200"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
                                        System Admin Control Center
                                    </h1>
                                    <p className="text-gray-600 mt-2 text-lg">
                                        Comprehensive system management and monitoring dashboard
                                    </p>
                                    <div className="flex items-center mt-4 space-x-6 text-sm text-gray-500">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            <span>System Online</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>{currentTime.toLocaleTimeString()}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span>Welcome, {auth.user.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-900">{systemStats?.totalUsers || 0}</div>
                                    <div className="text-sm text-gray-500">Total Users</div>
                                    <div className="text-2xl font-bold text-gray-900 mt-2">{systemStats?.totalStudents || 0}</div>
                                    <div className="text-sm text-gray-500">Total Students</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">System Health</p>
                                    <p className="text-3xl font-bold text-green-600">{systemStats?.systemHealth || 0}%</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                                    <p className="text-3xl font-bold text-blue-600">{systemStats?.activeSessions || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Database Size</p>
                                    <p className="text-3xl font-bold text-purple-600">{systemStats?.databaseSize || '0MB'}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                                    <p className="text-3xl font-bold text-orange-600">{systemStats?.memoryUsage?.percentage || 0}%</p>
                                </div>
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8 border border-white/20">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick System Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <button
                                onClick={() => handleToolAction('clear-cache', 'cache')}
                                disabled={isLoading && selectedTool === 'cache'}
                                className="flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading && selectedTool === 'cache' ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                )}
                                <span className="font-medium">Clear Cache</span>
                            </button>

                            <button
                                onClick={() => handleToolAction('optimize', 'optimize')}
                                disabled={isLoading && selectedTool === 'optimize'}
                                className="flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading && selectedTool === 'optimize' ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                )}
                                <span className="font-medium">Optimize System</span>
                            </button>

                            <button
                                onClick={() => handleToolAction('backup', 'backup')}
                                disabled={isLoading && selectedTool === 'backup'}
                                className="flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 hover:from-purple-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading && selectedTool === 'backup' ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                    </svg>
                                )}
                                <span className="font-medium">Create Backup</span>
                            </button>

                            <button
                                onClick={() => handleToolAction('maintenance', 'maintenance')}
                                disabled={isLoading && selectedTool === 'maintenance'}
                                className="flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading && selectedTool === 'maintenance' ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                                <span className="font-medium">Run Maintenance</span>
                            </button>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20 mb-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                            {activityLogs && activityLogs.length > 0 ? (
                                activityLogs.map((log, index) => (
                                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">{log.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">{log.user} • {log.timestamp}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                    <p className="text-gray-500">No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Audit Logs */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Audit Logs</h3>
                            <button
                                onClick={() => handleToolAction('audit-logs', 'logs')}
                                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <span>View System Logs</span>
                            </button>
                        </div>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {auditLogs && auditLogs.length > 0 ? (
                                auditLogs.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-3 h-3 rounded-full ${
                                                log.action_type === 'LOGIN' ? 'bg-green-500' :
                                                log.action_type === 'LOGOUT' ? 'bg-red-500' :
                                                log.action_type === 'CACHE_CLEAR' ? 'bg-blue-500' :
                                                log.action_type === 'SYSTEM_MAINTENANCE' ? 'bg-orange-500' :
                                                'bg-gray-500'
                                            }`}></div>
                                            <div>
                                                <p className="font-medium text-gray-900">{log.description}</p>
                                                <p className="text-sm text-gray-500">{log.user?.name || 'System'} • {new Date(log.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            log.status === 'success' ? 'bg-green-100 text-green-800' :
                                            log.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {log.status === 'success' ? 'Success' :
                                             log.status === 'warning' ? 'Warning' :
                                             'Failed'}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                    <p className="text-gray-500">No audit logs available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* System Logs Modal */}
                    {showLogs && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="w-full max-w-4xl max-h-[80vh] rounded-lg bg-white shadow-xl">
                                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-900">System Activity Log</h3>
                                    <button
                                        onClick={() => setShowLogs(false)}
                                        className="text-gray-400 hover:text-gray-600 text-xl"
                                    >
                                        ✕
                                    </button>
                                </div>
                                
                                <div className="p-6 max-h-[60vh] overflow-y-auto">
                                    {systemLogs.length > 0 ? (
                                        <div className="space-y-4">
                                            {systemLogs.map((log, index) => (
                                                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                                                    log.level === 'ERROR' ? 'bg-red-50 border-red-500' :
                                                    log.level === 'WARNING' ? 'bg-yellow-50 border-yellow-500' :
                                                    'bg-green-50 border-green-500'
                                                }`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                                                                log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                                                                log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                                {log.level === 'ERROR' ? '⚠️ Issue Detected' : 
                                                                 log.level === 'WARNING' ? '⚠️ Warning' : 
                                                                 '✅ System Update'}
                                                            </span>
                                                            <span className="text-sm text-gray-500">{log.timestamp}</span>
                                                        </div>
                                                    </div>
                                                    <p className={`text-sm ${
                                                        log.level === 'ERROR' ? 'text-red-700' :
                                                        log.level === 'WARNING' ? 'text-yellow-700' :
                                                        'text-green-700'
                                                    }`}>
                                                        {log.message}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                            </svg>
                                            <p className="text-gray-500">No system activity recorded</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
