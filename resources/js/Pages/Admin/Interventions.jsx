import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Interventions({ interventions, students, filters }) {
	const { data, setData, post, processing, reset } = useForm({
		student_id: '', date: new Date().toISOString().slice(0,10), type: '', details: '', action_taken: '', responsible_staff: '', follow_up_date: '', outcome: ''
	});

	const submit = (e) => { e.preventDefault(); post(route('admin.interventions.store'), { onSuccess: () => reset() }); };

	return (
		<AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">CSDL Interventions</h2>}>
			<Head title="Interventions" />
			<div className="py-6">
				<div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
					<div className="card">
						<form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-3">
							<select className="rounded border px-2 py-1" value={data.student_id} onChange={(e) => setData('student_id', e.target.value)}>
								<option value="">Student</option>
								{students.map((s) => <option key={s.id} value={s.id}>{s.last_name}, {s.first_name}</option>)}
							</select>
							<input className="rounded border px-2 py-1" type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} />
							<input className="rounded border px-2 py-1" placeholder="Type" value={data.type} onChange={(e) => setData('type', e.target.value)} />
							<input className="rounded border px-2 py-1 md:col-span-3" placeholder="Details" value={data.details} onChange={(e) => setData('details', e.target.value)} />
							<input className="rounded border px-2 py-1 md:col-span-3" placeholder="Action Taken" value={data.action_taken} onChange={(e) => setData('action_taken', e.target.value)} />
							<input className="rounded border px-2 py-1" placeholder="Responsible Staff" value={data.responsible_staff} onChange={(e) => setData('responsible_staff', e.target.value)} />
							<input className="rounded border px-2 py-1" type="date" placeholder="Follow-up Date" value={data.follow_up_date || ''} onChange={(e) => setData('follow_up_date', e.target.value)} />
							<input className="rounded border px-2 py-1" placeholder="Outcome" value={data.outcome} onChange={(e) => setData('outcome', e.target.value)} />
							<div className="md:col-span-3"><button className="btn-primary" disabled={processing}>Add Intervention</button></div>
						</form>
					</div>

					<div className="card">
						<table className="min-w-full text-left text-sm">
							<thead>
								<tr>
									<th className="px-3 py-2">Student</th>
									<th className="px-3 py-2">Date</th>
									<th className="px-3 py-2">Type</th>
									<th className="px-3 py-2">Outcome</th>
									<th className="px-3 py-2 text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{interventions.data.map((i) => (
									<tr key={i.id}>
										<td className="px-3 py-2">{i.student?.last_name}, {i.student?.first_name}</td>
										<td className="px-3 py-2">{i.date}</td>
										<td className="px-3 py-2">{i.type}</td>
										<td className="px-3 py-2">{i.outcome}</td>
										<td className="px-3 py-2 text-right">
											<Link as="button" method="delete" href={route('admin.interventions.destroy', i.id)} className="btn-secondary">Delete</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						<div className="mt-4 flex flex-wrap items-center gap-2">
							{interventions.links.map((l, idx) => (
								<Link key={idx} href={l.url || '#'} className={`rounded px-3 py-1 ${l.active ? 'bg-brand-secondary text-black' : 'bg-gray-100'}`} dangerouslySetInnerHTML={{ __html: l.label }} />
							))}
						</div>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
