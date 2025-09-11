import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';

export default function Attendance() {
	return (
		<AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Attendance</h2>}>
			<Head title="Attendance" />
			<div className="py-6">
				<div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<h3 className="text-lg font-medium text-gray-900">Record Attendance</h3>
							<p className="mt-1 text-sm text-gray-600">Record daily attendance by section or schedule, or import from CSV.</p>
						</div>
						<div className="flex flex-wrap gap-3">
							<Link className="btn-primary inline-flex items-center gap-2" href={route('admin.attendance.section')}>
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
								By Section
							</Link>
							<Link className="btn-primary inline-flex items-center gap-2" href={route('admin.attendance.schedule')}>
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								By Schedule
							</Link>
							<Link className="btn-secondary inline-flex items-center gap-2" href={route('admin.attendance.import')}>
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
								</svg>
								Import CSV
							</Link>
						</div>
					</div>

					<div className="card">
						<div className="mb-6 flex items-center justify-between">
							<h3 className="text-lg font-medium text-gray-900">Recent Records</h3>
							<div className="flex items-center gap-4">
								<div className="relative">
									<input type="text" className="rounded-lg border-gray-300 pl-10 pr-4 focus:border-brand-primary focus:ring-brand-primary sm:text-sm" placeholder="Search..." />
									<svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
								</div>
								<select className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary sm:text-sm">
									<option>All Sections</option>
									<option>Section A</option>
									<option>Section B</option>
								</select>
							</div>
						</div>

						<DataTable
							columns={[
								{ key: 'date', label: 'Date' },
								{ key: 'student', label: 'Student', render: (_, row) => (
									<div>
										<div className="font-medium">{row.student?.name || 'Student Name'}</div>
										<div className="text-sm text-gray-500">{row.student?.section || 'Section'}</div>
									</div>
								)},
								{ key: 'status', label: 'Status', render: (status) => (
									<span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
										status === 'present' ? 'bg-green-100 text-green-800' :
										status === 'late' ? 'bg-yellow-100 text-yellow-800' :
										'bg-red-100 text-red-800'
									}`}>
										{status?.toUpperCase()}
									</span>
								)},
								{ key: 'time', label: 'Time' },
								{ key: 'recorded_by', label: 'Recorded By' },
							]}
							data={[
								{ date: '2025-09-11', student: { name: 'John Doe', section: 'Section A' }, status: 'present', time: '08:00 AM', recorded_by: 'Teacher A' },
								{ date: '2025-09-11', student: { name: 'Jane Smith', section: 'Section B' }, status: 'late', time: '08:30 AM', recorded_by: 'Teacher B' },
							]}
						/>

						<div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
							<p className="text-sm text-gray-700">Showing 1 to 10 of 50 entries</p>
							<div className="flex gap-2">
								<button className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">Previous</button>
								<button className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">Next</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}