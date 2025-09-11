import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function SectionsImport({ departments, programs }) {
	const { data, setData, post, processing, errors, reset } = useForm({ file: null });

	const submit = (e) => {
		e.preventDefault();
		post(route('admin.sections.import.store'), {
			onSuccess: () => reset(),
		});
	};

	const downloadTemplate = () => {
		const headers = [
			'section_name','year_level','adviser_name','program','department','semester','academic_year',
			'student_number','first_name','last_name','middle_name','birth_date','gender','guardian_name','guardian_contact'
		];
		const csv = headers.join(',') + '\n';
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'sections_import_template.csv';
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<AuthenticatedLayout header={<h2 className="text-2xl font-bold leading-tight text-gray-800">Import Sections & Students</h2>}>
			<Head title="Import Sections" />
			<div className="min-h-screen py-8">
				<div className="mx-auto max-w-full space-y-10 px-4 sm:px-6 lg:px-8 xl:px-12">
					{/* Hero Section */}
					<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-8 text-white">
						<div className="absolute inset-0 bg-black/10"></div>
						<div className="relative">
							<div className="flex items-center gap-4 mb-4">
								<div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
									<svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
								</div>
								<div>
									<h3 className="text-3xl font-bold">Import Sections & Students</h3>
									<p className="text-purple-100 text-lg">Bulk import sections with their students and complete information</p>
								</div>
							</div>
						</div>
					</div>

					<div className="card p-8">
						<div className="mb-8">
							<h4 className="text-2xl font-semibold text-gray-900 mb-3">Upload CSV File</h4>
							<p className="text-lg text-gray-600">
								Upload a CSV file to create sections and add students to them. The first row should contain section details, 
								and subsequent rows should contain student information.
							</p>
						</div>
						
						<div className="mb-8 p-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 shadow-sm">
							<div className="flex items-center gap-4 mb-6">
								<div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
									<svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								<div>
									<h4 className="text-xl font-bold text-purple-900">CSV Template</h4>
									<p className="text-purple-700 text-lg">Download the template with proper formatting</p>
								</div>
							</div>
							<button 
								type="button" 
								onClick={downloadTemplate}
								className="inline-flex items-center gap-3 text-lg px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
							>
								<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								Download CSV Template
							</button>
						</div>

						<div className="mb-8 p-8 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-200 shadow-sm">
							<div className="flex items-center gap-4 mb-6">
								<div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
									<svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
									</svg>
								</div>
								<div>
									<h4 className="text-xl font-bold text-gray-900">Required CSV Columns</h4>
									<p className="text-gray-600 text-lg">All section and student information is required</p>
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
								<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
									<h5 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
										<span className="h-2 w-2 bg-red-500 rounded-full"></span>
										Section Information
									</h5>
									<ul className="space-y-2 text-base text-gray-700">
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
											<span className="font-medium">section_name</span>
											<span className="text-red-600 text-sm">(required)</span>
										</li>
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
											<span className="font-medium">year_level</span>
											<span className="text-red-600 text-sm">(required)</span>
										</li>
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
											<span className="font-medium">adviser_name</span>
											<span className="text-red-600 text-sm">(required)</span>
										</li>
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
											<span className="font-medium">program</span>
											<span className="text-red-600 text-sm">(required)</span>
										</li>
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
											<span className="font-medium">department</span>
											<span className="text-red-600 text-sm">(required)</span>
										</li>
									</ul>
								</div>
								<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
									<h5 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
										<span className="h-2 w-2 bg-orange-500 rounded-full"></span>
										Additional Section Fields
									</h5>
									<ul className="space-y-2 text-base text-gray-700">
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
											<span className="font-medium">semester</span>
											<span className="text-red-600 text-sm">(required)</span>
										</li>
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
											<span className="font-medium">academic_year</span>
											<span className="text-red-600 text-sm">(required)</span>
										</li>
									</ul>
								</div>
								<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
									<h5 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
										<span className="h-2 w-2 bg-green-500 rounded-full"></span>
										Student Information
									</h5>
									<ul className="space-y-2 text-base text-gray-700">
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
											<span className="font-medium">student_number</span>
											<span className="text-red-600 text-sm">(required)</span>
										</li>
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
											<span className="font-medium">first_name</span>
											<span className="text-red-600 text-sm">(required)</span>
										</li>
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
											<span className="font-medium">last_name</span>
											<span className="text-red-600 text-sm">(required)</span>
										</li>
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
											<span className="font-medium">birth_date</span>
											<span className="text-red-600 text-sm">(required)</span>
										</li>
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
											<span className="font-medium">gender</span>
											<span className="text-red-600 text-sm">(required)</span>
										</li>
									</ul>
								</div>
							</div>
						</div>

						{programs && (
							<div className="mb-8 p-8 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 shadow-sm">
								<div className="flex items-center gap-4 mb-6">
									<div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
										<svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
										</svg>
									</div>
									<div>
										<h4 className="text-xl font-bold text-amber-900">Available Departments & Programs</h4>
										<p className="text-amber-700 text-lg">Reference for valid department and program values</p>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
									{Object.entries(programs).map(([department, deptPrograms]) => (
										<div key={department} className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
											<h5 className="font-bold text-amber-900 mb-4 text-lg">{department}</h5>
											<ul className="space-y-2 text-sm text-amber-800">
												{Object.entries(deptPrograms).slice(0, 4).map(([code, name]) => (
													<li key={code} className="flex items-start gap-2">
														<span className="h-1.5 w-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></span>
														<span><span className="font-medium">{code}</span> - {name}</span>
													</li>
												))}
												{Object.keys(deptPrograms).length > 4 && (
													<li className="text-amber-600 font-medium">... and {Object.keys(deptPrograms).length - 4} more programs</li>
												)}
											</ul>
										</div>
									))}
								</div>
							</div>
						)}

						<div className="p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-sm">
							<div className="flex items-center gap-4 mb-6">
								<div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
									<svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
									</svg>
								</div>
								<div>
									<h4 className="text-xl font-bold text-green-900">Upload & Import</h4>
									<p className="text-green-700 text-lg">Select your CSV file and import sections with students</p>
								</div>
							</div>
							
							<form onSubmit={submit} className="space-y-6">
								<div>
									<label htmlFor="file" className="block text-lg font-medium text-gray-700 mb-4">CSV File</label>
									<div className="relative">
										<input
											id="file"
											type="file"
											accept=".csv,.txt"
											className="block w-full text-lg text-gray-500 file:mr-6 file:py-4 file:px-8 file:rounded-xl file:border-0 file:text-lg file:font-semibold file:bg-gradient-to-r file:from-green-500 file:to-green-600 file:text-white hover:file:from-green-600 hover:file:to-green-700 transition-all duration-200"
											onChange={(e) => setData('file', e.target.files?.[0] || null)}
										/>
									</div>
									{errors.file && <div className="text-lg text-red-600 mt-3 p-3 bg-red-50 rounded-lg border border-red-200">{errors.file}</div>}
								</div>
								
								<div className="flex items-center gap-6">
									<button 
										type="submit" 
										disabled={processing || !data.file} 
										className="inline-flex items-center gap-3 text-xl px-10 py-5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
									>
										{processing ? (
											<>
												<svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												Uploading...
											</>
										) : (
											<>
												<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
												</svg>
												Upload & Import
											</>
										)}
									</button>
									<Link 
										href={route('admin.sections')} 
										className="inline-flex items-center gap-3 text-xl px-10 py-5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
									>
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
										Cancel
									</Link>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}


