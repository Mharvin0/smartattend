import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Sections({ sections, programs, programsList, yearLevels, semesters, departments = [], teachers = [] }) {
	const { data, setData, post, processing } = useForm({
		name: '',
		year_level: '',
		adviser_name: '',
		adviser_id: '',
		program: '',
		department: '',
		program_id: '',
		department_id: '',
		semester: '',
		academic_year: new Date().getFullYear().toString(),
	});
	const flash = usePage().props.flash || {};
	
	// Modal state
	const [showModal, setShowModal] = useState(false);
	const [selectedSection, setSelectedSection] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [editData, setEditData] = useState({});

	const submit = (e) => { e.preventDefault(); post(route('admin.sections')); };

	// Get available programs based on selected department
	const availablePrograms = data.department && programs[data.department] ? programs[data.department] : {};

	// Reset program when department changes
	const handleDepartmentChange = (departmentName) => {
		setData('department', departmentName);
		setData('program', ''); // Reset program selection
		setData('program_id', ''); // Reset program ID
		
		// Find department ID
		const departmentObj = departments.find(d => d.name === departmentName);
		setData('department_id', departmentObj?.id || '');
	};

	// Handle view section
	const handleViewSection = async (sectionId) => {
		setIsLoading(true);
		try {
			const response = await fetch(route('admin.sections.show', sectionId));
			const data = await response.json();
			setSelectedSection(data.section);
			setShowModal(true);
		} catch (error) {
			console.error('Error fetching section:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Handle edit section
	const handleEditSection = async (sectionId) => {
		setIsLoading(true);
		try {
			const response = await fetch(route('admin.sections.show', sectionId));
			const data = await response.json();
			setSelectedSection(data.section);
			setShowModal(true);
		} catch (error) {
			console.error('Error fetching section:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Handle edit mode
	const handleEditMode = () => {
		setIsEditMode(true);
		setEditData({
			name: selectedSection.name,
			year_level: selectedSection.year_level,
			adviser_name: selectedSection.adviser_name,
			program: selectedSection.program?.name || selectedSection.program || '',
			department: selectedSection.department?.name || selectedSection.department || '',
			semester: selectedSection.semester,
			academic_year: selectedSection.academic_year,
			program_id: selectedSection.program_id || '',
			department_id: selectedSection.department_id || ''
		});
	};

	// Handle save edit
	const handleSaveEdit = async () => {
		setIsLoading(true);
		try {
			const response = await fetch(route('admin.sections.update', selectedSection.id), {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
				},
				body: JSON.stringify(editData)
			});

			if (response.ok) {
				setIsEditMode(false);
				setEditData({});
				// Refresh the page to show updated data
				router.reload();
			}
		} catch (error) {
			console.error('Error updating section:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Handle delete section
	const handleDeleteSection = async (section) => {
		if (confirm(`Are you sure you want to delete section "${section.name}"? This action cannot be undone.`)) {
			setIsLoading(true);
			try {
				router.delete(route('admin.sections.destroy', section.id), {
					onSuccess: () => {
						setIsLoading(false);
					},
					onError: () => {
						setIsLoading(false);
					}
				});
			} catch (error) {
				setIsLoading(false);
				console.error('Error deleting section:', error);
			}
		}
	};

	// Close modal
	const closeModal = () => {
		setShowModal(false);
		setSelectedSection(null);
		setIsEditMode(false);
		setEditData({});
	};

	return (
		<AuthenticatedLayout>
			<Head title="Sections" />
			<div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-zinc-50/70 py-8">
				<div className="w-full px-6 py-8 space-y-6">
					{/* Header */}
					<div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
									Sections
								</h2>
								<p className="text-gray-600 mt-2 text-lg">
									Manage academic sections and class groupings
								</p>
							</div>
							<div>
								<Link href={route('admin.sections.import')} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium flex items-center">
									<svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
									</svg>
									Import Sections CSV
								</Link>
							</div>
						</div>
					</div>
					{flash.success && (
						<div className="pointer-events-none fixed right-6 top-6 z-50 rounded bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">{flash.success}</div>
					)}


					<div className="card">
						<div className="mb-6">
							<h3 className="text-lg font-medium text-gray-900">Add New Section</h3>
							<p className="mt-1 text-sm text-gray-600">Create a new university section with program and year level information.</p>
						</div>

						<form onSubmit={submit} className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
							<div>
								<label className="block text-sm font-medium text-gray-700">Department</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.department}
									onChange={(e) => handleDepartmentChange(e.target.value)}
								>
									<option value="">Select Department</option>
									{Array.isArray(departments) && departments.map((dept, index) => (
										<option key={index} value={dept.name || dept}>{dept.name || dept}</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Program</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
									value={data.program}
									onChange={(e) => {
										const programCode = e.target.value;
										setData('program', programCode);
										
										// Find program ID from the programsList
										const programObj = programsList.find(p => p.code === programCode);
										setData('program_id', programObj?.id || '');
									}}
									disabled={!data.department}
								>
									<option value="">{data.department ? 'Select Program' : 'Select Department first'}</option>
									{Object.entries(availablePrograms).map(([code, name]) => (
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
								<label className="block text-sm font-medium text-gray-700">Section Code</label>
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
								<label className="block text-sm font-medium text-gray-700">Adviser</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.adviser_id}
									onChange={(e) => {
										const selectedTeacher = teachers.find(t => t.id == e.target.value);
										setData('adviser_id', e.target.value);
										setData('adviser_name', selectedTeacher?.name || '');
									}}
								>
									<option value="">Select Adviser</option>
									{teachers
										.filter(teacher => {
											// Show teachers if they belong to the selected department (primary or optional)
											return teacher.department_id == data.department_id || 
											       teacher.optional_department_id == data.department_id;
										})
										.map((teacher) => (
											<option key={teacher.id} value={teacher.id}>
												{teacher.name} ({teacher.email})
											</option>
										))
									}
								</select>
								<p className="mt-1 text-xs text-gray-500">Only teachers from the selected department are shown</p>
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
									key: 'section_code',
									label: 'Section Code',
									render: (_, row) => {
										return (
											<div>
												<div className="font-medium text-gray-900">{row.name}</div>
												<div className="text-sm text-gray-500">{row.academic_year} • {row.semester}</div>
											</div>
										);
									}
								},
								{ 
									key: 'department',
									label: 'Department',
									render: (_, row) => {
										let departmentName = 'No Department';
										
										// Handle different department data structures
										if (row.program?.department?.name) {
											departmentName = row.program.department.name;
										} else if (typeof row.department === 'string') {
											departmentName = row.department;
										} else if (row.department?.name) {
											departmentName = row.department.name;
										}
										
										return (
											<span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
												{departmentName}
											</span>
										);
									}
								},
								{ 
									key: 'program', 
									label: 'Program',
									render: (program, row) => {
										let programName = 'No Program';
										
										// Handle different program data structures
										if (program?.name) {
											programName = program.name;
										} else if (typeof program === 'string') {
											programName = program;
										} else if (typeof row.program === 'string') {
											programName = row.program;
										} else if (row.program?.name) {
											programName = row.program.name;
										}
										
										return programName;
									}
								},
								{ 
									key: 'adviser_name', 
									label: 'Adviser',
									render: (adviser_name) => {
										// Remove invisible characters and clean up the adviser name
										const cleanName = adviser_name?.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() || 'No Adviser';
										return cleanName;
									}
								},
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
							onView={(row) => handleViewSection(row.id)}
							onDelete={handleDeleteSection}
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

			{/* Section Details Modal */}
			{showModal && selectedSection && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="w-full max-w-4xl max-h-[90vh] rounded-lg bg-white shadow-xl overflow-hidden">
						{/* Modal Header */}
						<div className="flex items-center justify-between p-6 border-b border-gray-200">
							<div>
								<h3 className="text-xl font-bold text-gray-900">
									{selectedSection.program?.code || selectedSection.program?.name || 'No Program'}-{selectedSection.year_level}{selectedSection.name}
								</h3>
								<p className="text-sm text-gray-500 mt-1">
									{selectedSection.academic_year} • {selectedSection.semester}
								</p>
							</div>
							<button
								onClick={closeModal}
								className="text-gray-400 hover:text-gray-600 text-xl"
							>
								✕
							</button>
						</div>

						{/* Modal Content */}
						<div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
							{isEditMode ? (
								<div className="space-y-6">
									<h4 className="text-lg font-semibold text-gray-900">Edit Section</h4>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Section Code</label>
											<input
												type="text"
												value={editData.name || ''}
												onChange={(e) => setEditData({...editData, name: e.target.value})}
												className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
											<select
												value={editData.year_level || ''}
												onChange={(e) => setEditData({...editData, year_level: e.target.value})}
												className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											>
												<option value="">Select Year Level</option>
												{yearLevels.map((year) => (
													<option key={year} value={year}>{year}</option>
												))}
											</select>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Adviser Name</label>
											<input
												type="text"
												value={editData.adviser_name || ''}
												onChange={(e) => setEditData({...editData, adviser_name: e.target.value})}
												className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
											<select
												value={editData.semester || ''}
												onChange={(e) => setEditData({...editData, semester: e.target.value})}
												className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											>
												<option value="">Select Semester</option>
												{semesters.map((sem) => (
													<option key={sem} value={sem}>{sem}</option>
												))}
											</select>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
											<input
												type="text"
												value={editData.academic_year || ''}
												onChange={(e) => setEditData({...editData, academic_year: e.target.value})}
												className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
									</div>
								</div>
							) : (
								<div>
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
										<div className="space-y-4">
											<h4 className="text-lg font-semibold text-gray-900">Section Information</h4>
											<div className="bg-gray-50 rounded-lg p-4 space-y-3">
												<div className="flex justify-between">
													<span className="text-sm font-medium text-gray-500">Section Code:</span>
													<span className="text-sm text-gray-900">{selectedSection.name}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-sm font-medium text-gray-500">Year Level:</span>
													<span className="text-sm text-gray-900">{selectedSection.year_level}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-sm font-medium text-gray-500">Program:</span>
													<span className="text-sm text-gray-900">{selectedSection.program?.name || 'No Program'}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-sm font-medium text-gray-500">Department:</span>
													<span className="text-sm text-gray-900">{selectedSection.department?.name || 'No Department'}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-sm font-medium text-gray-500">Adviser:</span>
													<span className="text-sm text-gray-900">
														{selectedSection.adviser_name?.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() || 'No Adviser'}
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-sm font-medium text-gray-500">Students:</span>
													<span className="text-sm text-gray-900">{selectedSection.students_count} students</span>
												</div>
											</div>
										</div>

										<div className="space-y-4">
											<h4 className="text-lg font-semibold text-gray-900">Assigned Teachers</h4>
											<div className="bg-gray-50 rounded-lg p-4">
												{selectedSection.teachers && selectedSection.teachers.length > 0 ? (
													<div className="space-y-3">
														{selectedSection.teachers.map((teacher) => (
															<div key={teacher.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
																<div>
																	<div className="font-medium text-gray-900">{teacher.name}</div>
																	<div className="text-sm text-gray-500">{teacher.email}</div>
																</div>
																<div className="text-right">
																	<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
																		{teacher.subject}
																	</span>
																</div>
															</div>
														))}
													</div>
												) : (
													<div className="text-center py-8">
														<svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
														</svg>
														<p className="text-gray-500">No teachers assigned to this section</p>
													</div>
												)}
											</div>
										</div>
									</div>

									<div className="mt-6">
										<h4 className="text-lg font-semibold text-gray-900 mb-4">Students ({selectedSection.students_count})</h4>
										<div className="bg-gray-50 rounded-lg p-4">
											{selectedSection.students && selectedSection.students.length > 0 ? (
												<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
													{selectedSection.students.map((student) => (
														<div key={student.id} className="bg-white rounded-lg p-3 border">
															<div className="font-medium text-gray-900">{student.name}</div>
															<div className="text-sm text-gray-500">{student.student_id}</div>
															<div className="text-sm text-gray-500">{student.email}</div>
														</div>
													))}
												</div>
											) : (
												<div className="text-center py-8">
													<svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
													</svg>
													<p className="text-gray-500">No students enrolled in this section</p>
												</div>
											)}
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Modal Footer */}
						<div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
							<button
								onClick={closeModal}
								className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
							>
								{isEditMode ? 'Cancel' : 'Close'}
							</button>
							{isEditMode ? (
								<button
									onClick={handleSaveEdit}
									disabled={isLoading}
									className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
								>
									{isLoading ? 'Saving...' : 'Save Changes'}
								</button>
							) : (
								<button
									onClick={handleEditMode}
									className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
								>
									Edit Section
								</button>
							)}
						</div>
					</div>
				</div>
			)}
		</AuthenticatedLayout>
	);
}