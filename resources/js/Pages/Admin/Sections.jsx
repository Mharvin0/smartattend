import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';

export default function Sections({ sections, programs, yearLevels, semesters }) {
	const { data, setData, post, processing } = useForm({
		name: '',
		year_level: '',
		adviser_name: '',
		program: '',
		semester: '',
		academic_year: new Date().getFullYear().toString(),
	});
	const flash = usePage().props.flash || {};

	const submit = (e) => { e.preventDefault(); post(route('admin.sections')); };

	return (
		<AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Sections</h2>}>
			<Head title="Sections" />
			<div className="py-6">
				<div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
					{flash.success && (
						<div className="pointer-events-none fixed right-6 top-6 z-50 rounded bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">{flash.success}</div>
					)}

					<div className="card">
						<div className="mb-6">
							<h3 className="text-lg font-medium text-gray-900">Add New Section</h3>
							<p className="mt-1 text-sm text-gray-600">Create a new university section with program and year level information.</p>
						</div>

						<form onSubmit={submit} className="grid grid-cols-1 gap-6 md:grid-cols-3">
							<div>
								<label className="block text-sm font-medium text-gray-700">Program</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.program}
									onChange={(e) => setData('program', e.target.value)}
								>
									<option value="">Select Program</option>
									{Object.entries(programs).map(([code, name]) => (
										<option key={code} value={code}>{code} - {name}</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Year Level</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.year_level}
									onChange={(e) => setData('year_level', e.target.value)}
								>
									<option value="">Select Year Level</option>
									{yearLevels.map((year) => (
										<option key={year} value={year}>{year}</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Section Name</label>
								<input
									type="text"
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									placeholder="e.g. A"
									value={data.name}
									onChange={(e) => setData('name', e.target.value)}
								/>
								<p className="mt-1 text-xs text-gray-500">Will be combined with program and year (e.g. BSIT-1A)</p>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Semester</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.semester}
									onChange={(e) => setData('semester', e.target.value)}
								>
									<option value="">Select Semester</option>
									{semesters.map((sem) => (
										<option key={sem} value={sem}>{sem}</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Academic Year</label>
								<input
									type="text"
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									placeholder="e.g. 2025-2026"
									value={data.academic_year}
									onChange={(e) => setData('academic_year', e.target.value)}
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Adviser Name</label>
								<input
									type="text"
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									placeholder="e.g. Prof. John Smith"
									value={data.adviser_name}
									onChange={(e) => setData('adviser_name', e.target.value)}
								/>
							</div>

							<div className="md:col-span-3">
								<button disabled={processing} className="btn-primary inline-flex items-center gap-2">
									<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
									</svg>
									Create Section
								</button>
							</div>
						</form>
					</div>

					<div className="card">
						<div className="mb-6 flex items-center justify-between">
							<div>
								<h3 className="text-lg font-medium text-gray-900">All Sections</h3>
								<p className="mt-1 text-sm text-gray-600">Manage and view all university sections.</p>
							</div>
							<div className="flex items-center gap-4">
								<select className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary sm:text-sm">
									<option value="">All Programs</option>
									{Object.entries(programs).map(([code, name]) => (
										<option key={code} value={code}>{code}</option>
									))}
								</select>
								<select className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary sm:text-sm">
									<option value="">All Year Levels</option>
									{yearLevels.map((year) => (
										<option key={year} value={year}>{year}</option>
									))}
								</select>
								<select className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary sm:text-sm">
									<option value="">All Semesters</option>
									{semesters.map((sem) => (
										<option key={sem} value={sem}>{sem}</option>
									))}
								</select>
								<div className="relative">
									<input type="text" className="rounded-lg border-gray-300 pl-10 pr-4 focus:border-brand-primary focus:ring-brand-primary sm:text-sm" placeholder="Search sections..." />
									<svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
								</div>
							</div>
						</div>

						<DataTable
							columns={[
								{ 
									key: 'name',
									label: 'Section',
									render: (_, row) => (
										<div>
											<div className="font-medium text-gray-900">{row.program}-{row.year_level} {row.name}</div>
											<div className="text-sm text-gray-500">{row.academic_year} • {row.semester}</div>
										</div>
									)
								},
								{ key: 'program', label: 'Program' },
								{ key: 'year_level', label: 'Year Level' },
								{ key: 'adviser_name', label: 'Adviser' },
								{ 
									key: 'students_count', 
									label: 'Students',
									render: (count) => (
										<span className="inline-flex items-center rounded-full bg-brand-primary bg-opacity-10 px-2.5 py-0.5 text-sm font-medium text-brand-primary">
											{count || 0} students
										</span>
									)
								},
							]}
							data={sections}
							actions={true}
						/>

						<div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
							<p className="text-sm text-gray-700">
								Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
								<span className="font-medium">{sections.length}</span> sections
							</p>
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