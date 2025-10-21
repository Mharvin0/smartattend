import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';

export default function Subjects({ subjects, sections }) {
	const { data, setData, post, processing } = useForm({ code: '', name: '', section_id: '' });
	const flash = usePage().props.flash || {};
	const submit = (e) => { e.preventDefault(); post(route('admin.subjects')); };

	return (
		<AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Subjects</h2>}>
			<Head title="Subjects" />
			<div className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-emerald-50/80 to-brand-secondary/5 py-8">
				<div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
					{flash.success && (
						<div className="pointer-events-none fixed right-6 top-6 z-50 rounded bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">{flash.success}</div>
					)}

					<div className="card">
						<div className="mb-6">
							<h3 className="text-lg font-medium text-gray-900">Add New Subject</h3>
							<p className="mt-1 text-sm text-gray-600">Create a new subject and assign it to a section.</p>
						</div>

						<form onSubmit={submit} className="grid grid-cols-1 gap-6 md:grid-cols-3">
							<div>
								<label className="block text-sm font-medium text-gray-700">Subject Code</label>
								<input
									type="text"
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									placeholder="e.g. MATH101"
									value={data.code}
									onChange={(e) => setData('code', e.target.value)}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Subject Name</label>
								<input
									type="text"
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									placeholder="e.g. Mathematics"
									value={data.name}
									onChange={(e) => setData('name', e.target.value)}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Section</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.section_id}
									onChange={(e) => setData('section_id', e.target.value)}
								>
									<option value="">Select Section</option>
									{sections.map((s) => (
										<option key={s.id} value={s.id}>{s.name}</option>
									))}
								</select>
							</div>
							<div className="md:col-span-3">
								<button disabled={processing} className="btn-primary inline-flex items-center gap-2">
									<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
									</svg>
									Create Subject
								</button>
							</div>
						</form>
					</div>

					<div className="card">
						<div className="mb-6 flex items-center justify-between">
							<div>
								<h3 className="text-lg font-medium text-gray-900">All Subjects</h3>
								<p className="mt-1 text-sm text-gray-600">Manage and view all subjects.</p>
							</div>
							<div className="flex items-center gap-4">
								<select className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary sm:text-sm">
									<option value="">All Sections</option>
									{sections.map((s) => (
										<option key={s.id} value={s.id}>{s.name}</option>
									))}
								</select>
								<div className="relative">
									<input type="text" className="rounded-lg border-gray-300 pl-10 pr-4 focus:border-brand-primary focus:ring-brand-primary sm:text-sm" placeholder="Search subjects..." />
									<svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
								</div>
							</div>
						</div>

						<DataTable
							columns={[
								{ key: 'code', label: 'Code' },
								{ key: 'name', label: 'Subject Name' },
								{ 
									key: 'section', 
									label: 'Section',
									render: (section) => (
										<span className="inline-flex items-center rounded-full bg-brand-primary bg-opacity-10 px-2.5 py-0.5 text-sm font-medium text-brand-primary">
											{section?.name || 'Unassigned'}
										</span>
									)
								},
							]}
							data={subjects}
							actions={true}
						/>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}