import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Departments({ departments }) {
	const { data: departmentData, setData: setDepartmentData, post: postDepartment, processing: departmentProcessing, reset: resetDepartment } = useForm({
		name: '',
		code: '',
		description: '',
		is_active: true,
	});

	const { data: programData, setData: setProgramData, post: postProgram, processing: programProcessing, reset: resetProgram } = useForm({
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

	const submitDepartment = (e) => {
		e.preventDefault();
		if (editingDepartment) {
			postDepartment(route('super.departments.update', editingDepartment.id), {
				onSuccess: () => {
					resetDepartment();
					setEditingDepartment(null);
					setShowDepartmentForm(false);
				}
			});
		} else {
			postDepartment(route('super.departments.store'), {
				onSuccess: () => {
					resetDepartment();
					setShowDepartmentForm(false);
				}
			});
		}
	};

	const submitProgram = (e) => {
		e.preventDefault();
		if (editingProgram) {
			postProgram(route('super.programs.update', editingProgram.id), {
				onSuccess: () => {
					resetProgram();
					setEditingProgram(null);
					setShowProgramForm(false);
				}
			});
		} else {
			postProgram(route('super.programs.store'), {
				onSuccess: () => {
					resetProgram();
					setShowProgramForm(false);
				}
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
		if (confirm('Are you sure you want to delete this department? This will also delete all associated programs.')) {
			postDepartment(route('super.departments.destroy', department.id), {
				method: 'delete',
			});
		}
	};

	const deleteProgram = (program) => {
		if (confirm('Are you sure you want to delete this program?')) {
			postProgram(route('super.programs.destroy', program.id), {
				method: 'delete',
			});
		}
	};

	return (
		<AuthenticatedLayout header={<h2 className="text-2xl font-bold leading-tight text-gray-800">Departments & Programs</h2>}>
			<Head title="Departments & Programs" />
			<div className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-emerald-50/80 to-brand-secondary/5 py-8">
				<div className="mx-auto max-w-full space-y-10 px-4 sm:px-6 lg:px-8 xl:px-12">
					{flash.success && (
						<div className="pointer-events-none fixed right-6 top-6 z-50 rounded bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">{flash.success}</div>
					)}

					{/* Department Management */}
					<div className="card">
						<div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
							<h3 className="text-lg font-semibold text-gray-900">Departments</h3>
							<button
								onClick={() => {
									resetDepartment();
									setEditingDepartment(null);
									setShowDepartmentForm(!showDepartmentForm);
								}}
								className="btn-primary"
							>
								{showDepartmentForm ? 'Cancel' : 'Add Department'}
							</button>
						</div>

						{showDepartmentForm && (
							<form onSubmit={submitDepartment} className="border-b border-gray-200 p-6">
								<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
									<div>
										<label className="block text-sm font-medium text-gray-700">Name</label>
										<input
											type="text"
											value={departmentData.name}
											onChange={(e) => setDepartmentData('name', e.target.value)}
											className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary"
											required
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700">Code</label>
										<input
											type="text"
											value={departmentData.code}
											onChange={(e) => setDepartmentData('code', e.target.value.toUpperCase())}
											className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary"
											required
											maxLength="10"
										/>
									</div>
									<div className="sm:col-span-2">
										<label className="block text-sm font-medium text-gray-700">Description</label>
										<textarea
											value={departmentData.description}
											onChange={(e) => setDepartmentData('description', e.target.value)}
											rows={3}
											className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary"
										/>
									</div>
									<div className="flex items-center">
										<input
											type="checkbox"
											checked={departmentData.is_active}
											onChange={(e) => setDepartmentData('is_active', e.target.checked)}
											className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
										/>
										<label className="ml-2 block text-sm text-gray-900">Active</label>
									</div>
								</div>
								<div className="mt-6 flex justify-end space-x-3">
									<button
										type="button"
										onClick={() => {
											resetDepartment();
											setEditingDepartment(null);
											setShowDepartmentForm(false);
										}}
										className="btn-secondary"
									>
										Cancel
									</button>
									<button type="submit" disabled={departmentProcessing} className="btn-primary">
										{editingDepartment ? 'Update' : 'Create'} Department
									</button>
								</div>
							</form>
						)}

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

					{/* Program Form Modal */}
					{showProgramForm && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
							<div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
								<h3 className="mb-4 text-lg font-semibold text-gray-900">
									{editingProgram ? 'Edit Program' : 'Add Program'}
								</h3>
								<form onSubmit={submitProgram}>
									<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
										<div className="sm:col-span-2">
											<label className="block text-sm font-medium text-gray-700">Department</label>
											<select
												value={programData.department_id}
												onChange={(e) => setProgramData('department_id', e.target.value)}
												className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary"
												required
											>
												<option value="">Select Department</option>
												{departments.map((dept) => (
													<option key={dept.id} value={dept.id}>{dept.name}</option>
												))}
											</select>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700">Name</label>
											<input
												type="text"
												value={programData.name}
												onChange={(e) => setProgramData('name', e.target.value)}
												className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary"
												required
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700">Code</label>
											<input
												type="text"
												value={programData.code}
												onChange={(e) => setProgramData('code', e.target.value.toUpperCase())}
												className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary"
												required
												maxLength="10"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700">Duration (Years)</label>
											<input
												type="number"
												value={programData.duration_years}
												onChange={(e) => setProgramData('duration_years', parseInt(e.target.value))}
												className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary"
												min="1"
												max="10"
												required
											/>
										</div>
										<div className="sm:col-span-2">
											<label className="block text-sm font-medium text-gray-700">Description</label>
											<textarea
												value={programData.description}
												onChange={(e) => setProgramData('description', e.target.value)}
												rows={3}
												className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary"
											/>
										</div>
										<div className="flex items-center">
											<input
												type="checkbox"
												checked={programData.is_active}
												onChange={(e) => setProgramData('is_active', e.target.checked)}
												className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
											/>
											<label className="ml-2 block text-sm text-gray-900">Active</label>
										</div>
									</div>
									<div className="mt-6 flex justify-end space-x-3">
										<button
											type="button"
											onClick={() => {
												resetProgram();
												setEditingProgram(null);
												setShowProgramForm(false);
												setSelectedDepartment(null);
											}}
											className="btn-secondary"
										>
											Cancel
										</button>
										<button type="submit" disabled={programProcessing} className="btn-primary">
											{editingProgram ? 'Update' : 'Create'} Program
										</button>
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
