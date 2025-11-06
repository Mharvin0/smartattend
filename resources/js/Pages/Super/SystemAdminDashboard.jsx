import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function SystemAdminDashboard({ auth, users, systemStats, activityLogs, integrations, systemTools, auditLogs }) {
    const { flash } = usePage().props;
    const [currentTime, setCurrentTime] = useState(new Date());
    const [notification, setNotification] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTool, setSelectedTool] = useState(null);
    const [showLogs, setShowLogs] = useState(false);
    const [systemLogs, setSystemLogs] = useState([]);
    const [activeChart, setActiveChart] = useState('performance');
    const [timeRange, setTimeRange] = useState('7d');

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
                    } else {
                        setNotification({ type: 'error', message: data.message });
                    }
                    break;
                    
                case 'optimize':
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
                    } else {
                        setNotification({ type: 'error', message: data.message });
                    }
                    break;
                    
                case 'backup':
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
                    } else {
                        setNotification({ type: 'error', message: data.message });
                    }
                    break;
                    
                case 'maintenance':
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
                    } else {
                        setNotification({ type: 'error', message: data.message });
                    }
                    break;
                    
                case 'audit-logs':
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
                    } else {
                        setNotification({ type: 'error', message: data.message });
                    }
                    break;
                    
                default:
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

    const analyticsData = {
        performance: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            data: [85, 92, 78, 96, 88, 94, 90],
            color: 'blue'
        },
        usage: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
            data: [120, 80, 200, 350, 280, 150],
            color: 'green'
        },
        errors: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            data: [5, 3, 8, 2, 4, 1, 6],
            color: 'red'
        },
        storage: {
            labels: ['Database', 'Files', 'Logs', 'Cache', 'Backups'],
            data: [45, 25, 15, 10, 5],
            color: 'purple'
        }
    };

    const renderChart = (type) => {
        const chartData = analyticsData[type];
        const maxValue = Math.max(...chartData.data);
        
        return (
            <div className="h-64 flex items-end justify-between space-x-2">
                {chartData.data.map((value, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                            className={`w-full bg-gradient-to-t from-${chartData.color}-500 to-${chartData.color}-400 rounded-t-lg transition-all duration-500 hover:from-${chartData.color}-600 hover:to-${chartData.color}-500`}
                            style={{ height: `${(value / maxValue) * 200}px` }}
                            title={`${chartData.labels[index]}: ${value}`}
                        ></div>
                        <span className="text-xs text-gray-600 mt-2">{chartData.labels[index]}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">System Administration</h2>}
        >
            <Head title="System Administration" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-zinc-50/70 py-8">
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

                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
                                        System Administration Dashboard
                                    </h1>
                                    <p className="text-gray-600 mt-2 text-lg">
                                        Advanced system monitoring, analytics, and administrative tools
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
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <span>System Admin Mode</span>
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

                    {/* Analytics Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Performance Analytics */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">System Performance</h3>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setActiveChart('performance')}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                            activeChart === 'performance' 
                                                ? 'bg-blue-100 text-blue-700' 
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        Performance
                                    </button>
                                    <button
                                        onClick={() => setActiveChart('usage')}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                            activeChart === 'usage' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        Usage
                                    </button>
                                    <button
                                        onClick={() => setActiveChart('errors')}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                            activeChart === 'errors' 
                                                ? 'bg-red-100 text-red-700' 
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        Errors
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                {renderChart(activeChart)}
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-lg font-bold text-gray-900">92%</div>
                                    <div className="text-xs text-gray-500">Avg Performance</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-lg font-bold text-gray-900">1.2s</div>
                                    <div className="text-xs text-gray-500">Response Time</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-lg font-bold text-gray-900">99.9%</div>
                                    <div className="text-xs text-gray-500">Uptime</div>
                                </div>
                            </div>
                        </div>

                        {/* Storage Analytics */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Storage Distribution</h3>
                            
                            <div className="mb-6">
                                {renderChart('storage')}
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                        <span className="text-sm font-medium">Database</span>
                                    </div>
                                    <span className="text-sm text-gray-600">45% (2.3GB)</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm font-medium">Files</span>
                                    </div>
                                    <span className="text-sm text-gray-600">25% (1.3GB)</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-medium">Logs</span>
                                    </div>
                                    <span className="text-sm text-gray-600">15% (0.8GB)</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <span className="text-sm font-medium">Cache</span>
                                    </div>
                                    <span className="text-sm text-gray-600">10% (0.5GB)</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <span className="text-sm font-medium">Backups</span>
                                    </div>
                                    <span className="text-sm text-gray-600">5% (0.3GB)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Health & Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* System Health */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">System Health</h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <div>
                                            <p className="font-medium text-gray-900">Database</p>
                                            <p className="text-sm text-gray-500">Connected</p>
                                        </div>
                                    </div>
                                    <span className="text-green-600 font-medium">Healthy</span>
                                </div>
                                
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <div>
                                            <p className="font-medium text-gray-900">Storage</p>
                                            <p className="text-sm text-gray-500">5.2GB / 50GB</p>
                                        </div>
                                    </div>
                                    <span className="text-green-600 font-medium">Good</span>
                                </div>
                                
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <div>
                                            <p className="font-medium text-gray-900">Memory</p>
                                            <p className="text-sm text-gray-500">78% Used</p>
                                        </div>
                                    </div>
                                    <span className="text-yellow-600 font-medium">Warning</span>
                                </div>
                                
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <div>
                                            <p className="font-medium text-gray-900">CPU</p>
                                            <p className="text-sm text-gray-500">45% Usage</p>
                                        </div>
                                    </div>
                                    <span className="text-green-600 font-medium">Normal</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => handleToolAction('clear-cache', 'cache')}
                                    disabled={isLoading && selectedTool === 'cache'}
                                    className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 hover:from-purple-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

                        {/* System Metrics */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">System Metrics</h3>
                            
                            <div className="space-y-4">
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <div className="text-2xl font-bold text-blue-600">{systemStats?.activeSessions || 0}</div>
                                    <div className="text-sm text-gray-500">Active Sessions</div>
                                </div>
                                
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <div className="text-2xl font-bold text-green-600">{systemStats?.systemHealth || 0}%</div>
                                    <div className="text-sm text-gray-500">System Health</div>
                                </div>
                                
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <div className="text-2xl font-bold text-purple-600">{systemStats?.databaseSize || '0MB'}</div>
                                    <div className="text-sm text-gray-500">Database Size</div>
                                </div>
                                
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <div className="text-2xl font-bold text-orange-600">{systemStats?.memoryUsage?.percentage || 0}%</div>
                                    <div className="text-sm text-gray-500">Memory Usage</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Features Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Security Monitoring */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Security Monitoring</h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <div>
                                            <p className="font-medium text-gray-900">Failed Login Attempts</p>
                                            <p className="text-sm text-gray-500">Last 24 hours</p>
                                        </div>
                                    </div>
                                    <span className="text-red-600 font-bold">3</span>
                                </div>
                                
                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <div>
                                            <p className="font-medium text-gray-900">SSL Certificate</p>
                                            <p className="text-sm text-gray-500">Valid until Dec 2024</p>
                                        </div>
                                    </div>
                                    <span className="text-green-600 font-bold">Valid</span>
                                </div>
                                
                                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <div>
                                            <p className="font-medium text-gray-900">Password Policy</p>
                                            <p className="text-sm text-gray-500">Needs review</p>
                                        </div>
                                    </div>
                                    <span className="text-yellow-600 font-bold">Review</span>
                                </div>
                                
                                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        <div>
                                            <p className="font-medium text-gray-900">Firewall Status</p>
                                            <p className="text-sm text-gray-500">Active</p>
                                        </div>
                                    </div>
                                    <span className="text-blue-600 font-bold">Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Performance Trends */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Performance Trends</h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Response Time Trend</span>
                                    <span className="text-sm text-green-600">↓ 15%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Error Rate Trend</span>
                                    <span className="text-sm text-red-600">↑ 5%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full" style={{width: '25%'}}></div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">User Growth</span>
                                    <span className="text-sm text-blue-600">↑ 12%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '60%'}}></div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">System Load</span>
                                    <span className="text-sm text-yellow-600">→ 0%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '45%'}}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
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
                                            log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {log.success ? 'Success' : 'Failed'}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                    <p className="text-gray-500">No recent activity available</p>
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
                                                            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                                                log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                                                                log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                                {log.level === 'ERROR' ? '⚠️ Issue' : 
                                                                 log.level === 'WARNING' ? '⚠️ Warning' : 
                                                                 '✅ Information'}
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
                                            <p className="text-gray-500">No system logs available</p>
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
