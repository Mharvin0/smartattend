import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function AdminPage() {
    const { 
        auth,
        sections, 
        students, 
        todayStats, 
        attendanceRate, 
        recentRecords
    } = usePage().props;
    
    const [currentTime, setCurrentTime] = useState(new Date());
    const [liveData, setLiveData] = useState(null);
    const [notification, setNotification] = useState(null);
    

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

    const fetchLiveData = useCallback(async () => {
        try {
            const response = await fetch(route('admin.admin-page.live-data'));
            if (response.ok) {
                const data = await response.json();
                setLiveData(data);
            }
        } catch (error) {
            console.error('Failed to fetch live data:', error);
        }
    }, []);

    useEffect(() => {
        fetchLiveData();
        const interval = setInterval(fetchLiveData, 30000);
        return () => clearInterval(interval);
    }, [fetchLiveData]);

    useEffect(() => {
        // Load department rates
        fetch(route('admin.attendance.department-rates'))
            .then(res => res.json())
            .then(data => {
                const container = document.getElementById('department-rates-container');
                if (container && data.departments) {
                    container.innerHTML = data.departments.map(dept => `
                        <div class="border border-gray-200 rounded-lg p-6">
                            <div class="flex items-center justify-between mb-4">
                            <div>
                                    <h4 class="text-lg font-medium text-gray-900">${dept.name}</h4>
                                    <p class="text-sm text-gray-500">${dept.code || ''}</p>
                            </div>
                                <div class="text-right">
                                    <p class="text-2xl font-bold ${dept.attendance_rate >= 90 ? 'text-green-600' : dept.attendance_rate >= 80 ? 'text-yellow-600' : 'text-red-600'}">
                                        ${dept.attendance_rate}%
                                    </p>
                                    <p class="text-sm text-gray-500">${dept.total_records} records</p>
                        </div>
                            </div>
                            <div class="grid grid-cols-4 gap-4">
                                <div class="text-center">
                                    <p class="text-sm text-gray-500">Present</p>
                                    <p class="text-lg font-semibold text-green-600">${dept.present || 0}</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-sm text-gray-500">Late</p>
                                    <p class="text-lg font-semibold text-yellow-600">${dept.late || 0}</p>
                            </div>
                                <div class="text-center">
                                    <p class="text-sm text-gray-500">Absent</p>
                                    <p class="text-lg font-semibold text-red-600">${dept.absent || 0}</p>
                        </div>
                                <div class="text-center">
                                    <p class="text-sm text-gray-500">Excused</p>
                                    <p class="text-lg font-semibold text-blue-600">${dept.excused || 0}</p>
                    </div>
                </div>
                        </div>
                    `).join('');
                }
            })
            .catch(err => console.error('Failed to load department rates:', err));

    }, []);


    // Render Dashboard Tab
    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
                                <div className="flex items-center justify-between">
                                    <div>
                            <p className="text-sm font-medium text-gray-600">Today's Attendance</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {liveData?.stats?.present || todayStats?.present || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                            {attendanceRate || 0}% Rate
                                        </p>
                                    </div>
                        <div className="h-16 w-16 bg-blue-500 rounded-2xl flex items-center justify-center">
                            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
                                <div className="flex items-center justify-between">
                                    <div>
                            <p className="text-sm font-medium text-gray-600">Absent Today</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {liveData?.stats?.absent || todayStats?.absent || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Students</p>
                                    </div>
                        <div className="h-16 w-16 bg-red-500 rounded-2xl flex items-center justify-center">
                            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
                                <div className="flex items-center justify-between">
                                    <div>
                            <p className="text-sm font-medium text-gray-600">Late Today</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {liveData?.stats?.late || todayStats?.late || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Students</p>
                                    </div>
                        <div className="h-16 w-16 bg-yellow-500 rounded-2xl flex items-center justify-center">
                            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
                                <div className="flex items-center justify-between">
                                    <div>
                            <p className="text-sm font-medium text-gray-600">Total Students</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {students?.length || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Registered</p>
                                    </div>
                        <div className="h-16 w-16 bg-purple-500 rounded-2xl flex items-center justify-center">
                            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Recent Activity */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {(liveData?.recentActivity || recentRecords?.slice(0, 10) || []).map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center space-x-3">
                                        <div className={`w-3 h-3 rounded-full ${
                                            record.status === 'present' ? 'bg-green-500' :
                                            record.status === 'late' ? 'bg-yellow-500' : 
                                            record.status === 'excused' ? 'bg-purple-500' : 'bg-red-500'
                                        }`}></div>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {record.student?.first_name || record.student?.name} {record.student?.last_name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {record.student?.section?.name || record.student?.section} • {record.status} • {record.time || record.date}
                                            </p>
                                        </div>
                                    </div>
                            </div>
                                ))}
                            </div>
                            </div>

                        {/* Department Rates */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Department Attendance Rates</h3>
                            <div id="department-rates-container" className="space-y-4">
                                <p className="text-gray-500 text-center py-8">Loading department rates...</p>
                            </div>
                            </div>
                            </div>
    );


    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="Admin Dashboard" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-zinc-50/70 py-8">
                <div className="w-full px-6 py-8 space-y-6">
                    {/* Notification */}
                    {notification && (
                        <div className={`mb-6 p-4 rounded-lg ${
                            notification.type === 'success' ? 'bg-green-100 text-green-800' :
                            notification.type === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {notification.message}
                                    </div>
            )}

                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
                                        Admin Dashboard
                                    </h1>
                                    <p className="text-gray-600 mt-2 text-lg">
                                        Attendance management and student administration
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
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-900">{students?.length || 0}</div>
                                    <div className="text-sm text-gray-500">Total Students</div>
                                    <div className="text-2xl font-bold text-gray-900 mt-2">{sections?.length || 0}</div>
                                    <div className="text-sm text-gray-500">Total Sections</div>
                                    </div>
                                </div>
                            </div>
                            </div>

                    {/* Dashboard Content */}
                    {renderDashboard()}
                            </div>
                                    </div>
        </AuthenticatedLayout>
    );
}
