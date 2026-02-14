import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Departments({ departments }) {
	const {
		data: departmentData,
		setData: setDepartmentData,
		post: postDepartment,
		patch: patchDepartment,
		processing: departmentProcessing,
		reset: resetDepartment,
		errors: departmentErrors,
	} = useForm({
		name: '',
		code: '',
		description: '',
		is_active: true,
	});

	const {
		data: programData,
		setData: setProgramData,
		post: postProgram,
		patch: patchProgram,
		processing: programProcessing,
		reset: resetProgram,
		errors: programErrors,
	} = useForm({
		department_id: '',
		name: '',
		code: '',
		description: '',
		duration_years: 4,
		is_active: true,
	});

	const [editingDepartment, setEditingDepartment] = useState(null);
	const [editingProgram, setEditingProgram] = useState(null);
	const [showDepartmentForm, setShowDepartmentForm] = useState(false);
	const [showProgramForm, setShowProgramForm] = useState(false);
	const [selectedDepartment, setSelectedDepartment] = useState(null);

	const flash = usePage().props.flash || {};
	const normalizeValue = (value) => (value ?? '').toString().trim().toLowerCase();
	const findDuplicateDepartment = (field, value) => {
		const normalizedValue = normalizeValue(value);
		if (!normalizedValue) return null;
		return departments.find((department) => (
			normalizeValue(department[field]) === normalizedValue
			&& department.id !== editingDepartment?.id
		));
	};
	const duplicateNameDepartment = findDuplicateDepartment('name', departmentData.name);
	const duplicateCodeDepartment = findDuplicateDepartment('code', departmentData.code);
	const allPrograms = (departments || []).flatMap((department) => department.programs || []);
	const findDuplicateProgram = (field, value) => {
		const normalizedValue = normalizeValue(value);
		if (!normalizedValue) return null;
		return allPrograms.find((program) => (
			normalizeValue(program[field]) === normalizedValue
			&& program.id !== editingProgram?.id
		));
	};
	const duplicateNameProgram = findDuplicateProgram('name', programData.name);
	const duplicateCodeProgram = findDuplicateProgram('code', programData.code);

	useEffect(() => {
		if (flash.success || flash.error) {
			const timer = setTimeout(() => {
				router.reload({ only: ['departments'] });
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [flash.success, flash.error]);

	const submitDepartment = (e) => {
		e.preventDefault();
		if (editingDepartment) {
			patchDepartment(route('super.departments.update', editingDepartment.id), {
				onSuccess: () => {
					resetDepartment();
					setEditingDepartment(null);
					setShowDepartmentForm(false);
				},
				onError: () => {
					setShowDepartmentForm(true);
				},
			});
		} else {
			postDepartment(route('super.departments.store'), {
				onSuccess: () => {
					resetDepartment();
					setShowDepartmentForm(false);
				},
				onError: () => {
					setShowDepartmentForm(true);
				},
			});
		}
	};

	const submitProgram = (e) => {
		e.preventDefault();
		if (editingProgram) {
			patchProgram(route('super.programs.update', editingProgram.id), {
				onSuccess: () => {
					resetProgram();
					setEditingProgram(null);
					setShowProgramForm(false);
				},
				onError: () => {
					setShowProgramForm(true);
				},
			});
		} else {
			postProgram(route('super.programs.store'), {
				onSuccess: () => {
					resetProgram();
					setShowProgramForm(false);
				},
				onError: () => {
					setShowProgramForm(true);
				},
			});
		}
	};

	const editDepartment = (department) => {
		setDepartmentData({
			name: department.name,
			code: department.code,
			description: department.description || '',
			is_active: department.is_active,
		});
		setEditingDepartment(department);
		setShowDepartmentForm(true);
	};

	const closeDepartmentForm = () => {
		resetDepartment();
		setEditingDepartment(null);
		setShowDepartmentForm(false);
	};
	const closeProgramForm = () => {
		resetProgram();
		setEditingProgram(null);
		setShowProgramForm(false);
		setSelectedDepartment(null);
	};
	const isEditingDepartment = Boolean(editingDepartment);
	const isEditingProgram = Boolean(editingProgram);

	const editProgram = (program) => {
		setProgramData({
			department_id: program.department_id,
			name: program.name,
			code: program.code,
			description: program.description || '',
			duration_years: program.duration_years,
			is_active: program.is_active,
		});
		setEditingProgram(program);
		setShowProgramForm(true);
	};

	const deleteDepartment = (department) => {
		const sectionsCount = department.sections?.length || 0;
		const programsCount = department.programs?.length || 0;
		
		let message = `Are you sure you want to delete "${department.name}"?`;
		if (programsCount > 0) {
			message += `\n\nThis will also delete ${programsCount} associated program${programsCount > 1 ? 's' : ''}.`;
		}
		if (sectionsCount > 0) {
			message += `\n\nWARNING: This department has ${sectionsCount} associated section${sectionsCount > 1 ? 's' : ''}. You may need to reassign or delete these sections first.`;
		}
		message += '\n\nThis action cannot be undone.';
		
		if (confirm(message)) {
			router.delete(route('super.departments.destroy', department.id));
		}
	};

	const deleteProgram = (program) => {
		if (confirm('Are you sure you want to delete this program?')) {
			router.delete(route('super.programs.destroy', program.id));
		}
	};

	return (
		<AuthenticatedLayout>
			<Head title="Departments & Programs" />
			<div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-zinc-50/70">
				<div className="w-full px-6 py-8 space-y-6">
					{/* Header */}
					<div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
									Departments
								</h2>
								<p className="text-gray-600 mt-2 text-lg">
									Manage departments and their programs
								</p>
							</div>
						</div>
					</div>
					{flash.success && (
						<div className="pointer-events-none fixed right-6 top-6 z-50 flex items-center gap-3 rounded-lg bg-green-600 px-4 py-3 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">
							<svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
							<span>{flash.success}</span>
						</div>
					)}
					{flash.error && (
						<div className="pointer-events-none fixed right-6 top-6 z-50 flex items-center gap-3 rounded-lg bg-red-600 px-4 py-3 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">
							<svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
							<span>{flash.error}</span>
						</div>
					)}

					{/* Department Management */}
					<div className="card">
						<div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
							<h3 className="text-lg font-semibold text-gray-900">Departments</h3>
							<button
								onClick={() => {
									resetDepartment();
									setEditingDepartment(null);
									setShowDepartmentForm(true);
								}}
								className="btn-primary"
							>
								Add Department
							</button>
						</div>

						<div className="p-6">
							<div className="space-y-4">
								{departments.map((department) => (
									<div key={department.id} className="rounded-lg border border-gray-200 p-4">
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<div className="flex items-center gap-3">
													<h4 className="text-lg font-semibold text-gray-900">{department.name}</h4>
													<span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">{department.code}</span>
													{department.is_active ? (
														<span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Active</span>
													) : (
														<span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">Inactive</span>
													)}
												</div>
												{department.description && (
													<p className="mt-1 text-sm text-gray-600">{department.description}</p>
												)}
												<p className="mt-2 text-sm text-gray-500">{department.programs?.length || 0} programs</p>
											</div>
											<div className="flex items-center gap-2">
												<button
													onClick={() => editDepartment(department)}
													className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
												>
													Edit
												</button>
												<button
													onClick={() => deleteDepartment(department)}
													className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700"
												>
													Delete
												</button>
											</div>
										</div>

										{/* Programs for this department */}
										<div className="mt-4">
											<div className="flex items-center justify-between mb-3">
												<h5 className="text-sm font-medium text-gray-700">Programs</h5>
												<button
													onClick={() => {
														setProgramData('department_id', department.id);
														setEditingProgram(null);
														setShowProgramForm(true);
														setSelectedDepartment(department);
													}}
													className="text-sm text-brand-primary hover:text-brand-secondary"
												>
													+ Add Program
												</button>
											</div>
											<div className="space-y-2">
												{department.programs?.map((program) => (
													<div key={program.id} className="flex items-center justify-between rounded-md bg-gray-50 p-3">
														<div className="flex-1">
															<div className="flex items-center gap-2">
																<span className="font-medium text-gray-900">{program.name}</span>
																<span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700">{program.code}</span>
																<span className="text-xs text-gray-500">{program.duration_years} years</span>
																{program.is_active ? (
																	<span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Active</span>
																) : (
																	<span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">Inactive</span>
																)}
															</div>
															{program.description && (
																<p className="mt-1 text-xs text-gray-600">{program.description}</p>
															)}
														</div>
														<div className="flex items-center gap-1">
															<button
																onClick={() => editProgram(program)}
																className="rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white hover:bg-blue-600"
															>
																Edit
															</button>
															<button
																onClick={() => deleteProgram(program)}
																className="rounded-md bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
															>
																Delete
															</button>
														</div>
													</div>
												))}
												{department.programs?.length === 0 && (
													<p className="text-sm text-gray-500">No programs added yet.</p>
												)}
											</div>
										</div>
									</div>
								))}
								{departments.length === 0 && (
									<p className="text-center text-gray-500">No departments created yet.</p>
								)}
							</div>
						</div>
					</div>

					{/* Department Form Modal */}
					{showDepartmentForm && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm sm:p-6">
							<div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
								<div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-5 backdrop-blur">
									<div>
										<p className={`text-xs font-semibold uppercase tracking-widest ${isEditingDepartment ? 'text-blue-600' : 'text-brand-primary'}`}>
											{isEditingDepartment ? 'Department Update' : 'Department Setup'}
										</p>
										<h3 className="text-xl font-bold text-gray-900">
											{editingDepartment ? 'Edit Department' : 'Add Department'}
										</h3>
										<p className="mt-0.5 text-sm text-gray-500">
											{isEditingDepartment ? 'Review and update department details.' : 'Define department details and status.'}
										</p>
									</div>
									<button
										onClick={closeDepartmentForm}
										className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-4 focus:ring-brand-primary/10"
										aria-label="Close"
									>
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
								<form onSubmit={submitDepartment}>
									<div className="space-y-5 p-6">
										{isEditingDepartment && (
											<div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
												<div className="flex flex-wrap items-center gap-2 text-sm text-blue-900">
													<span className="font-semibold">Editing:</span>
													<span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-800">
														{editingDepartment?.name || 'Department'}
													</span>
													<span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-800">
														{editingDepartment?.code || 'N/A'}
													</span>
													<span className="text-xs text-blue-700">
														Programs: {editingDepartment?.programs?.length || 0}
													</span>
												</div>
											</div>
										)}
										{(duplicateNameDepartment || duplicateCodeDepartment) && (
											<div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
												<div className="font-semibold">Department already exists</div>
												<div className="mt-1 space-y-1">
													{duplicateNameDepartment && (
														<div>Name matches: {duplicateNameDepartment.name}</div>
													)}
													{duplicateCodeDepartment && (
														<div>Code matches: {duplicateCodeDepartment.code}</div>
													)}
												</div>
											</div>
										)}
										{(departmentErrors.name || departmentErrors.code) && (
											<div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
												Department already exists. Please use a different name or code.
											</div>
										)}
										<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
											<div>
												<label className="block text-sm font-medium text-gray-700">
													Name
												</label>
												<input
													type="text"
													value={departmentData.name}
													onChange={(e) => setDepartmentData('name', e.target.value)}
													className="mt-2 block w-full rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
													placeholder="e.g. College of Engineering"
													required
												/>
												<InputError message={departmentErrors.name} className="mt-2" />
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700">
													Code
												</label>
												<input
													type="text"
													value={departmentData.code}
													onChange={(e) => setDepartmentData('code', e.target.value.toUpperCase())}
													className="mt-2 block w-full rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
													required
													maxLength="10"
													placeholder="e.g. COE"
												/>
												<p className="mt-1 text-xs text-gray-500">Use a short unique code (max 10 characters).</p>
												<InputError message={departmentErrors.code} className="mt-2" />
											</div>
											<div className="sm:col-span-2">
												<label className="block text-sm font-medium text-gray-700">
													Description
												</label>
												<textarea
													value={departmentData.description}
													onChange={(e) => setDepartmentData('description', e.target.value)}
													rows={4}
													className="mt-2 block w-full rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
													placeholder="Optional description about this department..."
												/>
												<InputError message={departmentErrors.description} className="mt-2" />
											</div>
											<div className="sm:col-span-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
												<label className="flex cursor-pointer items-center gap-3">
													<input
														type="checkbox"
														checked={departmentData.is_active}
														onChange={(e) => setDepartmentData('is_active', e.target.checked)}
														className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
													/>
													<span className="text-sm font-medium text-gray-900">Department is active</span>
												</label>
												<p className="mt-1 text-xs text-gray-500">
													{isEditingDepartment
														? 'Turning this off keeps existing records but may remove it from active workflows.'
														: 'Inactive departments remain in records but can be hidden from active workflows.'}
												</p>
											</div>
										</div>
									</div>
									<div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
										<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
											<button
												type="button"
												onClick={closeDepartmentForm}
												className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-brand-primary/10"
											>
												Cancel
											</button>
											<button
												type="submit"
												disabled={departmentProcessing || duplicateNameDepartment || duplicateCodeDepartment}
												className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-primary to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-brand-primary/90 hover:to-emerald-600/90 focus:outline-none focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
											>
												{departmentProcessing
													? (editingDepartment ? 'Updating...' : 'Creating...')
													: `${editingDepartment ? 'Update' : 'Create'} Department`}
											</button>
										</div>
									</div>
								</form>
							</div>
						</div>
					)}
 
					{/* Program Form Modal */}
					{showProgramForm && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm sm:p-6">
							<div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
								<div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-5 backdrop-blur">
									<div>
										<p className={`text-xs font-semibold uppercase tracking-widest ${isEditingProgram ? 'text-blue-600' : 'text-brand-primary'}`}>
											{isEditingProgram ? 'Program Update' : 'Program Setup'}
										</p>
										<h3 className="text-xl font-bold text-gray-900">
											{editingProgram ? 'Edit Program' : 'Add Program'}
										</h3>
										<p className="mt-0.5 text-sm text-gray-500">
											{isEditingProgram ? 'Review and update program details.' : 'Define program details and status.'}
										</p>
									</div>
									<button
										onClick={closeProgramForm}
										className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-4 focus:ring-brand-primary/10"
										aria-label="Close"
									>
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
								<form onSubmit={submitProgram}>
									<div className="space-y-5 p-6">
										{isEditingProgram && (
											<div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
												<div className="flex flex-wrap items-center gap-2 text-sm text-blue-900">
													<span className="font-semibold">Editing:</span>
													<span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-800">
														{editingProgram?.name || 'Program'}
													</span>
													<span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-800">
														{editingProgram?.code || 'N/A'}
													</span>
													{selectedDepartment?.name && (
														<span className="text-xs text-blue-700">
															Department: {selectedDepartment.name}
														</span>
													)}
												</div>
											</div>
										)}
									{(duplicateNameProgram || duplicateCodeProgram) && (
										<div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
											<div className="font-semibold">Program already exists</div>
											<div className="mt-1 space-y-1">
												{duplicateNameProgram && (
													<div>Name matches: {duplicateNameProgram.name}</div>
												)}
												{duplicateCodeProgram && (
													<div>Code matches: {duplicateCodeProgram.code}</div>
												)}
											</div>
										</div>
									)}
									{(programErrors.name || programErrors.code) && (
										<div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
											Program already exists. Please use a different name or code.
										</div>
									)}
									<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
										<div className="sm:col-span-2">
											<label className="block text-sm font-medium text-gray-700">Department</label>
											<select
												value={programData.department_id}
												onChange={(e) => setProgramData('department_id', e.target.value)}
												className="mt-2 block w-full rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
												required
											>
												<option value="">Select Department</option>
												{departments.map((dept) => (
													<option key={dept.id} value={dept.id}>{dept.name}</option>
												))}
											</select>
											<InputError message={programErrors.department_id} className="mt-2" />
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700">Name</label>
											<input
												type="text"
												value={programData.name}
												onChange={(e) => setProgramData('name', e.target.value)}
												className="mt-2 block w-full rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
												required
												placeholder="e.g. BS Computer Science"
											/>
											<InputError message={programErrors.name} className="mt-2" />
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700">Code</label>
											<input
												type="text"
												value={programData.code}
												onChange={(e) => setProgramData('code', e.target.value.toUpperCase())}
												className="mt-2 block w-full rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
												required
												maxLength="10"
												placeholder="e.g. BSCS"
											/>
											<p className="mt-1 text-xs text-gray-500">Use a short unique code (max 10 characters).</p>
											<InputError message={programErrors.code} className="mt-2" />
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700">Duration (Years)</label>
											<input
												type="number"
												value={programData.duration_years}
												onChange={(e) => setProgramData('duration_years', parseInt(e.target.value))}
												className="mt-2 block w-full rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
												min="1"
												max="10"
												required
											/>
											<InputError message={programErrors.duration_years} className="mt-2" />
										</div>
										<div className="sm:col-span-2">
											<label className="block text-sm font-medium text-gray-700">Description</label>
											<textarea
												value={programData.description}
												onChange={(e) => setProgramData('description', e.target.value)}
												rows={4}
												className="mt-2 block w-full rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
												placeholder="Optional description about this program..."
											/>
											<InputError message={programErrors.description} className="mt-2" />
										</div>
										<div className="sm:col-span-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
											<label className="flex cursor-pointer items-center gap-3">
												<input
													type="checkbox"
													checked={programData.is_active}
													onChange={(e) => setProgramData('is_active', e.target.checked)}
													className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
												/>
												<span className="text-sm font-medium text-gray-900">Program is active</span>
											</label>
											<p className="mt-1 text-xs text-gray-500">
												{isEditingProgram
													? 'Turning this off keeps existing records but may remove it from active selections.'
													: 'Inactive programs remain in records but can be hidden from active workflows.'}
											</p>
										</div>
									</div>
									</div>
									<div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
										<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
											<button
												type="button"
												onClick={closeProgramForm}
												className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-brand-primary/10"
											>
												Cancel
											</button>
											<button
												type="submit"
												disabled={programProcessing || duplicateNameProgram || duplicateCodeProgram}
												className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-primary to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-brand-primary/90 hover:to-emerald-600/90 focus:outline-none focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
											>
												{programProcessing
													? (editingProgram ? 'Updating...' : 'Creating...')
													: `${editingProgram ? 'Update' : 'Create'} Program`}
											</button>
										</div>
									</div>
								</form>
							</div>
						</div>
					)}
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
