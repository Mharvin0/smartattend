import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatsCard from '@/Components/StatsCard';
import { Phone, Home, Users, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

export default function CSDLDashboard({ stats = {}, recentTracking = [], studentsNeedingAttention = [] }) {
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'PNS': return 'bg-red-100 text-red-800';
            case 'Call Needed': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-green-100 text-green-800';
        }
    };

    const getTypeIcon = (type) => {
        return type === 'call' ? <Phone className="h-4 w-4" /> : <Home className="h-4 w-4" />;
    };

    return (
        <AuthenticatedLayout>
            <Head title="CSDL Dashboard" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-gray-600">Student tracking overview</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <StatsCard
                        icon={<AlertCircle className="h-6 w-6 text-yellow-600" />}
                        title="Need Calls"
                        value={stats.students_needing_calls || 0}
                    />
                    <StatsCard
                        icon={<AlertCircle className="h-6 w-6 text-red-600" />}
                        title="Need Visits"
                        value={stats.students_needing_visits || 0}
                    />
                    <StatsCard
                        icon={<Calendar className="h-6 w-6 text-blue-600" />}
                        title="Tracked Today"
                        value={stats.total_tracked_today || 0}
                    />
                    <StatsCard
                        icon={<Users className="h-6 w-6 text-green-600" />}
                        title="This Week"
                        value={stats.total_tracked_this_week || 0}
                    />
                    <StatsCard
                        icon={<Phone className="h-6 w-6 text-blue-600" />}
                        title="Calls Today"
                        value={stats.calls_today || 0}
                    />
                    <StatsCard
                        icon={<Home className="h-6 w-6 text-green-600" />}
                        title="Visits Today"
                        value={stats.visits_today || 0}
                    />
                </div>

                {/* Main Content */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Students Needing Attention */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Students Needing Attention</h3>
                            <p className="text-sm text-gray-600">Top priority students</p>
                        </div>
                        <div className="space-y-3">
                            {studentsNeedingAttention.length > 0 ? (
                                studentsNeedingAttention.map((student) => (
                                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{student.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {student.section} • {student.department}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(student.priority)}`}>
                                                {student.priority}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">{student.absence_count} absences</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No students need attention</p>
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
                                    <div key={tracking.id} className="flex items-center gap-3 p-3 border rounded-lg">
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
            </div>
        </AuthenticatedLayout>
    );
}

