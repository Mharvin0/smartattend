import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function SystemAdmin() {
    const { users, systemStats, activityLogs, integrations, systemTools, auditLogs } = usePage().props;
    const flash = usePage().props.flash || {};
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedTool, setSelectedTool] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [systemLogs, setSystemLogs] = useState([]);
    const [showLogs, setShowLogs] = useState(false);
    const [notification, setNotification] = useState(null);

    // Real-time clock update
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Debug: Log available routes
    useEffect(() => {
        console.log('System Admin Page Loaded');
        console.log('Available routes:', {
            clearCache: route('super.system-admin.clear-cache'),
            optimize: route('super.system-admin.optimize'),
            backup: route('super.system-admin.backup'),
            maintenance: route('super.system-admin.maintenance'),
            logs: route('super.system-admin.logs'),
            test: route('super.system-admin.test')
        });
    }, []);

    // Auto-hide notification after 5 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
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
                    
                case 'logs':
                    console.log('Attempting to fetch system logs...');
                    try {
                        response = await fetch(route('super.system-admin.logs'));
                        data = await response.json();
                        
                        if (data.success) {
                            setSystemLogs(data.logs);
                            setShowLogs(true);
                            console.log('System logs fetched successfully');
                        } else {
                            setNotification({ type: 'error', message: 'Failed to fetch logs: ' + data.message });
                            console.error('Failed to fetch logs:', data.message);
                        }
                    } catch (fetchError) {
                        setNotification({ type: 'error', message: 'Failed to fetch logs: ' + fetchError.message });
                        console.error('Failed to fetch logs:', fetchError);
                    }
                    break;
                    
                default:
                    console.log('Unknown action:', action);
                    break;
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Tool action failed: ' + error.message });
            console.error('Tool action failed:', error);
        } finally {
            setIsLoading(false);
            setSelectedTool(null);
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-2xl font-bold leading-tight text-gray-800">System Administration</h2>}>
            <Head title="System Administration" />
            
            <div className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-emerald-50/80 to-brand-secondary/5 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

                    {/* Audit Logs Table */}
                    <section className="mb-12">
                        <div className="bg-white rounded-3xl shadow-lg p-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8">Audit Logs</h2>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Timestamp</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Event</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {auditLogs && auditLogs.length > 0 ? (
                                            auditLogs.map((log, index) => (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {log.user_name || log.user_email || 'System'}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {log.event_type.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                            {log.event_category.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            log.status === 'success' ? 'bg-green-100 text-green-800' :
                                                            log.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {log.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-800">
                                                        {log.description}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="py-8 text-center text-gray-500">
                                                    No audit logs available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {auditLogs && auditLogs.length > 0 && (
                                <div className="mt-4 text-sm text-gray-500 text-center">
                                    Showing {auditLogs.length} recent audit log entries
                                </div>
                            )}
                        </div>
                    </section>

                    {/* System Administration Tools */}
                    <section className="mb-12">
                        <div className="bg-white rounded-3xl shadow-lg p-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8">System Administration Tools</h2>
                            
                            <div className="mb-6">
                                <button 
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(route('super.system-admin.test'));
                                            const data = await response.json();
                                            setNotification({ type: 'success', message: data.message });
                                        } catch (error) {
                                            setNotification({ type: 'error', message: 'Test failed: ' + error.message });
                                        }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    🧪 Test Connection
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div 
                                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Clear cache clicked');
                                        handleToolAction('clear-cache', 'Cache Management');
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">Clear Cache</h3>
                                                <p className="text-sm text-gray-600">Clear system cache and optimize performance</p>
                                                <p className="text-xs text-gray-500 mt-1">Cache Size: {systemTools?.cache?.cache_size || 'Unknown'}</p>
                                            </div>
                                        </div>
                                        {isLoading && selectedTool === 'Cache Management' && (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                        )}
                                    </div>
                                </div>

                                <div 
                                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 hover:from-green-100 hover:to-green-200 transition-all duration-200 cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('System logs clicked');
                                        handleToolAction('logs', 'System Logs');
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center">
                                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
                                                <p className="text-sm text-gray-600">View and monitor system activity</p>
                                                <p className="text-xs text-gray-500 mt-1">Files: {systemTools?.logs?.log_files || 0} | Size: {systemTools?.logs?.total_size || 'Unknown'}</p>
                                            </div>
                                        </div>
                                        {isLoading && selectedTool === 'System Logs' && (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                                        )}
                                    </div>
                                </div>

                                <div 
                                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('System optimization clicked');
                                        handleToolAction('optimize', 'System Optimization');
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center">
                                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">Optimize System</h3>
                                                <p className="text-sm text-gray-600">Optimize system performance</p>
                                            </div>
                                        </div>
                                        {isLoading && selectedTool === 'System Optimization' && (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                                        )}
                                    </div>
                                </div>

                                <div 
                                    className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Backup system clicked');
                                        handleToolAction('backup', 'Backup System');
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-12 w-12 bg-orange-500 rounded-xl flex items-center justify-center">
                                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">Create Backup</h3>
                                                <p className="text-sm text-gray-600">Create system backup</p>
                                                <p className="text-xs text-gray-500 mt-1">Last: {systemTools?.backup?.last_backup || 'Never'}</p>
                                            </div>
                                        </div>
                                        {isLoading && selectedTool === 'Backup System' && (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                                        )}
                                    </div>
                                </div>

                                <div 
                                    className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 hover:from-red-100 hover:to-red-200 transition-all duration-200 cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('System maintenance clicked');
                                        handleToolAction('maintenance', 'System Maintenance');
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-12 w-12 bg-red-500 rounded-xl flex items-center justify-center">
                                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">System Maintenance</h3>
                                                <p className="text-sm text-gray-600">Run system maintenance tasks</p>
                                                <p className="text-xs text-gray-500 mt-1">Last: {systemTools?.maintenance?.last_maintenance || 'Never'}</p>
                                            </div>
                                        </div>
                                        {isLoading && selectedTool === 'System Maintenance' && (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">Performance Monitor</h3>
                                            <p className="text-sm text-gray-600">System performance metrics</p>
                                            <p className="text-xs text-gray-500 mt-1">Memory: {systemStats?.memoryUsage?.current || 'Unknown'} ({systemStats?.memoryUsage?.percentage || 0}%)</p>
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

                    {/* System Logs Modal */}
                    {showLogs && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="w-full max-w-6xl max-h-[80vh] rounded-lg bg-white shadow-xl">
                                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-900">System Activity Log</h3>
                                    <button
                                        onClick={() => setShowLogs(false)}
                                        className="text-gray-400 hover:text-gray-600 text-xl"
                                    >
                                        ✕
                                    </button>
                                </div>
                                
                                <div className="p-6">
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            <strong>Recent System Activity</strong> - Showing user-relevant system events
                                        </p>
                                    </div>
                                    
                                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                                        {systemLogs && systemLogs.length > 0 ? (
                                            systemLogs.map((log, index) => (
                                                <div key={index} className={`mb-3 p-3 rounded-lg border-l-4 ${
                                                    log.level === 'ERROR' ? 'bg-red-50 border-red-400' :
                                                    log.level === 'WARNING' ? 'bg-yellow-50 border-yellow-400' :
                                                    log.level === 'INFO' ? 'bg-blue-50 border-blue-400' :
                                                    'bg-gray-50 border-gray-400'
                                                }`}>
                                                    <div className="flex items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <span className={`text-sm font-medium ${log.color}`}>
                                                                    {log.level}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {log.timestamp}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-800">
                                                                {log.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <p>No system logs available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex justify-end p-6 border-t border-gray-200">
                                    <button
                                        onClick={() => setShowLogs(false)}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}