import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AttendanceImport({ sections, departments, programs }) {
    const { data, setData, post, processing, errors } = useForm({
        file: null,
        section_id: '',
        date: new Date().toISOString().split('T')[0],
    });

    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [importTemplate, setImportTemplate] = useState(null);

    const flash = usePage().props.flash || {};

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.attendance.import.store'), {
            forceFormData: true,
        });
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setData('file', file);
            setSelectedFile(file);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setData('file', file);
            setSelectedFile(file);
        }
    };

    const downloadTemplate = () => {
        // Create CSV template
        const csvContent = "student_number,status,remarks\n2024-0001,present,\n2024-0002,absent,Sick\n2024-0003,late,Traffic";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendance_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const filteredSections = data.section_id 
        ? sections.filter(s => s.id == data.section_id)
        : sections;

    return (
        <AuthenticatedLayout header={<h2 className="text-2xl font-bold leading-tight text-gray-800">Import Attendance</h2>}>
            <Head title="Import Attendance" />
            <div className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-emerald-50/80 to-brand-secondary/5 py-8">
                <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8 xl:px-12">
                    {flash.success && (
                        <div className="pointer-events-none fixed right-6 top-6 z-50 rounded bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">
                            {flash.success}
                        </div>
                    )}

                    {/* Import Instructions */}
                    <div className="card">
                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Import Instructions</h3>
                            <p className="mt-1 text-sm text-gray-600">Follow these steps to import attendance data from a CSV file.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className="h-6 w-6 bg-brand-primary rounded-full flex items-center justify-center">
                                        <span className="text-xs font-medium text-white">1</span>
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-gray-900">Download Template</h4>
                                    <p className="text-sm text-gray-600">Download the CSV template to see the required format.</p>
                                    <button
                                        onClick={downloadTemplate}
                                        className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                                    >
                                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download Template
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className="h-6 w-6 bg-brand-primary rounded-full flex items-center justify-center">
                                        <span className="text-xs font-medium text-white">2</span>
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-gray-900">Prepare Your Data</h4>
                                    <p className="text-sm text-gray-600">Fill in the CSV file with student numbers and attendance status.</p>
                                    <div className="mt-2 text-xs text-gray-500">
                                        <p><strong>Required columns:</strong> student_number, status</p>
                                        <p><strong>Optional columns:</strong> remarks</p>
                                        <p><strong>Status values:</strong> present, late, absent, excused</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className="h-6 w-6 bg-brand-primary rounded-full flex items-center justify-center">
                                        <span className="text-xs font-medium text-white">3</span>
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-gray-900">Upload and Import</h4>
                                    <p className="text-sm text-gray-600">Select the section, date, and upload your CSV file.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Import Form */}
                    <div className="card">
                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Import Attendance Data</h3>
                            <p className="mt-1 text-sm text-gray-600">Upload your CSV file to import attendance records.</p>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">CSV File *</label>
                                <div
                                    className={`mt-1 relative border-2 border-dashed rounded-lg p-6 ${
                                        dragActive
                                            ? 'border-brand-primary bg-brand-primary/5'
                                            : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        accept=".csv,.txt"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                        </svg>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium text-brand-primary">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500">CSV files only, max 2MB</p>
                                        </div>
                                    </div>
                                </div>
                                {selectedFile && (
                                    <div className="mt-2 flex items-center text-sm text-gray-600">
                                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                    </div>
                                )}
                                {errors.file && <p className="mt-1 text-sm text-red-600">{errors.file}</p>}
                            </div>

                            {/* Section Preview */}
                            {data.section_id && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Section Students</h4>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="text-sm text-gray-600">
                                            <p><strong>Section:</strong> {sections.find(s => s.id == data.section_id)?.name}</p>
                                            <p><strong>Students:</strong> {sections.find(s => s.id == data.section_id)?.students?.length || 0} enrolled</p>
                                        </div>
                                        {sections.find(s => s.id == data.section_id)?.students && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-500 mb-1">Student numbers in this section:</p>
                                                <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                                                    {sections.find(s => s.id == data.section_id).students.slice(0, 10).map((student, index) => (
                                                        <span key={index} className="inline-block mr-2 mb-1">
                                                            {student.student_number}
                                                        </span>
                                                    ))}
                                                    {sections.find(s => s.id == data.section_id).students.length > 10 && (
                                                        <span className="text-gray-400">... and {sections.find(s => s.id == data.section_id).students.length - 10} more</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing || !data.file || !data.section_id}
                                    className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                    </svg>
                                    {processing ? 'Importing...' : 'Import Attendance'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* CSV Format Example */}
                    <div className="card">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">CSV Format Example</h3>
                        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-gray-100">
{`student_number,status,remarks
2024-0001,present,
2024-0002,absent,Sick
2024-0003,late,Traffic jam
2024-0004,present,
2024-0005,excused,Medical appointment`}
                            </pre>
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                            <p><strong>Note:</strong> The student_number must match exactly with the student numbers in the selected section.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}