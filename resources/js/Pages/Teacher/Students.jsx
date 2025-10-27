import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SecondaryButton from '@/Components/SecondaryButton';
import { Users, Search, Filter, Download, Eye, X, Mail, Phone, MapPin, Calendar, GraduationCap } from 'lucide-react';

export default function Students({ students = [], sections = [], filters = {} }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedSection, setSelectedSection] = useState(filters.section || '');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showStudentModal, setShowStudentModal] = useState(false);

    const applyFilters = () => {
        router.get(route('teacher.students'), {
            search: searchTerm || undefined,
            section: selectedSection || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedSection('');
        router.get(route('teacher.students'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setShowStudentModal(true);
    };

    const closeStudentModal = () => {
        setShowStudentModal(false);
        setSelectedStudent(null);
    };

    return (
        <AuthenticatedLayout>
            <Head title="My Students" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Students</h1>
                        <p className="text-gray-600">
                            View and manage your students
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                            <Users className="h-3 w-3 mr-1" />
                            {students.length} Students
                        </span>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Filter className="h-5 w-5 mr-2" />
                            Filters
                        </h3>
                        <div className="flex space-x-2">
                            <SecondaryButton onClick={applyFilters}>
                                Apply Filters
                            </SecondaryButton>
                            <SecondaryButton onClick={clearFilters} variant="outline">
                                Clear All
                            </SecondaryButton>
                        </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search Students
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, ID, or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Section
                            </label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Sections</option>
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <SecondaryButton className="w-full">
                                <Download className="h-4 w-4 mr-2" />
                                Export List
                            </SecondaryButton>
                        </div>
                    </div>
                </div>

                {/* Students List */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Student List</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Section
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Program
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Year Level
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Priority
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Absences
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {student.student_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {student.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.section}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.program}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {student.year_level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                student.priority === 'Safe'
                                                    ? 'bg-green-100 text-green-800'
                                                    : student.priority === 'Call Needed'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {student.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.absence_count || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                student.status === 'Active' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <SecondaryButton 
                                                className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                                                onClick={() => handleViewStudent(student)}
                                            >
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

            {/* Student Details Modal */}
            {showStudentModal && selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
                        <div className="p-8">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-xl">
                                            {selectedStudent.name ? selectedStudent.name.split(' ').map(n => n[0]).join('') : 'S'}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {selectedStudent.name}
                                        </h2>
                                        <p className="text-gray-600">{selectedStudent.student_id}</p>
                                        <p className="text-sm text-gray-500">{selectedStudent.section} - {selectedStudent.program}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeStudentModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Student Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <Mail className="h-5 w-5 text-blue-600 mr-2" />
                                        Contact Information
                                    </h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Email:</span> {selectedStudent.email}</p>
                                        <p><span className="font-medium">Phone:</span> Not provided</p>
                                        <p><span className="font-medium">Address:</span> Not provided</p>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <GraduationCap className="h-5 w-5 text-green-600 mr-2" />
                                        Academic Information
                                    </h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Section:</span> {selectedStudent.section}</p>
                                        <p><span className="font-medium">Program:</span> {selectedStudent.program}</p>
                                        <p><span className="font-medium">Department:</span> {selectedStudent.department}</p>
                                        <p><span className="font-medium">Year Level:</span> {selectedStudent.year_level}</p>
                                        <p><span className="font-medium">Status:</span> 
                                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {selectedStudent.status}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Summary */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                                    Attendance Summary
                                </h3>
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">85%</div>
                                            <div className="text-sm text-gray-600">Overall Attendance</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">45</div>
                                            <div className="text-sm text-gray-600">Days Present</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-600">8</div>
                                            <div className="text-sm text-gray-600">Days Absent</div>
                                        </div>
                                    </div>
                                    
                                    {/* Recent Attendance Records */}
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-gray-900">Recent Records</h4>
                                        {[1, 2, 3, 4, 5].map((item) => (
                                            <div key={item} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-3 h-3 rounded-full ${
                                                        item % 3 === 0 ? 'bg-red-500' : 
                                                        item % 3 === 1 ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`}></div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {item % 3 === 0 ? 'Absent' : 
                                                             item % 3 === 1 ? 'Late' : 'Present'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(Date.now() - item * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {item % 3 === 0 ? '9:00 AM' : 
                                                     item % 3 === 1 ? '9:15 AM' : '8:45 AM'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end space-x-3">
                                <SecondaryButton onClick={closeStudentModal}>
                                    Close
                                </SecondaryButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
