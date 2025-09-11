import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function StudentProfile({ student, attendance, interventions }) {
	return (
		<AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{student.last_name}, {student.first_name}</h2>}>
			<Head title={`Student: ${student.last_name}, ${student.first_name}`} />
			<div className="py-6">
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
		</AuthenticatedLayout>
	);
}
