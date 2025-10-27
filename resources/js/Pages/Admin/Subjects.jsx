import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import { useState, useEffect } from 'react';

export default function Subjects({ subjects, sections, departments, programs, yearLevels, semesters }) {
	const { data, setData, post, processing } = useForm({ 
		code: '', 
		name: '', 
		department: '',
		program: '',
		year_level: '',
		semester: '',
		adviser: '',
		section_id: '',
		department_id: '',
		program_id: ''
	});
	const flash = usePage().props.flash || {};
	const submit = (e) => { e.preventDefault(); post(route('admin.subjects')); };

	// State for program filtering
	const [availablePrograms, setAvailablePrograms] = useState({});
	const [availableSections, setAvailableSections] = useState(sections);
	
	// State for table filtering
	const [searchTerm, setSearchTerm] = useState('');
	const [filterDepartment, setFilterDepartment] = useState('');
	const [filterProgram, setFilterProgram] = useState('');
	const [filterYearLevel, setFilterYearLevel] = useState('');
	const [filterSemester, setFilterSemester] = useState('');
	const [filterSection, setFilterSection] = useState('');

	// State for edit functionality
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingSubject, setEditingSubject] = useState(null);
	const [isLoading, setIsLoading] = useState(false);

	// Filter programs based on selected department
	const handleDepartmentChange = (departmentName) => {
		setData('department', departmentName);
		setData('program', '');
		setData('program_id', '');
		
		// Find department ID
		const departmentObj = departments.find(d => d.name === departmentName);
		setData('department_id', departmentObj?.id || '');
		
		if (departmentName && departmentObj) {
			const departmentPrograms = {};
			programs.forEach(program => {
				if (String(program.department_id) === String(departmentObj.id)) {
					departmentPrograms[program.code] = program.name;
				}
			});
			setAvailablePrograms(departmentPrograms);
		} else {
			setAvailablePrograms({});
		}
	};

	// Filter sections based on selected program and year level
	useEffect(() => {
		if (data.program && data.year_level) {
			// Find the program ID from the selected program code
			const selectedProgram = programs.find(p => p.code === data.program);
			const programId = selectedProgram?.id;
			
			if (programId) {
				const filteredSections = sections.filter(section => {
					// Check both program_id and program relationship with proper type handling
					const matchesProgram = String(section.program_id) === String(programId) || 
										  (section.program && String(section.program.id) === String(programId)) ||
										  (typeof section.program === 'string' && section.program === data.program);
					
					const matchesYearLevel = section.year_level === data.year_level;
					
					return matchesProgram && matchesYearLevel;
				});
				setAvailableSections(filteredSections);
			} else {
				setAvailableSections([]);
			}
		} else {
			setAvailableSections(sections);
		}
	}, [data.program, data.year_level, sections, programs]);

	// Filter subjects based on search and filter criteria
	const filteredSubjects = subjects.filter(subject => {
		const matchesSearch = !searchTerm || 
			subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
			subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			subject.adviser?.toLowerCase().includes(searchTerm.toLowerCase());
		
		const matchesDepartment = !filterDepartment || subject.department === filterDepartment;
		const matchesProgram = !filterProgram || subject.program === filterProgram;
		const matchesYearLevel = !filterYearLevel || subject.year_level === filterYearLevel;
		const matchesSemester = !filterSemester || subject.semester === filterSemester;
		const matchesSection = !filterSection || subject.section?.name === filterSection;
		
		return matchesSearch && matchesDepartment && matchesProgram && matchesYearLevel && matchesSemester && matchesSection;
	});

	// Get unique values for filter dropdowns
	const uniqueDepartments = [...new Set(subjects.map(s => s.department).filter(Boolean))];
	const uniquePrograms = [...new Set(subjects.map(s => s.program).filter(Boolean))];
	const uniqueYearLevels = [...new Set(subjects.map(s => s.year_level).filter(Boolean))];
	const uniqueSemesters = [...new Set(subjects.map(s => s.semester).filter(Boolean))];
	const uniqueSections = [...new Set(subjects.map(s => s.section?.name).filter(Boolean))];

	// Clear all filters
	const clearFilters = () => {
		setSearchTerm('');
		setFilterDepartment('');
		setFilterProgram('');
		setFilterYearLevel('');
		setFilterSemester('');
		setFilterSection('');
	};

	// Handle edit subject
	const handleEditSubject = (subject) => {
		setEditingSubject(subject);
		setIsEditModalOpen(true);
	};

	// Handle delete subject
	const handleDeleteSubject = async (subject) => {
		if (confirm(`Are you sure you want to delete "${subject.name}"? This action cannot be undone.`)) {
			setIsLoading(true);
			try {
				router.delete(route('admin.subjects.destroy', subject.id), {
					onSuccess: () => {
						setIsLoading(false);
					},
					onError: () => {
						setIsLoading(false);
					}
				});
			} catch (error) {
				setIsLoading(false);
				console.error('Error deleting subject:', error);
			}
		}
	};

	// Close edit modal
	const closeEditModal = () => {
		setIsEditModalOpen(false);
		setEditingSubject(null);
	};

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
							<p className="mt-1 text-sm text-gray-600">Create a new subject with department, program, and section information.</p>
						</div>

						<form onSubmit={submit} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">Department</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.department}
									onChange={(e) => handleDepartmentChange(e.target.value)}
								>
									<option value="">Select Department</option>
									{departments.map((dept) => (
										<option key={dept.id} value={dept.name}>{dept.name}</option>
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
										
										// Find program ID from the programs list
										const programObj = programs.find(p => p.code === programCode);
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
									{availableSections.map((s) => (
										<option key={s.id} value={s.id}>{s.name}</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Adviser</label>
								<input
									type="text"
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									placeholder="e.g. Dr. John Doe"
									value={data.adviser}
									onChange={(e) => setData('adviser', e.target.value)}
								/>
							</div>

							<div className="md:col-span-2 lg:col-span-4">
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
						<div className="mb-6">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h3 className="text-lg font-medium text-gray-900">All Subjects</h3>
									<p className="mt-1 text-sm text-gray-600">Manage and view all subjects. Showing {filteredSubjects.length} of {subjects.length} subjects.</p>
								</div>
								<button 
									onClick={clearFilters}
									className="text-sm text-gray-500 hover:text-gray-700 underline"
								>
									Clear Filters
								</button>
							</div>
							
							{/* Search and Filter Controls */}
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
								{/* Search */}
								<div className="relative">
									<input 
										type="text" 
										className="w-full rounded-lg border-gray-300 pl-10 pr-4 focus:border-brand-primary focus:ring-brand-primary sm:text-sm" 
										placeholder="Search subjects..." 
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
									<svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
								</div>

								{/* Department Filter */}
								<select 
									className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={filterDepartment}
									onChange={(e) => setFilterDepartment(e.target.value)}
								>
									<option value="">All Departments</option>
									{uniqueDepartments.map((dept, index) => (
										<option key={typeof dept === 'string' ? dept : dept?.id || `dept-${index}`} value={dept}>{typeof dept === 'string' ? dept : dept?.name || dept}</option>
									))}
								</select>

								{/* Program Filter */}
								<select 
									className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={filterProgram}
									onChange={(e) => setFilterProgram(e.target.value)}
								>
									<option value="">All Programs</option>
									{uniquePrograms.map((program, index) => (
										<option key={typeof program === 'string' ? program : program?.id || `program-${index}`} value={program}>{typeof program === 'string' ? program : program?.name || program?.code || program}</option>
									))}
								</select>

								{/* Year Level Filter */}
								<select 
									className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={filterYearLevel}
									onChange={(e) => setFilterYearLevel(e.target.value)}
								>
									<option value="">All Year Levels</option>
									{uniqueYearLevels.map((year) => (
										<option key={year} value={year}>{year}</option>
									))}
								</select>

								{/* Semester Filter */}
								<select 
									className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={filterSemester}
									onChange={(e) => setFilterSemester(e.target.value)}
								>
									<option value="">All Semesters</option>
									{uniqueSemesters.map((sem) => (
										<option key={sem} value={sem}>{sem}</option>
									))}
								</select>

								{/* Section Filter */}
								<select 
									className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={filterSection}
									onChange={(e) => setFilterSection(e.target.value)}
								>
									<option value="">All Sections</option>
									{uniqueSections.map((section, index) => (
										<option key={typeof section === 'string' ? section : section?.id || `section-${index}`} value={section}>{typeof section === 'string' ? section : section?.name || section}</option>
									))}
								</select>
							</div>
						</div>

						{filteredSubjects.length > 0 ? (
							<DataTable
								columns={[
									{ key: 'code', label: 'Code' },
									{ key: 'name', label: 'Subject Name' },
									{ 
										key: 'department', 
										label: 'Department',
										render: (department) => {
											const deptName = typeof department === 'string' ? department : department?.name || 'No Department';
											return (
												<span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
													{deptName}
												</span>
											);
										}
									},
									{ 
										key: 'program', 
										label: 'Program',
										render: (program) => {
											const programName = typeof program === 'string' ? program : program?.name || program?.code || 'No Program';
											return programName;
										}
									},
									{ key: 'year_level', label: 'Year Level' },
									{ key: 'semester', label: 'Semester' },
									{ key: 'adviser', label: 'Adviser' },
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
								data={filteredSubjects}
								actions={true}
								onEdit={handleEditSubject}
								onDelete={handleDeleteSubject}
							/>
						) : (
							<div className="text-center py-12">
								<svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.9-6.1-2.4l-.1-.1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
								<p className="mt-1 text-sm text-gray-500">
									{searchTerm || filterDepartment || filterProgram || filterYearLevel || filterSemester || filterSection
										? 'Try adjusting your search or filter criteria.'
										: 'No subjects have been created yet.'}
								</p>
								{(searchTerm || filterDepartment || filterProgram || filterYearLevel || filterSemester || filterSection) && (
									<div className="mt-6">
										<button
											onClick={clearFilters}
											className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
										>
											Clear Filters
										</button>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Edit Subject Modal */}
			{isEditModalOpen && editingSubject && (
				<div className="fixed inset-0 z-50 overflow-y-auto">
					<div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
						<div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeEditModal}></div>
						
						<div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
							<div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
								<div className="sm:flex sm:items-start">
									<div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
										<h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
											Edit Subject: {editingSubject.name}
										</h3>
										
										<form onSubmit={(e) => {
											e.preventDefault();
											setIsLoading(true);
											router.patch(route('admin.subjects.update', editingSubject.id), {
												code: editingSubject.code,
												name: editingSubject.name,
												department: editingSubject.department,
												program: editingSubject.program,
												year_level: editingSubject.year_level,
												semester: editingSubject.semester,
												adviser: editingSubject.adviser,
												section_id: editingSubject.section_id
											}, {
												onSuccess: () => {
													setIsLoading(false);
													closeEditModal();
												},
												onError: () => {
													setIsLoading(false);
												}
											});
										}} className="space-y-4">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">Subject Code</label>
													<input
														type="text"
														value={editingSubject.code || ''}
														onChange={(e) => setEditingSubject({...editingSubject, code: e.target.value})}
														className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
														required
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">Subject Name</label>
													<input
														type="text"
														value={editingSubject.name || ''}
														onChange={(e) => setEditingSubject({...editingSubject, name: e.target.value})}
														className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
														required
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
													<input
														type="text"
														value={editingSubject.department || ''}
														onChange={(e) => setEditingSubject({...editingSubject, department: e.target.value})}
														className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
														required
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
													<input
														type="text"
														value={editingSubject.program || ''}
														onChange={(e) => setEditingSubject({...editingSubject, program: e.target.value})}
														className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
														required
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
													<select
														value={editingSubject.year_level || ''}
														onChange={(e) => setEditingSubject({...editingSubject, year_level: e.target.value})}
														className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
														required
													>
														<option value="">Select Year Level</option>
														{yearLevels.map((year) => (
															<option key={year} value={year}>{year}</option>
														))}
													</select>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
													<select
														value={editingSubject.semester || ''}
														onChange={(e) => setEditingSubject({...editingSubject, semester: e.target.value})}
														className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
														required
													>
														<option value="">Select Semester</option>
														{semesters.map((sem) => (
															<option key={sem} value={sem}>{sem}</option>
														))}
													</select>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
													<select
														value={editingSubject.section_id || ''}
														onChange={(e) => setEditingSubject({...editingSubject, section_id: e.target.value})}
														className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
													>
														<option value="">Select Section</option>
														{sections.map((s) => (
															<option key={s.id} value={s.id}>{s.name}</option>
														))}
													</select>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">Adviser</label>
													<input
														type="text"
														value={editingSubject.adviser || ''}
														onChange={(e) => setEditingSubject({...editingSubject, adviser: e.target.value})}
														className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
													/>
												</div>
											</div>
											
											<div className="flex items-center justify-end space-x-3 pt-4">
												<button
													type="button"
													onClick={closeEditModal}
													className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
												>
													Cancel
												</button>
												<button
													type="submit"
													disabled={isLoading}
													className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
												>
													{isLoading ? 'Saving...' : 'Save Changes'}
												</button>
											</div>
										</form>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</AuthenticatedLayout>
	);
}