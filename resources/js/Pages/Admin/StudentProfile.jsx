import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const statusOptions = ['Normal', 'SLIP', 'PNS'];

export default function StudentProfile({ student, attendance, interventions }) {
	const [showEdit, setShowEdit] = useState(false);
	const [form, setForm] = useState({
		status: student.status || 'Normal',
		absence_count: student.absence_count ?? 0,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		// Ensure absence_count is an integer
		const formData = {
			...form,
			absence_count: parseInt(form.absence_count) || 0,
		};
		router.patch(route('admin.students.update', student.id), formData, {
			onFinish: () => setIsSubmitting(false),
			onSuccess: (page) => {
				setShowEdit(false);
				// Update form state with new values
				setForm({
					status: formData.status || student.status || 'Normal',
					absence_count: formData.absence_count ?? student.absence_count ?? 0,
				});
				// Reload to get updated student data
				router.reload({ only: ['student'] });
			},
			onError: (errors) => {
				console.error('Error updating student:', errors);
				alert('Failed to update student. Please check the form and try again.');
			},
		});
	};

	return (
		<AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{student.last_name}, {student.first_name}</h2>}>
			<Head title={`Student: ${student.last_name}, ${student.first_name}`} />
			<div className="py-6 space-y-4">
				<div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="flex items-center justify-between mb-4">
						<div>
							<p className="text-sm text-gray-600">Student Number: {student.student_id}</p>
							<p className="text-sm text-gray-600">Email: {student.email}</p>
							<p className="text-sm text-gray-600">Status: {form.status}</p>
							<p className="text-sm text-gray-600">Absences: {form.absence_count}</p>
						</div>
						<button
							onClick={() => setShowEdit(true)}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
						>
							Edit
						</button>
					</div>
				</div>

				<div className="mx-auto max-w-7xl grid gap-6 sm:px-6 lg:px-8 md:grid-cols-2">
					<div className="overflow-hidden bg-white p-4 shadow sm:rounded-lg">
						<h3 className="mb-2 font-semibold">Attendance Timeline</h3>
						<ul className="space-y-2">
							{attendance.map((a) => (
								<li key={a.id} className="flex justify-between border-b pb-1 text-sm">
									<span>{a.date}</span>
									<span className="uppercase">{a.status}</span>
								</li>
							))}
						</ul>
					</div>
					<div className="overflow-hidden bg-white p-4 shadow sm:rounded-lg">
						<h3 className="mb-2 font-semibold">Interventions</h3>
						<ul className="space-y-2">
							{interventions.map((i) => (
								<li key={i.id} className="text-sm">
									<div className="font-medium">{i.date} - {i.type}</div>
									<div className="text-gray-600">{i.details}</div>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>

			{showEdit && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
						<h3 className="text-lg font-semibold mb-4">Edit Student</h3>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
								<select
									value={form.status}
									onChange={(e) => setForm({ ...form, status: e.target.value })}
									className="w-full border rounded-lg px-3 py-2"
								>
									{statusOptions.map((s) => (
										<option key={s} value={s}>{s}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Absences</label>
								<input
									type="number"
									min="0"
									value={form.absence_count}
									onChange={(e) => setForm({ ...form, absence_count: Number(e.target.value) })}
									className="w-full border rounded-lg px-3 py-2"
								/>
							</div>
							<div className="flex justify-end space-x-3">
								<button
									type="button"
									onClick={() => setShowEdit(false)}
									className="px-4 py-2 rounded-lg border"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
								>
									{isSubmitting ? 'Saving...' : 'Save'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AuthenticatedLayout>
	);
}
