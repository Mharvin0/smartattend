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
		<AuthenticatedLayout header={<h2 className="text-2xl font-bold leading-tight text-gray-800">Reports</h2>}>
			<Head title="Reports" />
			<div className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-emerald-50/80 to-brand-secondary/5 py-8">
				<div className="mx-auto max-w-full space-y-10 px-4 sm:px-6 lg:px-8 xl:px-12">
					{/* Hero Section */}
					<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-10 text-white">
						<div className="absolute inset-0 bg-black/10"></div>
						<div className="relative">
							<div className="flex items-center justify-between">
								<div>
									<h1 className="text-4xl font-bold mb-4">Attendance Reports</h1>
									<p className="text-xl text-green-100 mb-6">Generate comprehensive reports and analytics for student attendance</p>
									<div className="flex items-center gap-6">
										<div className="flex items-center gap-3">
											<div className="h-3 w-3 bg-green-400 rounded-full"></div>
											<span className="text-green-100">Real-time data</span>
										</div>
										<div className="flex items-center gap-3">
											<div className="h-3 w-3 bg-yellow-400 rounded-full"></div>
											<span className="text-green-100">Export options</span>
										</div>
										<div className="flex items-center gap-3">
											<div className="h-3 w-3 bg-blue-400 rounded-full"></div>
											<span className="text-green-100">Custom filters</span>
										</div>
									</div>
								</div>
								<div className="hidden lg:block">
									<div className="h-32 w-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
										<svg className="h-16 w-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Filters and Actions */}
					<div className="card p-8">
						<div className="mb-6">
							<h3 className="text-2xl font-bold text-gray-900 mb-2">Report Filters</h3>
							<p className="text-lg text-gray-600">Customize your report by selecting specific sections and date ranges</p>
						</div>
						<form className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
							<div>
								<label className="block text-lg font-medium text-gray-700 mb-2">Section</label>
								<select name="section_id" defaultValue={filters.section_id || ''} className="w-full rounded-lg border-gray-300 px-4 py-3 text-lg focus:border-brand-primary focus:ring-brand-primary" onChange={onFilterChange}>
									<option value="">All Sections</option>
									{sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
								</select>
							</div>
							<div>
								<label className="block text-lg font-medium text-gray-700 mb-2">Week Start</label>
								<input type="date" name="week_start" defaultValue={filters.week_start || ''} className="w-full rounded-lg border-gray-300 px-4 py-3 text-lg focus:border-brand-primary focus:ring-brand-primary" onChange={onFilterChange} />
							</div>
							<div>
								<label className="block text-lg font-medium text-gray-700 mb-2">Export Format</label>
								<select className="w-full rounded-lg border-gray-300 px-4 py-3 text-lg focus:border-brand-primary focus:ring-brand-primary">
									<option value="pdf">PDF Report</option>
									<option value="excel">Excel Spreadsheet</option>
									<option value="csv">CSV Data</option>
								</select>
							</div>
							<div>
								<label className="block text-lg font-medium text-gray-700 mb-2">Report Type</label>
								<select className="w-full rounded-lg border-gray-300 px-4 py-3 text-lg focus:border-brand-primary focus:ring-brand-primary">
									<option value="weekly">Weekly Summary</option>
									<option value="monthly">Monthly Report</option>
									<option value="semester">Semester Overview</option>
								</select>
							</div>
							<div>
								<label className="block text-lg font-medium text-gray-700 mb-2">Actions</label>
								<div className="flex gap-3">
									<a
										className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
										href={route('admin.reports.weekly.pdf', filters)}
									>
										<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
										Export
									</a>
								</div>
							</div>
							<div>
								<label className="block text-lg font-medium text-gray-700 mb-2">Quick Actions</label>
								<div className="flex gap-3">
									<button type="button" className="btn-secondary text-lg px-6 py-3">
										<svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
										</svg>
										Refresh
									</button>
								</div>
							</div>
						</form>
					</div>

					{/* Report Data */}
					<div className="card p-8">
						<div className="mb-8">
							<h3 className="text-2xl font-bold text-gray-900 mb-2">Attendance Summary</h3>
							<p className="text-lg text-gray-600">Detailed attendance data for selected filters</p>
						</div>
						
						<div className="overflow-x-auto">
							<table className="min-w-full text-left text-lg">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-4 font-semibold text-gray-900">Student</th>
										<th className="px-6 py-4 font-semibold text-gray-900">Week Period</th>
										<th className="px-6 py-4 font-semibold text-gray-900">Present</th>
										<th className="px-6 py-4 font-semibold text-gray-900">Late</th>
										<th className="px-6 py-4 font-semibold text-gray-900">Absent</th>
										<th className="px-6 py-4 font-semibold text-gray-900">Improvement</th>
										<th className="px-6 py-4 font-semibold text-gray-900">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{summaries.data.map((s) => (
										<tr key={s.id} className="hover:bg-gray-50">
											<td className="px-6 py-4">
												<div className="font-medium text-gray-900">{s.student?.last_name}, {s.student?.first_name}</div>
												<div className="text-sm text-gray-500">{s.student?.student_number}</div>
											</td>
											<td className="px-6 py-4 text-gray-900">{s.week_start} - {s.week_end}</td>
											<td className="px-6 py-4">
												<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
													{s.present_count}
												</span>
											</td>
											<td className="px-6 py-4">
												<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
													{s.late_count}
												</span>
											</td>
											<td className="px-6 py-4">
												<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
													{s.absent_count}
												</span>
											</td>
											<td className="px-6 py-4">
												<span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
													s.improvement_index > 0 ? 'bg-green-100 text-green-800' : 
													s.improvement_index < 0 ? 'bg-red-100 text-red-800' : 
													'bg-gray-100 text-gray-800'
												}`}>
													{s.improvement_index > 0 ? '+' : ''}{s.improvement_index}
												</span>
											</td>
											<td className="px-6 py-4">
												<span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
													s.present_count >= 4 ? 'bg-green-100 text-green-800' : 
													s.absent_count >= 2 ? 'bg-red-100 text-red-800' : 
													'bg-yellow-100 text-yellow-800'
												}`}>
													{s.present_count >= 4 ? 'Good' : s.absent_count >= 2 ? 'At Risk' : 'Fair'}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						
						<div className="mt-8 flex flex-wrap items-center justify-between gap-4">
							<div className="text-lg text-gray-700">
								Showing {summaries.data.length} records
							</div>
							<div className="flex flex-wrap items-center gap-2">
								{summaries.links.map((l, idx) => (
									<Link key={idx} href={l.url || '#'} className={`rounded-lg px-4 py-2 text-lg font-medium transition-colors ${
										l.active ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`} dangerouslySetInnerHTML={{ __html: l.label }} />
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
