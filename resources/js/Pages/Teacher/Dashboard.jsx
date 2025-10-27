import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatsCard from '@/Components/StatsCard';
import { 
    Users, 
    BookOpen, 
    GraduationCap,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';

export default function TeacherDashboard({ todayStats = {}, recentRecords = [], sections = [], subjects = [] }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'bg-green-100 text-green-800';
            case 'absent': return 'bg-red-100 text-red-800';
            case 'late': return 'bg-yellow-100 text-yellow-800';
            case 'excused': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present': return <CheckCircle className="h-4 w-4" />;
            case 'absent': return <XCircle className="h-4 w-4" />;
            case 'late': return <Clock className="h-4 w-4" />;
            case 'excused': return <AlertCircle className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Teacher Dashboard" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            Teacher Portal
                        </span>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        icon={<Users className="h-6 w-6 text-blue-600" />}
                        title="Total Students"
                        value={todayStats.total_students || 0}
                    />
                    <StatsCard
                        icon={<CheckCircle className="h-6 w-6 text-green-600" />}
                        title="Present Today"
                        value={todayStats.present_today || 0}
                    />
                    <StatsCard
                        icon={<XCircle className="h-6 w-6 text-red-600" />}
                        title="Absent Today"
                        value={todayStats.absent_today || 0}
                    />
                    <StatsCard
                        icon={<Clock className="h-6 w-6 text-yellow-600" />}
                        title="Late Today"
                        value={todayStats.late_today || 0}
                    />
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-lg shadow p-6">
                    {/* Recent Activity */}
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Attendance</h3>
                        <p className="text-sm text-gray-600">Latest attendance records</p>
                    </div>
                    <div className="space-y-4">
                        {recentRecords.length > 0 ? (
                            recentRecords.map((record) => (
                                <div key={record.id} className="flex items-center space-x-4">
                                    <div className={`p-2 rounded-full ${getStatusColor(record.status)}`}>
                                        {getStatusIcon(record.status)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {record.student.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {record.student.section}
                                        </p>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {record.time}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No recent attendance records</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Classes and Subjects */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">My Classes</h3>
                            <p className="text-sm text-gray-600">Sections you're teaching</p>
                        </div>
                        <div className="space-y-2">
                            {sections.length > 0 ? (
                                sections.map((section) => (
                                    <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{section.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {section.program} • {section.department}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No classes assigned yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">My Subjects</h3>
                            <p className="text-sm text-gray-600">Subjects you're teaching</p>
                        </div>
                        <div className="space-y-2">
                            {subjects.length > 0 ? (
                                subjects.map((subject) => (
                                    <div key={subject.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{subject.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {subject.code || 'No code'}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                            Teaching
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No subjects assigned yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
