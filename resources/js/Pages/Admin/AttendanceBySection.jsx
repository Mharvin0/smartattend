import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function AttendanceBySection({ sections, students, attendanceRecords, filters }) {
    const { data, setData, post, processing, errors } = useForm({
        section_id: filters.section_id || '',
        date: filters.date || new Date().toISOString().split('T')[0],
        records: []
    });

    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [bulkStatus, setBulkStatus] = useState('');
    const [showBulkActions, setShowBulkActions] = useState(false);

    const flash = usePage().props.flash || {};

    // Initialize records when students or date changes
    useEffect(() => {
        if (students.length > 0) {
            const records = students.map(student => {
                const existingRecord = attendanceRecords.get(student.id);
                return {
                    student_id: student.id,
                    status: existingRecord?.status || 'absent',
                    remarks: existingRecord?.remarks || ''
                };
            });
            setData('records', records);
        }
    }, [students, attendanceRecords]);

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.attendance.section.store'));
    };

    const handleStatusChange = (studentId, status) => {
        const updatedRecords = data.records.map(record => 
            record.student_id === studentId 
                ? { ...record, status }
                : record
        );
        setData('records', updatedRecords);
    };

    const handleRemarksChange = (studentId, remarks) => {
        const updatedRecords = data.records.map(record => 
            record.student_id === studentId 
                ? { ...record, remarks }
                : record
        );
        setData('records', updatedRecords);
    };

    const handleBulkStatusChange = () => {
        if (!bulkStatus) return;
        
        const updatedRecords = data.records.map(record => 
            selectedStudents.has(record.student_id)
                ? { ...record, status: bulkStatus }
                : record
        );
        setData('records', updatedRecords);
        setSelectedStudents(new Set());
        setBulkStatus('');
        setShowBulkActions(false);
    };

    const handleSelectAll = () => {
        if (selectedStudents.size === students.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(students.map(s => s.id)));
        }
    };

    const handleStudentSelect = (studentId) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const statusOptions = [
        { value: 'present', label: 'Present', color: 'text-green-600', bg: 'bg-green-100' },
        { value: 'late', label: 'Late', color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { value: 'absent', label: 'Absent', color: 'text-red-600', bg: 'bg-red-100' },
        { value: 'excused', label: 'Excused', color: 'text-blue-600', bg: 'bg-blue-100' },
    ];

    const getStatusStats = () => {
        const stats = { present: 0, late: 0, absent: 0, excused: 0 };
        data.records.forEach(record => {
            stats[record.status] = (stats[record.status] || 0) + 1;
        });
        return stats;
    };

    const stats = getStatusStats();

    return (
        <AuthenticatedLayout header={<h2 className="text-2xl font-bold leading-tight text-gray-800">Attendance by Section</h2>}>
            <Head title="Attendance by Section" />
            <div className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-emerald-50/80 to-brand-secondary/5 py-8">
                <div className="mx-auto max-w-full space-y-8 px-4 sm:px-6 lg:px-8 xl:px-12">
                    {flash.success && (
                        <div className="pointer-events-none fixed right-6 top-6 z-50 rounded bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">
                            {flash.success}
                        </div>
                    )}

                    {/* Section and Date Selection */}
                    <div className="card">
                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Select Section and Date</h3>
                            <p className="mt-1 text-sm text-gray-600">Choose the section and date for attendance recording.</p>
                        </div>

                        <form onSubmit={submit} className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Section *</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                    value={data.section_id}
                                    onChange={(e) => setData('section_id', e.target.value)}
                                    required
                                >
                                    <option value="">Select Section</option>
                                    {sections.map((section) => (
                                        <option key={section.id} value={section.id}>
                                            {section.name} ({section.department?.name} - {section.program?.name})
                                        </option>
                                    ))}
                                </select>
                                {errors.section_id && <p className="mt-1 text-sm text-red-600">{errors.section_id}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date *</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    required
                                />
                                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={() => router.get(route('admin.attendance.section'), { section_id: data.section_id, date: data.date })}
                                    className="btn-secondary w-full"
                                >
                                    Load Students
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Quick Stats */}
                    {students.length > 0 && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                            <div className="card">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Present</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.present}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                            <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Late</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.late}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                                            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Absent</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.absent}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Excused</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.excused}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bulk Actions */}
                    {students.length > 0 && (
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Bulk Actions</h3>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-sm text-brand-primary hover:text-brand-primary/80"
                                    >
                                        {selectedStudents.size === students.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <button
                                        onClick={() => setShowBulkActions(!showBulkActions)}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                                    >
                                        Bulk Actions ({selectedStudents.size})
                                    </button>
                                </div>
                            </div>

                            {showBulkActions && (
                                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <select
                                        value={bulkStatus}
                                        onChange={(e) => setBulkStatus(e.target.value)}
                                        className="rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                    >
                                        <option value="">Select Status</option>
                                        {statusOptions.map((status) => (
                                            <option key={status.value} value={status.value}>{status.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleBulkStatusChange}
                                        disabled={!bulkStatus || selectedStudents.size === 0}
                                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Apply to Selected
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowBulkActions(false);
                                            setBulkStatus('');
                                        }}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Attendance Form */}
                    {students.length > 0 && (
                        <div className="card">
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-900">Record Attendance</h3>
                                <p className="mt-1 text-sm text-gray-600">Mark attendance for each student in the selected section.</p>
                            </div>

                            <form onSubmit={submit}>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudents.size === students.length}
                                                        onChange={handleSelectAll}
                                                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                                    />
                                                </th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map((student) => {
                                                const record = data.records.find(r => r.student_id === student.id);
                                                return (
                                                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-3 px-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedStudents.has(student.id)}
                                                                onChange={() => handleStudentSelect(student.id)}
                                                                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div>
                                                                <div className="font-medium text-gray-900">
                                                                    {student.first_name} {student.last_name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">{student.student_number}</div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <select
                                                                value={record?.status || 'absent'}
                                                                onChange={(e) => handleStatusChange(student.id, e.target.value)}
                                                                className="rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                                            >
                                                                {statusOptions.map((status) => (
                                                                    <option key={status.value} value={status.value}>
                                                                        {status.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <input
                                                                type="text"
                                                                placeholder="Optional remarks..."
                                                                value={record?.remarks || ''}
                                                                onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="btn-primary inline-flex items-center gap-2"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {processing ? 'Saving...' : 'Save Attendance'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* No Students Message */}
                    {data.section_id && students.length === 0 && (
                        <div className="card">
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                                <p className="mt-1 text-sm text-gray-500">This section doesn't have any students enrolled.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}