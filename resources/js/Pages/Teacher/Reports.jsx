import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SecondaryButton from '@/Components/SecondaryButton';
import { BarChart3, TrendingUp, Users, Calendar, Download, Eye } from 'lucide-react';

export default function Reports({ stats, recentRecords, sections }) {
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
            case 'present': return '✓';
            case 'absent': return '✗';
            case 'late': return '⏰';
            case 'excused': return 'ℹ';
            default: return '?';
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Reports" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                        <p className="text-gray-600">
                            View attendance reports and analytics
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <SecondaryButton>
                            <Download className="h-4 w-4 mr-2" />
                            Export Report
                        </SecondaryButton>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Today's Attendance</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.today.total}</p>
                                <p className="text-xs text-gray-500">
                                    {stats.today.present} present, {stats.today.absent} absent
                                </p>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">This Week</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.this_week.total}</p>
                                <p className="text-xs text-gray-500">
                                    {stats.this_week.present} present, {stats.this_week.absent} absent
                                </p>
                            </div>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">This Month</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.this_month.total}</p>
                                <p className="text-xs text-gray-500">
                                    {stats.this_month.present} present, {stats.this_month.absent} absent
                                </p>
                            </div>
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Stats */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Breakdown - Today</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                    <span className="text-sm text-gray-600">Present</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{stats.today.present}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                                    <span className="text-sm text-gray-600">Absent</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{stats.today.absent}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                                    <span className="text-sm text-gray-600">Late</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{stats.today.late}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Summary</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total Records</span>
                                <span className="text-sm font-medium text-gray-900">{stats.this_week.total}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Attendance Rate</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {stats.this_week.total > 0 
                                        ? Math.round((stats.this_week.present / stats.this_week.total) * 100) 
                                        : 0}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Absence Rate</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {stats.this_week.total > 0 
                                        ? Math.round((stats.this_week.absent / stats.this_week.total) * 100) 
                                        : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Records */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Attendance Records</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Section
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recentRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {record.student_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.section}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                                <span className="mr-1">{getStatusIcon(record.status)}</span>
                                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(record.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.time}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <SecondaryButton className="text-blue-600 hover:text-blue-900">
                                                <Eye className="h-4 w-4 mr-1" />
                                                View
                                            </SecondaryButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
