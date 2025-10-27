import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    TrendingUp,
    GraduationCap,
    BookOpen
} from 'lucide-react';

export default function TeacherPage() {
    return (
        <AuthenticatedLayout>
            <Head title="Teacher Dashboard" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
                        <p className="text-muted-foreground">
                            Welcome to your teaching workspace
                        </p>
                    </div>
                </div>

                {/* Welcome Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <GraduationCap className="h-6 w-6" />
                            Welcome, Teacher!
                        </h2>
                        <p className="text-gray-600">
                            This is your personal teaching dashboard. Here you can manage your classes, take attendance, and view student information.
                        </p>
                    </div>
                    <div className="text-center py-8">
                        <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <GraduationCap className="h-12 w-12 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Your Teaching Dashboard</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            This is a blank page ready for your teaching features. You can add attendance tracking, student management, and other teaching tools here.
                        </p>
                    </div>
                </div>


                {/* Placeholder Content */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                        <p className="text-sm text-gray-600">
                            Your recent teaching activities will appear here
                        </p>
                    </div>
                    <div className="text-center py-8 text-gray-500">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent activity to display</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
