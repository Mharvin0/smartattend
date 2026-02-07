import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatsCard from '@/Components/StatsCard';
import Chart from 'chart.js/auto';
import { 
    Phone, 
    Home, 
    Users, 
    Calendar, 
    AlertCircle, 
    CheckCircle, 
    RefreshCw, 
    Mail, 
    User, 
    MapPin,
    BarChart3,
    TrendingUp,
    Clock
} from 'lucide-react';

export default function CSDLDashboard({ stats = {}, recentTracking = [], studentsNeedingAttention = [], visitsByWeek = null, statusTrendByWeek = null }) {
    const [liveData, setLiveData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [expandedStudent, setExpandedStudent] = useState(null);
    
    // Chart refs
    const visitsChartRef = useRef(null);
    const statusChartRef = useRef(null);
    const visitsChartInstance = useRef(null);
    const statusChartInstance = useRef(null);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'PNS': return 'bg-red-100 text-red-800 border-red-300';
            case 'Call Needed': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default: return 'bg-green-100 text-green-800 border-green-300';
        }
    };

    const getTypeIcon = (type) => {
        return type === 'call' ? <Phone className="h-4 w-4" /> : <Home className="h-4 w-4" />;
    };

    const fetchLiveData = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/csdl/dashboard/live-data', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            if (response.ok) {
                const data = await response.json();
                setLiveData(data);
                setLastRefresh(new Date());
            } else {
                console.error('Failed to fetch live data:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Failed to fetch live data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        fetchLiveData();
        
        // Set up polling every 30 seconds
        const interval = setInterval(fetchLiveData, 30000);
        
        return () => clearInterval(interval);
    }, [fetchLiveData]);

    // Update charts when live data changes
    useEffect(() => {
        const visitsData = liveData?.visitsByWeek || visitsByWeek;
        const statusData = liveData?.statusTrendByWeek || statusTrendByWeek;
        if (!visitsData || !statusData) return;

        // Visits Over Time Chart
        if (visitsChartRef.current && visitsData?.labels?.length) {
            if (visitsChartInstance.current) {
                visitsChartInstance.current.destroy();
            }

            const ctx = visitsChartRef.current.getContext('2d');
            visitsChartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: visitsData.labels,
                    datasets: [{
                        label: 'Students Needing Home Visits',
                        data: visitsData.needing,
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        borderRadius: 4,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                            },
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
        }

        // Visits by Status Chart
        if (statusChartRef.current && statusData?.labels?.length) {
            if (statusChartInstance.current) {
                statusChartInstance.current.destroy();
            }

            const ctx = statusChartRef.current.getContext('2d');
            const statusLabels = statusData.labels;
            const statusSeries = statusData.series || {};
            const statusOrder = ['completed', 'processing', 'to_follow', 'no_answer'];
            const statusStyles = {
                completed: {
                    label: 'Completed',
                    backgroundColor: 'rgba(34, 197, 94, 0.6)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                },
                processing: {
                    label: 'Processing',
                    backgroundColor: 'rgba(147, 51, 234, 0.6)',
                    borderColor: 'rgba(147, 51, 234, 1)',
                },
                to_follow: {
                    label: 'To Follow',
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                },
                no_answer: {
                    label: 'No Answer',
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                },
            };
            
            statusChartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: statusLabels,
                    datasets: statusOrder.map((key) => ({
                        label: statusStyles[key].label,
                        data: statusSeries[key] || [],
                        backgroundColor: statusStyles[key].backgroundColor,
                        borderColor: statusStyles[key].borderColor,
                        borderWidth: 2,
                        borderRadius: 4,
                    })),
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            stacked: true,
                            ticks: {
                                stepSize: 1,
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)',
                            },
                        },
                        x: {
                            stacked: true,
                            grid: {
                                display: false,
                            },
                        },
                    },
                },
            });
        }

        return () => {
            if (visitsChartInstance.current) visitsChartInstance.current.destroy();
            if (statusChartInstance.current) statusChartInstance.current.destroy();
        };
    }, [liveData, visitsByWeek, statusTrendByWeek]);

    const currentStats = liveData?.stats || stats;
    const currentStudents = liveData?.studentsNeedingVisits || studentsNeedingAttention;

    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="CSDL Dashboard" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-gray-600">Real-time student tracking overview</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Last updated: {lastRefresh.toLocaleTimeString()}
                        </div>
                        <button
                            onClick={fetchLiveData}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        icon={<CheckCircle className="h-6 w-6 text-green-600" />}
                        title="Completed"
                        value={currentStats.completed || 0}
                    />
                    <StatsCard
                        icon={<RefreshCw className="h-6 w-6 text-purple-600" />}
                        title="Processing"
                        value={currentStats.processing || 0}
                    />
                    <StatsCard
                        icon={<Clock className="h-6 w-6 text-blue-600" />}
                        title="To Follow"
                        value={currentStats.to_follow || 0}
                    />
                    <StatsCard
                        icon={<Phone className="h-6 w-6 text-red-600" />}
                        title="No Answer"
                        value={currentStats.no_answer || 0}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Visits Over Time */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                Students Needing Home Visits by Week
                            </h3>
                            <p className="text-sm text-gray-600">Last 7 weeks</p>
                        </div>
                        <div className="h-64">
                            <canvas ref={visitsChartRef}></canvas>
                        </div>
                    </div>

                    {/* Visits by Status */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Home Visit Status by Week
                            </h3>
                            <p className="text-sm text-gray-600">Last 7 weeks</p>
                        </div>
                        <div className="h-64">
                            <canvas ref={statusChartRef}></canvas>
                        </div>
                    </div>
                </div>

                {/* Recent Tracking */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Tracking</h3>
                        <p className="text-sm text-gray-600">Your recent activity</p>
                    </div>
                    <div className="space-y-3">
                        {recentTracking.length > 0 ? (
                            recentTracking.map((tracking) => (
                                <div key={tracking.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className={`p-2 rounded-full ${tracking.type === 'call' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                        {getTypeIcon(tracking.type)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{tracking.student.name}</p>
                                        <p className="text-xs text-gray-500">{tracking.date} {tracking.time && `at ${tracking.time}`}</p>
                                        {tracking.notes && (
                                            <p className="text-xs text-gray-600 mt-1 truncate">{tracking.notes}</p>
                                        )}
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        tracking.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        tracking.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {tracking.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No recent tracking</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
