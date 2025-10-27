import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SecondaryButton from '@/Components/SecondaryButton';
import { BookOpen, Users, Filter, Search, Eye, X, Calendar, GraduationCap, User, Mail, Phone, MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function Classes({ sections, departments, yearLevels, filters }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department || '');
    const [selectedYearLevel, setSelectedYearLevel] = useState(filters.year_level || '');
    const [selectedClass, setSelectedClass] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showStudentModal, setShowStudentModal] = useState(false);

    const applyFilters = () => {
        router.get(route('teacher.classes'), {
            department: selectedDepartment || undefined,
            year_level: selectedYearLevel || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSelectedDepartment('');
        setSelectedYearLevel('');
        setSearchTerm('');
        router.get(route('teacher.classes'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleViewClass = (sectionId) => {
        setIsLoading(true);
        const section = sections.find(s => s.id === sectionId);
        if (section) {
            console.log('Selected class data:', section); // Debug log
            setSelectedClass(section);
            setShowModal(true);
        } else {
            console.error('Section not found:', sectionId);
        }
        setIsLoading(false);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedClass(null);
    };

    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setShowStudentModal(true);
    };

    const closeStudentModal = () => {
        setShowStudentModal(false);
        setSelectedStudent(null);
    };


    // Filter sections based on search term
    const filteredSections = sections.filter(section => {
        const matchesSearch = section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            section.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            section.department.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <AuthenticatedLayout>
            <Head title="My Classes" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
                        <p className="text-gray-600">
                            Manage your assigned classes and teaching schedule
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {sections.length} Classes
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
                                Search Classes
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, program, or department..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Department
                            </label>
                            <select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Departments</option>
                                {departments.map((dept) => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Year Level
                            </label>
                            <select
                                value={selectedYearLevel}
                                onChange={(e) => setSelectedYearLevel(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Year Levels</option>
                                {yearLevels.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Classes Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">My Assigned Classes</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Class Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Year Level
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Program
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Students
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Subject
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Academic Year
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredSections.map((section) => (
                                    <tr key={section.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{section.name}</div>
                                            <div className="text-sm text-gray-500">Adviser: {section.adviser_name || 'TBA'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {section.year_level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {section.program}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {section.department}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center">
                                                <Users className="h-4 w-4 mr-1 text-gray-400" />
                                                {section.student_count}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {section.subject}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {section.academic_year} - {section.semester}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <SecondaryButton 
                                                    className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                                                    onClick={() => handleViewClass(section.id)}
                                                    disabled={isLoading}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    {isLoading ? 'Loading...' : 'View'}
                                                </SecondaryButton>
                                                <SecondaryButton 
                                                    className="text-green-600 hover:text-green-900 hover:bg-green-50 transition-colors"
                                                    onClick={() => handleViewStudents(section.id)}
                                                >
                                                    <Users className="h-4 w-4 mr-1" />
                                                    Students
                                                </SecondaryButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Class Details Modal */}
            {showModal && selectedClass && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh'
                    }}
                    onClick={closeModal}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
                        style={{
                            margin: 'auto',
                            transform: 'translateY(0)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                        <p className="text-gray-600">Loading class details...</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                                        <BookOpen className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {selectedClass?.name || 'Unknown Class'}
                                        </h2>
                                        <p className="text-gray-600">{selectedClass?.subject || 'No Subject'}</p>
                                        <p className="text-sm text-gray-500">{selectedClass?.program || 'No Program'} - {selectedClass?.department || 'No Department'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Class Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <GraduationCap className="h-5 w-5 text-blue-600 mr-2" />
                                        Class Information
                                    </h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Year Level:</span> {selectedClass?.year_level || 'Not Specified'}</p>
                                        <p><span className="font-medium">Subject:</span> {selectedClass?.subject || 'Not Specified'}</p>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                                        Academic Period
                                    </h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Academic Year:</span> {selectedClass?.academic_year || 'Not Specified'}</p>
                                        <p><span className="font-medium">Semester:</span> {selectedClass?.semester || 'Not Specified'}</p>
                                        <p><span className="font-medium">Program:</span> {selectedClass?.program || 'Not Specified'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Student Count Card */}
                            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Students</h3>
                                        <p className="text-4xl font-bold text-blue-600">{selectedClass?.student_count || 0}</p>
                                        <p className="text-sm text-blue-700">Students enrolled in this class</p>
                                    </div>
                                    <Users className="h-16 w-16 text-blue-400" />
                                </div>
                            </div>

                            {/* Students List */}
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <Users className="h-5 w-5 text-green-600 mr-2" />
                                    Enrolled Students
                                </h3>
                                
                                {selectedClass?.students && selectedClass.students.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedClass.students.map((student) => (
                                            <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center space-x-4">
                                                    <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                                                        <span className="text-white font-semibold text-sm">
                                                            {student.name ? student.name.split(' ').map(n => n[0]).join('') : 'S'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{student.name}</p>
                                                        <p className="text-sm text-gray-500">{student.student_id}</p>
                                                        <p className="text-xs text-gray-400">{student.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        student.priority === 'Safe'
                                                            ? 'bg-green-100 text-green-800'
                                                            : student.priority === 'Call Needed'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {student.priority}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {student.absence_count} absences
                                                    </span>
                                                    <SecondaryButton
                                                        className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                                                        onClick={() => handleViewStudent(student)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View
                                                    </SecondaryButton>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No students enrolled in this class</p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end">
                                <SecondaryButton onClick={closeModal}>
                                    Close
                                </SecondaryButton>
                            </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Student Details Modal */}
            {showStudentModal && selectedStudent && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh'
                    }}
                    onClick={closeStudentModal}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
                        style={{
                            margin: 'auto',
                            transform: 'translateY(0)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="h-16 w-16 bg-green-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-xl">
                                            {selectedStudent.name ? selectedStudent.name.split(' ').map(n => n[0]).join('') : 'S'}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {selectedStudent.name}
                                        </h2>
                                        <p className="text-gray-600">{selectedStudent.student_id}</p>
                                        <p className="text-sm text-gray-500">{selectedStudent.email}</p>
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
                                        <p><span className="font-medium">Student ID:</span> {selectedStudent.student_id}</p>
                                        <p><span className="font-medium">Class:</span> {selectedClass?.name || 'N/A'}</p>
                                        <p><span className="font-medium">Program:</span> {selectedClass?.program || 'N/A'}</p>
                                        <p><span className="font-medium">Department:</span> {selectedClass?.department || 'N/A'}</p>
                                        <p><span className="font-medium">Status:</span>
                                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                selectedStudent.status === 'Active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {selectedStudent.status}
                                            </span>
                                        </p>
                                        <p><span className="font-medium">Priority:</span>
                                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                selectedStudent.priority === 'Safe'
                                                    ? 'bg-green-100 text-green-800'
                                                    : selectedStudent.priority === 'Call Needed'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {selectedStudent.priority}
                                            </span>
                                        </p>
                                        <p><span className="font-medium">Absence Count:</span> {selectedStudent.absence_count || 0}</p>
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
