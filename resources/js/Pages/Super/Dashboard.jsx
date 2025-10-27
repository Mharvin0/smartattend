import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatsCard from '@/Components/StatsCard';
import SecondaryButton from '@/Components/SecondaryButton';
import {
    Users,
    GraduationCap,
    BookOpen,
    UserCheck,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Crown,
    Settings,
    Shield,
    BarChart3
} from 'lucide-react';

export default function SuperAdminDashboard({ stats = {}, userStats = {}, recentActivity = [], sections = [] }) {
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
            <Head title="Super Admin Dashboard" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Crown className="h-8 w-8 text-purple-600" />
                            Super Admin Dashboard
                        </h1>
                        <p className="text-gray-600">
                            Complete system overview and management
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                            <Crown className="h-3 w-3 mr-1" />
                            Super Admin
                        </span>
                    </div>
                </div>

                {/* Main Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        icon={<Users className="h-6 w-6 text-blue-600" />}
                        title="Total Users"
                        value={stats.total_users || 0}
                        subtitle="All system users"
                    />
                    <StatsCard
                        icon={<GraduationCap className="h-6 w-6 text-green-600" />}
                        title="Total Students"
                        value={stats.total_students || 0}
                        subtitle="Enrolled students"
                    />
                    <StatsCard
                        icon={<BookOpen className="h-6 w-6 text-orange-600" />}
                        title="Total Sections"
                        value={stats.total_sections || 0}
                        subtitle="Active sections"
                    />
                    <StatsCard
                        icon={<UserCheck className="h-6 w-6 text-purple-600" />}
                        title="Today's Attendance"
                        value={stats.total_attendance_today || 0}
                        subtitle="Records today"
                    />
                </div>

                {/* Attendance Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StatsCard
                        icon={<CheckCircle className="h-6 w-6 text-green-600" />}
                        title="Present Today"
                        value={stats.present_today || 0}
                        subtitle="Students present"
                    />
                    <StatsCard
                        icon={<XCircle className="h-6 w-6 text-red-600" />}
                        title="Absent Today"
                        value={stats.absent_today || 0}
                        subtitle="Students absent"
                    />
                    <StatsCard
                        icon={<Clock className="h-6 w-6 text-yellow-600" />}
                        title="Late Today"
                        value={stats.late_today || 0}
                        subtitle="Students late"
                    />
                </div>

                {/* User Role Statistics */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Shield className="h-5 w-5 text-purple-600 mr-2" />
                            User Role Distribution
                        </h3>
                        <p className="text-sm text-gray-600">
                            System users by role
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-purple-600">Super Admins</p>
                                    <p className="text-2xl font-bold text-purple-900">{userStats.super_admins || 0}</p>
                                </div>
                                <Crown className="h-8 w-8 text-purple-400" />
                            </div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600">Admins</p>
                                    <p className="text-2xl font-bold text-blue-900">{userStats.admins || 0}</p>
                                </div>
                                <Shield className="h-8 w-8 text-blue-400" />
                            </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600">Teachers</p>
                                    <p className="text-2xl font-bold text-green-900">{userStats.teachers || 0}</p>
                                </div>
                                <GraduationCap className="h-8 w-8 text-green-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Recent Activity */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                            <p className="text-sm text-gray-600">
                                Latest attendance records
                            </p>
                        </div>
                        <div className="space-y-4">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((record) => (
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
                                    <p>No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">System Management</h3>
                            <p className="text-sm text-gray-600">
                                Super Admin tools
                            </p>
                        </div>
                        <div className="space-y-3">
                            <SecondaryButton className="w-full justify-start">
                                <Users className="h-4 w-4 mr-2" />
                                Manage Users
                            </SecondaryButton>
                            <SecondaryButton className="w-full justify-start">
                                <Settings className="h-4 w-4 mr-2" />
                                System Settings
                            </SecondaryButton>
                            <SecondaryButton className="w-full justify-start">
                                <Shield className="h-4 w-4 mr-2" />
                                Role Management
                            </SecondaryButton>
                            <SecondaryButton className="w-full justify-start">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                System Reports
                            </SecondaryButton>
                            <SecondaryButton className="w-full justify-start">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Database Management
                            </SecondaryButton>
                        </div>
                    </div>
                </div>

                {/* Sections Overview */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Sections Overview</h3>
                        <p className="text-sm text-gray-600">
                            All active sections in the system
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {sections.length > 0 ? (
                            sections.map((section) => (
                                <div key={section.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-gray-900">{section.name}</h4>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {section.year_level}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{section.program}</p>
                                    <p className="text-xs text-gray-500 mb-3">{section.department}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">
                                            {section.student_count} students
                                        </span>
                                        <SecondaryButton className="text-xs">
                                            View Details
                                        </SecondaryButton>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-8 text-gray-500">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No sections found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
