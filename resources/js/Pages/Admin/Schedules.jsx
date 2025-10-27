import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import { useState, useEffect } from 'react';

export default function Schedules({ schedules, departments, programs, sections, subjects, days, filters }) {
	const { data, setData, post, processing, errors } = useForm({ 
		department_id: '', 
		program_id: '', 
		section_id: '', 
		subject_id: '', 
		day: '', 
		time_start: '08:00', 
		time_end: '09:00' 
	});
	
	const [filterData, setFilterData] = useState({
		department_id: filters.department_id || '',
		program_id: filters.program_id || '',
		section_id: filters.section_id || '',
		subject_id: filters.subject_id || '',
		day: filters.day || '',
		search: filters.search || '',
	});

	const [filteredPrograms, setFilteredPrograms] = useState([]);
	const [filteredSections, setFilteredSections] = useState([]);
	const [filteredSubjects, setFilteredSubjects] = useState([]);

	// Filter options for the filter section
	const [filterPrograms, setFilterPrograms] = useState([]);
	const [filterSections, setFilterSections] = useState([]);
	const [filterSubjects, setFilterSubjects] = useState([]);

	const flash = usePage().props.flash || {};

	// Initialize filter options
	useEffect(() => {
		setFilterPrograms(programs);
		setFilterSections(sections);
		setFilterSubjects(subjects);
	}, [programs, sections, subjects]);

	// Filter programs based on selected department
	useEffect(() => {
		if (data.department_id) {
			const filtered = programs.filter(p => {
				// Handle both string and number comparisons
				return String(p.department_id) === String(data.department_id);
			});
			setFilteredPrograms(filtered);
			// Reset program selection when department changes
			setData('program_id', '');
		} else {
			setFilteredPrograms(programs);
		}
	}, [data.department_id, programs]);

	// Filter sections based on selected program
	useEffect(() => {
		if (data.program_id) {
			const filtered = sections.filter(s => {
				// Check both program_id and program relationship with proper type handling
				return String(s.program_id) === String(data.program_id) || 
					   (s.program && String(s.program.id) === String(data.program_id)) ||
					   (typeof s.program === 'string' && s.program === data.program_id);
			});
			setFilteredSections(filtered);
			// Reset section selection when program changes
			setData('section_id', '');
		} else {
			setFilteredSections(sections);
		}
	}, [data.program_id, sections]);

	// Filter subjects based on selected program
	useEffect(() => {
		if (data.program_id) {
			const filtered = subjects.filter(s => {
				// Check both program_id and program relationship with proper type handling
				return String(s.program_id) === String(data.program_id) || 
					   (s.program && String(s.program.id) === String(data.program_id)) ||
					   (typeof s.program === 'string' && s.program === data.program_id);
			});
			setFilteredSubjects(filtered);
			// Reset subject selection when program changes
			setData('subject_id', '');
		} else {
			setFilteredSubjects(subjects);
		}
	}, [data.program_id, subjects]);

	// Filter options for filter dropdowns based on selected department
	useEffect(() => {
		if (filterData.department_id) {
			const filtered = programs.filter(p => String(p.department_id) === String(filterData.department_id));
			setFilterPrograms(filtered);
			// Reset program filter when department changes
			if (filterData.program_id && !filtered.find(p => p.id == filterData.program_id)) {
				handleFilterChange('program_id', '');
			}
		} else {
			setFilterPrograms(programs);
		}
	}, [filterData.department_id, programs]);

	useEffect(() => {
		if (filterData.program_id) {
			const filtered = sections.filter(s => {
				return String(s.program_id) === String(filterData.program_id) || 
					   (s.program && String(s.program.id) === String(filterData.program_id)) ||
					   (typeof s.program === 'string' && s.program === filterData.program_id);
			});
			setFilterSections(filtered);
			// Reset section filter when program changes
			if (filterData.section_id && !filtered.find(s => s.id == filterData.section_id)) {
				handleFilterChange('section_id', '');
			}
		} else {
			setFilterSections(sections);
		}
	}, [filterData.program_id, sections]);

	useEffect(() => {
		if (filterData.program_id) {
			const filtered = subjects.filter(s => {
				return String(s.program_id) === String(filterData.program_id) || 
					   (s.program && String(s.program.id) === String(filterData.program_id)) ||
					   (typeof s.program === 'string' && s.program === filterData.program_id);
			});
			setFilterSubjects(filtered);
			// Reset subject filter when program changes
			if (filterData.subject_id && !filtered.find(s => s.id == filterData.subject_id)) {
				handleFilterChange('subject_id', '');
			}
		} else {
			setFilterSubjects(subjects);
		}
	}, [filterData.program_id, subjects]);

	const submit = (e) => { 
		e.preventDefault(); 
		post(route('admin.schedules.store')); 
	};

	const handleFilterChange = (key, value) => {
		const newFilters = { ...filterData, [key]: value };
		setFilterData(newFilters);
		
		// Build query string
		const queryParams = new URLSearchParams();
		Object.entries(newFilters).forEach(([k, v]) => {
			if (v) queryParams.append(k, v);
		});
		
		router.get(route('admin.schedules'), Object.fromEntries(queryParams), {
			preserveState: true,
			replace: true
		});
	};

	const clearFilters = () => {
		setFilterData({
			department_id: '',
			program_id: '',
			section_id: '',
			subject_id: '',
			day: '',
			search: '',
		});
		router.get(route('admin.schedules'));
	};

	return (
		<AuthenticatedLayout header={<h2 className="text-2xl font-bold leading-tight text-gray-800">Schedules</h2>}>
			<Head title="Schedules" />
			<div className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-emerald-50/80 to-brand-secondary/5 py-8">
				<div className="mx-auto max-w-full space-y-10 px-4 sm:px-6 lg:px-8 xl:px-12">
					{flash.success && (
						<div className="pointer-events-none fixed right-6 top-6 z-50 rounded bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">{flash.success}</div>
					)}

					{/* Add New Schedule Form */}
					<div className="card">
						<div className="mb-6">
							<h3 className="text-lg font-medium text-gray-900">Add New Schedule</h3>
							<p className="mt-1 text-sm text-gray-600">Create a new class schedule by selecting department, program, section, subject, day, and time.</p>
						</div>

						<form onSubmit={submit} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">Department *</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.department_id}
									onChange={(e) => setData('department_id', e.target.value)}
									required
								>
									<option value="">Select Department</option>
									{departments.map((d) => (
										<option key={d.id} value={d.id}>{d.name}</option>
									))}
								</select>
								{errors.department_id && <p className="mt-1 text-sm text-red-600">{errors.department_id}</p>}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Program *</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.program_id}
									onChange={(e) => setData('program_id', e.target.value)}
									required
									disabled={!data.department_id}
								>
									<option value="">Select Program</option>
									{filteredPrograms.map((p) => (
										<option key={p.id} value={p.id}>{p.name}</option>
									))}
								</select>
								{errors.program_id && <p className="mt-1 text-sm text-red-600">{errors.program_id}</p>}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Section *</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.section_id}
									onChange={(e) => setData('section_id', e.target.value)}
									required
									disabled={!data.program_id}
								>
									<option value="">Select Section</option>
									{filteredSections.map((s) => (
										<option key={s.id} value={s.id}>{s.name}</option>
									))}
								</select>
								{errors.section_id && <p className="mt-1 text-sm text-red-600">{errors.section_id}</p>}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Subject *</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.subject_id}
									onChange={(e) => setData('subject_id', e.target.value)}
									required
									disabled={!data.program_id}
								>
									<option value="">Select Subject</option>
									{filteredSubjects.map((s) => (
										<option key={s.id} value={s.id}>{s.name} ({s.code})</option>
									))}
								</select>
								{errors.subject_id && <p className="mt-1 text-sm text-red-600">{errors.subject_id}</p>}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Day *</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.day}
									onChange={(e) => setData('day', e.target.value)}
									required
								>
									<option value="">Select Day</option>
									{Object.entries(days).map(([key, value]) => (
										<option key={key} value={key}>{value}</option>
									))}
								</select>
								{errors.day && <p className="mt-1 text-sm text-red-600">{errors.day}</p>}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Start Time *</label>
								<input
									type="time"
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.time_start}
									onChange={(e) => setData('time_start', e.target.value)}
									required
								/>
								{errors.time_start && <p className="mt-1 text-sm text-red-600">{errors.time_start}</p>}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">End Time *</label>
								<input
									type="time"
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.time_end}
									onChange={(e) => setData('time_end', e.target.value)}
									required
								/>
								{errors.time_end && <p className="mt-1 text-sm text-red-600">{errors.time_end}</p>}
							</div>

							<div className="flex items-end">
								<button disabled={processing} className="btn-primary inline-flex items-center gap-2 w-full">
									<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
									</svg>
									Create Schedule
								</button>
							</div>
						</form>
					</div>

					{/* Filters */}
					<div className="card">
						<div className="mb-6">
							<h3 className="text-lg font-medium text-gray-900">Filter Schedules</h3>
							<p className="mt-1 text-sm text-gray-600">Filter schedules by department, program, section, subject, day, or search term.</p>
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
							<div>
								<label className="block text-sm font-medium text-gray-700">Department</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={filterData.department_id}
									onChange={(e) => handleFilterChange('department_id', e.target.value)}
								>
									<option value="">All Departments</option>
									{departments.map((d) => (
										<option key={d.id} value={d.id}>{d.name}</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Program</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={filterData.program_id}
									onChange={(e) => handleFilterChange('program_id', e.target.value)}
								>
									<option value="">All Programs</option>
									{filterPrograms.map((p) => (
										<option key={p.id} value={p.id}>{p.name}</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Section</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={filterData.section_id}
									onChange={(e) => handleFilterChange('section_id', e.target.value)}
								>
									<option value="">All Sections</option>
									{filterSections.map((s) => (
										<option key={s.id} value={s.id}>{s.name}</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Subject</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={filterData.subject_id}
									onChange={(e) => handleFilterChange('subject_id', e.target.value)}
								>
									<option value="">All Subjects</option>
									{filterSubjects.map((s) => (
										<option key={s.id} value={s.id}>{s.name} ({s.code})</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Day</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={filterData.day}
									onChange={(e) => handleFilterChange('day', e.target.value)}
								>
									<option value="">All Days</option>
									{Object.entries(days).map(([key, value]) => (
										<option key={key} value={key}>{value}</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Search</label>
								<input
									type="text"
									placeholder="Search schedules..."
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={filterData.search}
									onChange={(e) => handleFilterChange('search', e.target.value)}
								/>
							</div>
						</div>

						<div className="mt-4 flex justify-between">
							<button
								onClick={clearFilters}
								className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
							>
								Clear Filters
							</button>
							<div className="text-sm text-gray-500">
								Showing {schedules.length} schedule(s)
							</div>
						</div>
					</div>

					{/* Schedules Table */}
					<div className="card">
						<div className="mb-6">
							<h3 className="text-lg font-medium text-gray-900">All Schedules</h3>
							<p className="mt-1 text-sm text-gray-600">View and manage class schedules.</p>
						</div>

						<DataTable
							columns={[
								{ 
									key: 'department',
									label: 'Department',
									render: (department) => (
										<span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
											{department?.name || 'N/A'}
										</span>
									)
								},
								{ 
									key: 'program',
									label: 'Program',
									render: (program) => (
										<span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
											{program?.name || 'N/A'}
										</span>
									)
								},
								{ 
									key: 'subject',
									label: 'Subject',
									render: (subject) => (
										<div>
											<div className="font-medium text-gray-900">{subject?.name}</div>
											<div className="text-sm text-gray-500">{subject?.code}</div>
										</div>
									)
								},
								{
									key: 'section',
									label: 'Section',
									render: (section) => (
										<span className="inline-flex items-center rounded-full bg-brand-primary bg-opacity-10 px-2.5 py-0.5 text-sm font-medium text-brand-primary">
											{section?.name}
										</span>
									)
								},
								{
									key: 'day',
									label: 'Day',
									render: (day) => (
										<span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
											{day || 'N/A'}
										</span>
									)
								},
								{
									key: 'time',
									label: 'Time',
									render: (_, schedule) => (
										<div className="text-sm">
											<span className="font-medium">{schedule.time_start}</span>
											<span className="mx-1">-</span>
											<span className="font-medium">{schedule.time_end}</span>
										</div>
									)
								},
							]}
							data={schedules}
							actions={true}
						/>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}