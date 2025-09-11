import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function AttendanceBySchedule({ schedules, students, filters }) {
	const { data, setData, post, processing, errors } = useForm({
		date: new Date().toISOString().slice(0, 10),
		schedule_id: filters.schedule_id || '',
		records: [],
	});

	const [bulkAction, setBulkAction] = useState('');
	const [selectedStudents, setSelectedStudents] = useState(new Set());

	const handleSubmit = (e) => {
		e.preventDefault();
		post(route('admin.attendance.schedule.store'));
	};

	const onStatusChange = (studentId, status) => {
		setData('records', (prev) => {
			const rest = prev.filter((r) => r.student_id !== studentId);
			return [...rest, { student_id: studentId, status }];
		});
	};

	const handleBulkAction = () => {
		if (!bulkAction) return;
		
		const newRecords = [...data.records];
		selectedStudents.forEach(studentId => {
			const existingIndex = newRecords.findIndex(r => r.student_id === studentId);
			if (existingIndex >= 0) {
				newRecords[existingIndex].status = bulkAction;
			} else {
				newRecords.push({ student_id: studentId, status: bulkAction });
			}
		});
		
		setData('records', newRecords);
		setSelectedStudents(new Set());
		setBulkAction('');
	};

	const toggleStudentSelection = (studentId) => {
		const newSelected = new Set(selectedStudents);
		if (newSelected.has(studentId)) {
			newSelected.delete(studentId);
		} else {
			newSelected.add(studentId);
		}
		setSelectedStudents(newSelected);
	};

	const selectAllStudents = () => {
		if (selectedStudents.size === students.length) {
			setSelectedStudents(new Set());
		} else {
			setSelectedStudents(new Set(students.map(s => s.id)));
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'present': return 'bg-green-100 text-green-800 border-green-200';
			case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'absent': return 'bg-red-100 text-red-800 border-red-200';
			case 'excused': return 'bg-blue-100 text-blue-800 border-blue-200';
			default: return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	};

	const formatTime = (timeString) => {
		if (!timeString) return '-';
		return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	};

	return (
		<AuthenticatedLayout header={<h2 className="text-2xl font-bold leading-tight text-gray-800">Attendance by Schedule</h2>}>
			<Head title="Attendance by Schedule" />
			<div className="min-h-screen py-8">
				<div className="mx-auto max-w-full space-y-10 px-4 sm:px-6 lg:px-8 xl:px-12">
					{/* Schedule Selection */}
					<div className="card p-6">
						<div className="flex items-center gap-4">
							<label className="text-lg font-medium text-gray-700">Select Schedule:</label>
							<form method="get" className="flex-1">
								<select 
									name="schedule_id" 
									defaultValue={filters.schedule_id || ''} 
									className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary text-base py-2.5 px-4 w-full max-w-2xl" 
									onChange={(e) => e.currentTarget.form.submit()}
								>
									<option value="">Choose a schedule...</option>
									{schedules.map((s) => (
										<option key={s.id} value={s.id}>
											{`${s.subject?.name || 'Subject'} - ${s.section?.name || 'Section'} (Day ${s.day_of_week} ${formatTime(s.time_start)} - ${formatTime(s.time_end)})`}
										</option>
									))}
								</select>
							</form>
						</div>
					</div>

					{filters.schedule_id && (
						<form onSubmit={handleSubmit} className="card p-6">
							{/* Schedule Info */}
							{(() => {
								const selectedSchedule = schedules.find(s => s.id == filters.schedule_id);
								return selectedSchedule && (
									<div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
										<h3 className="text-lg font-semibold text-blue-900 mb-2">Schedule Details</h3>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
											<div>
												<span className="font-medium text-blue-800">Subject:</span>
												<span className="ml-2 text-blue-700">{selectedSchedule.subject?.name}</span>
											</div>
											<div>
												<span className="font-medium text-blue-800">Section:</span>
												<span className="ml-2 text-blue-700">{selectedSchedule.section?.name}</span>
											</div>
											<div>
												<span className="font-medium text-blue-800">Time:</span>
												<span className="ml-2 text-blue-700">
													Day {selectedSchedule.day_of_week} • {formatTime(selectedSchedule.time_start)} - {formatTime(selectedSchedule.time_end)}
												</span>
											</div>
										</div>
									</div>
								);
							})()}

							{/* Date Selection */}
							<div className="mb-6 flex items-center gap-4">
								<label className="text-lg font-medium text-gray-700">Date:</label>
								<input 
									type="date" 
									value={data.date} 
									onChange={(e) => setData('date', e.target.value)} 
									className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary text-base py-2.5 px-4" 
								/>
								{errors.date && <div className="text-sm text-red-600">{errors.date}</div>}
								<input type="hidden" value={filters.schedule_id} />
							</div>

							{/* Bulk Actions */}
							{students.length > 0 && (
								<div className="mb-6 p-4 bg-gray-50 rounded-lg">
									<div className="flex items-center gap-4">
										<button
											type="button"
											onClick={selectAllStudents}
											className="text-sm font-medium text-brand-primary hover:text-brand-primary/80"
										>
											{selectedStudents.size === students.length ? 'Deselect All' : 'Select All'}
										</button>
										<span className="text-sm text-gray-500">
											{selectedStudents.size} of {students.length} selected
										</span>
										{selectedStudents.size > 0 && (
											<>
												<select
													value={bulkAction}
													onChange={(e) => setBulkAction(e.target.value)}
													className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary text-sm py-2 px-3"
												>
													<option value="">Bulk Action</option>
													<option value="present">Mark as Present</option>
													<option value="late">Mark as Late</option>
													<option value="absent">Mark as Absent</option>
													<option value="excused">Mark as Excused</option>
												</select>
												<button
													type="button"
													onClick={handleBulkAction}
													disabled={!bulkAction}
													className="btn-primary text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
												>
													Apply
												</button>
											</>
										)}
									</div>
								</div>
							)}

							{/* Attendance Table */}
							<div className="overflow-x-auto">
								<table className="min-w-full text-left text-sm">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-4 py-3 font-semibold text-gray-900">Student</th>
											<th className="px-4 py-3 font-semibold text-gray-900">Student Number</th>
											<th className="px-4 py-3 font-semibold text-gray-900">Present</th>
											<th className="px-4 py-3 font-semibold text-gray-900">Late</th>
											<th className="px-4 py-3 font-semibold text-gray-900">Absent</th>
											<th className="px-4 py-3 font-semibold text-gray-900">Excused</th>
											<th className="px-4 py-3 font-semibold text-gray-900">Current Status</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{students.map((st) => {
											const currentRecord = data.records.find(r => r.student_id === st.id);
											return (
												<tr key={st.id} className="hover:bg-gray-50">
													<td className="px-4 py-3">
														<div className="flex items-center gap-3">
															<input
																type="checkbox"
																checked={selectedStudents.has(st.id)}
																onChange={() => toggleStudentSelection(st.id)}
																className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
															/>
															<div>
																<div className="font-medium text-gray-900">{st.last_name}, {st.first_name}</div>
															</div>
														</div>
													</td>
													<td className="px-4 py-3 text-gray-600">{st.student_number}</td>
													{['present', 'late', 'absent', 'excused'].map((status) => (
														<td key={status} className="px-4 py-3">
															<input 
																type="radio" 
																name={`st_${st.id}`} 
																checked={currentRecord?.status === status}
																onChange={() => onStatusChange(st.id, status)}
																className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300"
															/>
														</td>
													))}
													<td className="px-4 py-3">
														{currentRecord?.status && (
															<span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${getStatusColor(currentRecord.status)}`}>
																{currentRecord.status.toUpperCase()}
															</span>
														)}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>

							{/* Submit Button */}
							<div className="mt-6 flex items-center justify-between">
								<div className="text-sm text-gray-500">
									{data.records.length} of {students.length} students marked
								</div>
								<button 
									disabled={processing || data.records.length === 0} 
									className="btn-primary text-base px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{processing ? 'Saving...' : 'Save Attendance'}
								</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
