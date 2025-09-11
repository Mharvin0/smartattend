import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

export default function AttendanceImport() {
	const { data, setData, post, processing, errors, progress } = useForm({ file: null });

	const submit = (e) => {
		e.preventDefault();
		post(route('admin.attendance.import.store'));
	};

	return (
		<AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Import Attendance (CSV)</h2>}>
			<Head title="Import Attendance" />
			<div className="py-6">
				<div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
					<form onSubmit={submit} className="rounded bg-white p-6 shadow">
						<input type="file" accept=".csv,text/csv" onChange={(e) => setData('file', e.target.files[0])} />
						{errors.file && <div className="text-sm text-red-600">{errors.file}</div>}
						<div className="mt-4">
							<button disabled={processing} className="rounded bg-blue-600 px-4 py-2 text-white">Upload</button>
						</div>
						{progress && <div className="mt-2 text-sm text-gray-600">Uploading... {progress.percentage}%</div>}
						<div className="mt-4 text-sm text-gray-600">
							Expected columns: student_number,date,status,[schedule_id],[remarks]
						</div>
					</form>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
