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

export default function CSDLDashboard({ stats = {}, recentTracking = [], studentsNeedingAttention = [] }) {
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
        if (!liveData) return;

        // Visits Over Time Chart
        if (visitsChartRef.current && liveData.visitsByDay) {
            if (visitsChartInstance.current) {
                visitsChartInstance.current.destroy();
            }

            const ctx = visitsChartRef.current.getContext('2d');
            visitsChartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: liveData.visitsByDay.map(d => d.label),
                    datasets: [{
                        label: 'Home Visits',
                        data: liveData.visitsByDay.map(d => d.count),
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
        if (statusChartRef.current && liveData.visitsByStatus) {
            if (statusChartInstance.current) {
                statusChartInstance.current.destroy();
            }

            const ctx = statusChartRef.current.getContext('2d');
            const statusLabels = Object.keys(liveData.visitsByStatus);
            const statusData = Object.values(liveData.visitsByStatus);
            
            statusChartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: statusLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
                    datasets: [{
                        label: 'Visits',
                        data: statusData,
                        backgroundColor: [
                            'rgba(34, 197, 94, 0.6)',
                            'rgba(59, 130, 246, 0.6)',
                            'rgba(234, 179, 8, 0.6)',
                            'rgba(239, 68, 68, 0.6)',
                        ],
                        borderColor: [
                            'rgba(34, 197, 94, 1)',
                            'rgba(59, 130, 246, 1)',
                            'rgba(234, 179, 8, 1)',
                            'rgba(239, 68, 68, 1)',
                        ],
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

        return () => {
            if (visitsChartInstance.current) visitsChartInstance.current.destroy();
            if (statusChartInstance.current) statusChartInstance.current.destroy();
        };
    }, [liveData]);

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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <StatsCard
                        icon={<AlertCircle className="h-6 w-6 text-red-600" />}
                        title="Need Visits"
                        value={currentStats.students_needing_visits || 0}
                    />
                    <StatsCard
                        icon={<Calendar className="h-6 w-6 text-blue-600" />}
                        title="Tracked Today"
                        value={currentStats.total_tracked_today || 0}
                    />
                    <StatsCard
                        icon={<Users className="h-6 w-6 text-green-600" />}
                        title="This Week"
                        value={currentStats.total_tracked_this_week || 0}
                    />
                    <StatsCard
                        icon={<Home className="h-6 w-6 text-purple-600" />}
                        title="Visits Today"
                        value={currentStats.visits_today || 0}
                    />
                    <StatsCard
                        icon={<TrendingUp className="h-6 w-6 text-indigo-600" />}
                        title="This Month"
                        value={currentStats.visits_this_month || 0}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Visits Over Time */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                Visits Over Time
                            </h3>
                            <p className="text-sm text-gray-600">Last 7 days</p>
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
                                Visits by Status
                            </h3>
                            <p className="text-sm text-gray-600">This month</p>
                        </div>
                        <div className="h-64">
                            <canvas ref={statusChartRef}></canvas>
                        </div>
                    </div>
                </div>

                {/* Students Needing Home Visits - Detailed View */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    Students Needing Home Visits
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {currentStudents.length} student{currentStudents.length !== 1 ? 's' : ''} requiring immediate attention
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        {currentStudents.length > 0 ? (
                            <div className="space-y-4">
                                {currentStudents.map((student) => (
                                    <div 
                                        key={student.id} 
                                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        <div 
                                            className="p-4 cursor-pointer"
                                            onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="text-lg font-semibold text-gray-900">
                                                            {student.name}
                                                        </h4>
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(student.priority)}`}>
                                                            {student.priority}
                                                        </span>
                                                        {student.total_visits > 0 && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {student.total_visits} visit{student.total_visits !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                                        <div>
                                                            <span className="font-medium">Student #:</span> {student.student_number}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Section:</span> {student.section}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Department:</span> {student.department}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Absences:</span> {student.absence_count}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <button className="text-blue-600 hover:text-blue-800">
                                                        {expandedStudent === student.id ? '▼' : '▶'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {expandedStudent === student.id && (
                                            <div className="border-t bg-gray-50 p-4">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    {/* Student Information */}
                                                    <div>
                                                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                            <User className="h-4 w-4" />
                                                            Student Information
                                                        </h5>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex items-start gap-2">
                                                                <span className="font-medium text-gray-700 w-32">Program:</span>
                                                                <span className="text-gray-600">{student.program}</span>
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <span className="font-medium text-gray-700 w-32">Year Level:</span>
                                                                <span className="text-gray-600">{student.year_level}</span>
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <span className="font-medium text-gray-700 w-32">Gender:</span>
                                                                <span className="text-gray-600">{student.gender}</span>
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <span className="font-medium text-gray-700 w-32">Birth Date:</span>
                                                                <span className="text-gray-600">{formatDate(student.birth_date)}</span>
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <span className="font-medium text-gray-700 w-32">Status:</span>
                                                                <span className={`px-2 py-1 rounded text-xs ${
                                                                    student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {student.status || 'active'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Contact Information */}
                                                    <div>
                                                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                            <Phone className="h-4 w-4" />
                                                            Contact Information
                                                        </h5>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex items-start gap-2">
                                                                <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                                                                <div>
                                                                    <span className="font-medium text-gray-700">Email:</span>
                                                                    <span className="text-gray-600 ml-2">{student.email || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                                                                <div>
                                                                    <span className="font-medium text-gray-700">Phone:</span>
                                                                    <span className="text-gray-600 ml-2">{student.phone || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="mt-4 pt-3 border-t">
                                                                <h6 className="font-medium text-gray-700 mb-2">Guardian Information</h6>
                                                                <div className="space-y-1">
                                                                    <div className="flex items-start gap-2">
                                                                        <User className="h-4 w-4 text-gray-400 mt-0.5" />
                                                                        <div>
                                                                            <span className="font-medium text-gray-700">Name:</span>
                                                                            <span className="text-gray-600 ml-2">{student.guardian_name}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-2">
                                                                        <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                                                                        <div>
                                                                            <span className="font-medium text-gray-700">Contact:</span>
                                                                            <span className="text-gray-600 ml-2">{student.guardian_contact}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Visit History */}
                                                {student.last_visit_date && (
                                                    <div className="mt-4 pt-4 border-t">
                                                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                            <Home className="h-4 w-4" />
                                                            Last Visit Information
                                                        </h5>
                                                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                                                            <div>
                                                                <span className="font-medium text-gray-700">Date:</span>
                                                                <span className="text-gray-600 ml-2">{formatDate(student.last_visit_date)}</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-gray-700">Status:</span>
                                                                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                                                    student.last_visit_status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                    student.last_visit_status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {student.last_visit_status || 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-gray-700">Total Visits:</span>
                                                                <span className="text-gray-600 ml-2">{student.total_visits}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Button */}
                                                <div className="mt-4 pt-4 border-t">
                                                    <button
                                                        onClick={() => router.visit('/csdl/csdl-page')}
                                                        className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Home className="h-4 w-4" />
                                                        Track Home Visit
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">No students need home visits</p>
                                <p className="text-sm mt-2">All students are up to date</p>
                            </div>
                        )}
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
