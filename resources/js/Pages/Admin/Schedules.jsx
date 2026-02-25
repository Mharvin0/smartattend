import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import Modal from '@/Components/Modal';
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

	const {
		data: editData,
		setData: setEditData,
		patch: patchSchedule,
		processing: editProcessing,
		errors: editErrors,
		clearErrors: clearEditErrors,
		reset: resetEditForm,
	} = useForm({
		department_id: '',
		program_id: '',
		section_id: '',
		subject_id: '',
		day: '',
		time_start: '08:00',
		time_end: '09:00',
	});

	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingSchedule, setEditingSchedule] = useState(null);
	const [isDeletingId, setIsDeletingId] = useState(null);
	
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
		post(route('admin.schedules.store', undefined, false), {
			preserveScroll: true,
			onSuccess: () => {
				// Ensure the table reflects the latest server state
				router.reload({ only: ['schedules'], preserveScroll: true });
			},
		}); 
	};

	const handleFilterChange = (key, value) => {
		const newFilters = { ...filterData, [key]: value };
		setFilterData(newFilters);
		
		// Build query string
		const queryParams = new URLSearchParams();
		Object.entries(newFilters).forEach(([k, v]) => {
			if (v) queryParams.append(k, v);
		});
		
		router.get(route('admin.schedules', undefined, false), Object.fromEntries(queryParams), {
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
		router.get(route('admin.schedules', undefined, false));
	};

	const openEditModal = (schedule) => {
		clearEditErrors();
		setEditingSchedule(schedule);

		const departmentId = schedule.department_id || schedule.department?.id || '';
		const programId = schedule.program_id || schedule.program?.id || '';
		const sectionId = schedule.section_id || schedule.section?.id || '';
		const subjectId = schedule.subject_id || schedule.subject?.id || '';

		setEditData({
			department_id: String(departmentId || ''),
			program_id: String(programId || ''),
			section_id: String(sectionId || ''),
			subject_id: String(subjectId || ''),
			day: schedule.day || '',
			time_start: schedule.time_start || '08:00',
			time_end: schedule.time_end || '09:00',
		});

		setIsEditModalOpen(true);
	};

	const closeEditModal = () => {
		setIsEditModalOpen(false);
		setEditingSchedule(null);
		clearEditErrors();
		resetEditForm();
	};

	const handleDeleteSchedule = (schedule) => {
		if (!confirm('Delete this schedule? This action cannot be undone.')) return;
		setIsDeletingId(schedule.id);

		router.delete(route('admin.schedules.destroy', schedule.id, false), {
			preserveScroll: true,
			onSuccess: () => {
				// If deleting from within the edit modal, close it
				if (editingSchedule?.id === schedule.id) {
					closeEditModal();
				}
				router.reload({ only: ['schedules'], preserveScroll: true });
			},
			onFinish: () => setIsDeletingId(null),
		});
	};

	const editFilteredPrograms = editData.department_id
		? programs.filter((p) => String(p.department_id) === String(editData.department_id))
		: programs;
	const editFilteredSections = editData.program_id
		? sections.filter((s) => String(s.program_id) === String(editData.program_id) || (s.program && String(s.program.id) === String(editData.program_id)))
		: sections;
	const editFilteredSubjects = editData.program_id
		? subjects.filter((s) => String(s.program_id) === String(editData.program_id) || (s.program && String(s.program.id) === String(editData.program_id)))
		: subjects;

	return (
		<AuthenticatedLayout>
			<Head title="Schedules" />
			<div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-zinc-50/70">
				<div className="w-full px-6 py-8 space-y-6">
					{/* Header */}
					<div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
									Schedules
								</h2>
								<p className="text-gray-600 mt-2 text-lg">
									Manage class schedules and time allocations
								</p>
							</div>
						</div>
					</div>
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
							onEdit={openEditModal}
							onDelete={handleDeleteSchedule}
						/>
					</div>
				</div>
			</div>

			<Modal show={isEditModalOpen && !!editingSchedule} onClose={closeEditModal} maxWidth="2xl">
				{editingSchedule && (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							patchSchedule(route('admin.schedules.update', editingSchedule.id, false), {
								preserveScroll: true,
								onSuccess: () => {
									closeEditModal();
									router.reload({ only: ['schedules'], preserveScroll: true });
								},
							});
						}}
					>
						<div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
							<div className="min-w-0">
								<h3 className="truncate text-lg font-semibold text-gray-900">Edit Schedule</h3>
								<p className="mt-1 text-sm text-gray-500 truncate">
									{editingSchedule.section?.name ? `Section: ${editingSchedule.section.name}` : 'Update schedule details'}
								</p>
							</div>
							<button
								type="button"
								onClick={closeEditModal}
								className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
								aria-label="Close"
							>
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						<div className="space-y-4 px-6 py-5">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<label className="block text-sm font-medium text-gray-700">Department *</label>
									<select
										className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-brand-primary focus:ring-brand-primary"
										value={editData.department_id}
										onChange={(e) => {
											setEditData('department_id', e.target.value);
											setEditData('program_id', '');
											setEditData('section_id', '');
											setEditData('subject_id', '');
										}}
										required
									>
										<option value="">Select Department</option>
										{departments.map((d) => (
											<option key={d.id} value={d.id}>{d.name}</option>
										))}
									</select>
									{editErrors.department_id && <p className="mt-1 text-sm text-red-600">{editErrors.department_id}</p>}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">Program *</label>
									<select
										className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-brand-primary focus:ring-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
										value={editData.program_id}
										onChange={(e) => {
											setEditData('program_id', e.target.value);
											setEditData('section_id', '');
											setEditData('subject_id', '');
										}}
										required
										disabled={!editData.department_id}
									>
										<option value="">{editData.department_id ? 'Select Program' : 'Select Department first'}</option>
										{editFilteredPrograms.map((p) => (
											<option key={p.id} value={p.id}>{p.name}</option>
										))}
									</select>
									{editErrors.program_id && <p className="mt-1 text-sm text-red-600">{editErrors.program_id}</p>}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">Section *</label>
									<select
										className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-brand-primary focus:ring-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
										value={editData.section_id}
										onChange={(e) => setEditData('section_id', e.target.value)}
										required
										disabled={!editData.program_id}
									>
										<option value="">{editData.program_id ? 'Select Section' : 'Select Program first'}</option>
										{editFilteredSections.map((s) => (
											<option key={s.id} value={s.id}>{s.name}</option>
										))}
									</select>
									{editErrors.section_id && <p className="mt-1 text-sm text-red-600">{editErrors.section_id}</p>}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">Subject *</label>
									<select
										className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-brand-primary focus:ring-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
										value={editData.subject_id}
										onChange={(e) => setEditData('subject_id', e.target.value)}
										required
										disabled={!editData.program_id}
									>
										<option value="">{editData.program_id ? 'Select Subject' : 'Select Program first'}</option>
										{editFilteredSubjects.map((s) => (
											<option key={s.id} value={s.id}>{s.name} ({s.code})</option>
										))}
									</select>
									{editErrors.subject_id && <p className="mt-1 text-sm text-red-600">{editErrors.subject_id}</p>}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">Day *</label>
									<select
										className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-brand-primary focus:ring-brand-primary"
										value={editData.day}
										onChange={(e) => setEditData('day', e.target.value)}
										required
									>
										<option value="">Select Day</option>
										{Object.entries(days).map(([key, value]) => (
											<option key={key} value={key}>{value}</option>
										))}
									</select>
									{editErrors.day && <p className="mt-1 text-sm text-red-600">{editErrors.day}</p>}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">Start Time *</label>
									<input
										type="time"
										className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-brand-primary focus:ring-brand-primary"
										value={editData.time_start}
										onChange={(e) => setEditData('time_start', e.target.value)}
										required
									/>
									{editErrors.time_start && <p className="mt-1 text-sm text-red-600">{editErrors.time_start}</p>}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">End Time *</label>
									<input
										type="time"
										className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-brand-primary focus:ring-brand-primary"
										value={editData.time_end}
										onChange={(e) => setEditData('time_end', e.target.value)}
										required
									/>
									{editErrors.time_end && <p className="mt-1 text-sm text-red-600">{editErrors.time_end}</p>}
								</div>
							</div>
						</div>

						<div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
							<button
								type="button"
								onClick={() => {
									if (!editingSchedule?.id) return;
									handleDeleteSchedule(editingSchedule);
								}}
								disabled={isDeletingId === editingSchedule.id}
								className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50"
							>
								{isDeletingId === editingSchedule.id ? 'Deleting…' : 'Delete'}
							</button>

							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={closeEditModal}
									className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={editProcessing}
									className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 disabled:opacity-50"
								>
									{editProcessing ? 'Saving…' : 'Save Changes'}
								</button>
							</div>
						</div>
					</form>
				)}
			</Modal>
		</AuthenticatedLayout>
	);
}