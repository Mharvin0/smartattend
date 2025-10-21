import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AttendanceBySection({ sections, students, filters }) {
	const { data, setData, post, processing, errors } = useForm({
		date: new Date().toISOString().slice(0, 10),
		records: [],
	});

	const [bulkAction, setBulkAction] = useState('');
	const [selectedStudents, setSelectedStudents] = useState(new Set());

	const handleSubmit = (e) => {
		e.preventDefault();
		post(route('admin.attendance.section.store'));
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

	return (
		<AuthenticatedLayout header={<h2 className="text-2xl font-bold leading-tight text-gray-800">Attendance by Section</h2>}>
			<Head title="Attendance by Section" />
			<div className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-emerald-50/80 to-brand-secondary/5 py-8">
				<div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
					{/* Section Selection */}
					<div className="card p-6">
						<div className="flex items-center gap-4">
							<label className="text-lg font-medium text-gray-700">Select Section:</label>
							<form method="get" className="flex-1">
								<select 
									name="section_id" 
									defaultValue={filters.section_id || ''} 
									className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary text-base py-2.5 px-4 w-full max-w-md" 
									onChange={(e) => e.currentTarget.form.submit()}
								>
									<option value="">Choose a section...</option>
									{sections.map((s) => (
										<option key={s.id} value={s.id}>{s.name}</option>
									))}
								</select>
							</form>
						</div>
					</div>

					{filters.section_id && (
						<form onSubmit={handleSubmit} className="card p-6">
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
