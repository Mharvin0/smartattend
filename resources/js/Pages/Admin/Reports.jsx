import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

export default function Reports({ summaries, sections, filters }) {
	const onFilterChange = (e) => {
		const form = e.currentTarget.form;
		router.get(route('admin.reports'), {
			section_id: form.section_id.value || '',
			week_start: form.week_start.value || '',
		}, { preserveState: true, replace: true });
	};

	return (
		<AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Reports</h2>}>
			<Head title="Reports" />
			<div className="py-6">
				<div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="card mb-4">
						<form className="flex flex-wrap items-end gap-3">
							<div>
								<label className="block text-sm">Section</label>
								<select name="section_id" defaultValue={filters.section_id || ''} className="rounded border px-2 py-1" onChange={onFilterChange}>
									<option value="">All</option>
									{sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
								</select>
							</div>
							<div>
								<label className="block text-sm">Week Start</label>
								<input type="date" name="week_start" defaultValue={filters.week_start || ''} className="rounded border px-2 py-1" onChange={onFilterChange} />
							</div>
							<div>
								<a className="btn-secondary" href={route('admin.reports.weekly.pdf', filters)}>Export PDF</a>
							</div>
						</form>
					</div>

					<div className="card">
						<table className="min-w-full text-left text-sm">
							<thead><tr><th className="px-3 py-2">Student</th><th className="px-3 py-2">Week</th><th className="px-3 py-2">Present</th><th className="px-3 py-2">Late</th><th className="px-3 py-2">Absent</th><th className="px-3 py-2">Improvement</th></tr></thead>
							<tbody>
								{summaries.data.map((s) => (
									<tr key={s.id}><td className="px-3 py-2">{s.student?.last_name}, {s.student?.first_name}</td><td className="px-3 py-2">{s.week_start} - {s.week_end}</td><td className="px-3 py-2">{s.present_count}</td><td className="px-3 py-2">{s.late_count}</td><td className="px-3 py-2">{s.absent_count}</td><td className="px-3 py-2">{s.improvement_index}</td></tr>
								))}
							</tbody>
						</table>
						<div className="mt-4 flex flex-wrap items-center gap-2">
							{summaries.links.map((l, idx) => (
								<Link key={idx} href={l.url || '#'} className={`rounded px-3 py-1 ${l.active ? 'bg-brand-secondary text-black' : 'bg-gray-100'}`} dangerouslySetInnerHTML={{ __html: l.label }} />
							))}
						</div>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
