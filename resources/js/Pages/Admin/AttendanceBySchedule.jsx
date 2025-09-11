import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

export default function AttendanceBySchedule({ schedules, students, filters }) {
	const { data, setData, post, processing, errors } = useForm({
		date: new Date().toISOString().slice(0, 10),
		schedule_id: filters.schedule_id || '',
		records: [],
	});

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

	return (
		<AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Attendance by Schedule</h2>}>
			<Head title="Attendance by Schedule" />
			<div className="py-6">
				<div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="card mb-4">
						<form method="get">
							<label className="mr-2">Schedule:</label>
							<select name="schedule_id" defaultValue={filters.schedule_id || ''} className="rounded border px-2 py-1" onChange={(e) => e.currentTarget.form.submit()}>
								<option value="">Select schedule</option>
								{schedules.map((s) => (
									<option key={s.id} value={s.id}>
										{`${s.subject?.name || ''} - ${s.section?.name || ''} (D${s.day_of_week} ${s.time_start} - ${s.time_end})`}
									</option>
								))}
							</select>
						</form>
					</div>

					{filters.schedule_id && (
						<form onSubmit={handleSubmit} className="card">
							<div className="mb-4">
								<label className="mr-2">Date:</label>
								<input type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} className="rounded border px-2 py-1" />
								{errors.date && <div className="text-sm text-red-600">{errors.date}</div>}
								<input type="hidden" value={filters.schedule_id} />
							</div>
							<table className="min-w-full text-left text-sm">
								<thead>
									<tr>
										<th className="px-3 py-2">Student</th>
										<th className="px-3 py-2">Present</th>
										<th className="px-3 py-2">Late</th>
										<th className="px-3 py-2">Absent</th>
										<th className="px-3 py-2">Excused</th>
									</tr>
								</thead>
								<tbody>
									{students.map((st) => (
										<tr key={st.id}>
											<td className="px-3 py-2">{st.last_name}, {st.first_name}</td>
											{['present', 'late', 'absent', 'excused'].map((status) => (
												<td key={status} className="px-3 py-2">
													<input type="radio" name={`st_${st.id}`} onChange={() => onStatusChange(st.id, status)} />
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
							<div className="mt-4">
								<button disabled={processing} className="btn-primary">Save Attendance</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
