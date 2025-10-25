import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
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

	// Filter programs based on selected department
	const handleDepartmentChange = (departmentName) => {
		setData('department', departmentName);
		setData('program', '');
		setData('program_id', '');
		
		if (departmentName) {
			const departmentPrograms = {};
			programs.forEach(program => {
				if (program.department_id && departments.find(dept => dept.name === departmentName && dept.id === program.department_id)) {
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
			const filteredSections = sections.filter(section => 
				section.program === data.program && 
				section.year_level === data.year_level
			);
			setAvailableSections(filteredSections);
		} else {
			setAvailableSections(sections);
		}
	}, [data.program, data.year_level, sections]);

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
									onChange={(e) => setData('program', e.target.value)}
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
									{uniqueDepartments.map((dept) => (
										<option key={dept} value={dept}>{dept}</option>
									))}
								</select>

								{/* Program Filter */}
								<select 
									className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={filterProgram}
									onChange={(e) => setFilterProgram(e.target.value)}
								>
									<option value="">All Programs</option>
									{uniquePrograms.map((program) => (
										<option key={program} value={program}>{program}</option>
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
									{uniqueSections.map((section) => (
										<option key={section} value={section}>{section}</option>
									))}
								</select>
							</div>
						</div>

						{filteredSubjects.length > 0 ? (
							<DataTable
								columns={[
									{ key: 'code', label: 'Code' },
									{ key: 'name', label: 'Subject Name' },
									{ key: 'department', label: 'Department' },
									{ key: 'program', label: 'Program' },
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
		</AuthenticatedLayout>
	);
}