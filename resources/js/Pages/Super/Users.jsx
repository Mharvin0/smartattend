import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Users({ users, deactivatedCount = 0, roles, departments = [] }) {
	const { data, setData, post, processing } = useForm({
		name: '', email: '', role: 'Admin', department_id: '', optional_department_id: '',
	});
	const flash = usePage().props.flash || {};
	
	// Tab state
	const [activeTab, setActiveTab] = useState('active');
	
	// Edit state
	const [editingUser, setEditingUser] = useState(null);
	const [showEditModal, setShowEditModal] = useState(false);
	const editForm = useForm({
		name: '',
		email: '',
		role: 'Admin',
		department_id: '',
		optional_department_id: '',
	});
	
	// Deactivated users state
	const [deactivatedUsers, setDeactivatedUsers] = useState([]);
	const [isLoadingDeactivated, setIsLoadingDeactivated] = useState(false);

	const submitCreate = (e) => {
		e.preventDefault();
		post(route('super.users.store'), {
			onSuccess: () => {
				setData({
					name: '',
					email: '',
					role: 'Admin',
					department_id: '',
					optional_department_id: '',
				});
			},
		});
	};
	
	const handleEdit = (user) => {
		setEditingUser(user);
		editForm.setData({
			name: user.name || '',
			email: user.email || '',
			role: user.roles?.[0]?.name || 'Admin',
			department_id: user.department_id || '',
			optional_department_id: user.optional_department_id || '',
		});
		setShowEditModal(true);
	};
	
	const submitEdit = (e) => {
		e.preventDefault();
		editForm.patch(route('super.users.update', editingUser.id), {
			onSuccess: () => {
				setShowEditModal(false);
				setEditingUser(null);
				editForm.reset();
			},
		});
	};
	
	const handleDeactivate = (user) => {
		if (confirm(`Are you sure you want to deactivate ${user.name}?`)) {
			router.delete(route('super.users.destroy', user.id), {
				onSuccess: () => {
					router.reload({ only: ['users', 'deactivatedCount'] });
				},
			});
		}
	};
	
	const handleRestore = (user) => {
		if (confirm(`Are you sure you want to reactivate ${user.name}?`)) {
			router.post(route('super.users.restore', user.id), {}, {
				onSuccess: () => {
					fetchDeactivatedUsers();
					router.reload({ only: ['users', 'deactivatedCount'] });
				},
			});
		}
	};
	
	const fetchDeactivatedUsers = () => {
		setIsLoadingDeactivated(true);
		fetch(route('super.users.deactivated'), {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
			},
		})
		.then(response => response.json())
		.then(data => {
			if (data.success) {
				setDeactivatedUsers(data.users || []);
			}
		})
		.catch(error => {
			console.error('Error fetching deactivated users:', error);
		})
		.finally(() => {
			setIsLoadingDeactivated(false);
		});
	};
	
	useEffect(() => {
		if (activeTab === 'deactivated') {
			fetchDeactivatedUsers();
		}
	}, [activeTab]);

	const displayUsers = activeTab === 'active' ? users : deactivatedUsers;

	return (
		<AuthenticatedLayout>
			<Head title="Users" />
			<div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-zinc-50/70">
				<div className="w-full px-6 py-8 space-y-6">
					{/* Header */}
					<div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
									Users
								</h2>
								<p className="text-gray-600 mt-2 text-lg">
									Manage system users and their roles
								</p>
							</div>
						</div>
					</div>
					{flash.success && (
						<div className="pointer-events-none fixed right-6 top-6 z-50 rounded-xl bg-green-600 px-6 py-3 text-base text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">{flash.success}</div>
					)}
					
					{/* Create User Form - Only show on Active tab */}
					{activeTab === 'active' && (
						<div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
							<div className="mb-6">
								<h3 className="text-2xl font-bold text-gray-900 mb-2">Create New User</h3>
								<p className="text-gray-600">Add a new administrator to the system</p>
								<p className="text-sm text-gray-500 mt-1">Password will be auto-generated as: {new Date().getFullYear()}{data.name.replace(/\s+/g, '') || 'FullName'}</p>
							</div>
							<form onSubmit={submitCreate} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
									<input 
										className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10" 
										placeholder="Enter full name" 
										value={data.name} 
										onChange={(e) => setData('name', e.target.value)} 
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
									<input 
										className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10" 
										placeholder="Enter email address" 
										type="email"
										value={data.email} 
										onChange={(e) => setData('email', e.target.value)} 
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
									<select 
										className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10" 
										value={data.role} 
										onChange={(e) => setData('role', e.target.value)}
									>
										{roles.map((r) => <option key={r} value={r}>{r}</option>)}
									</select>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
									<select 
										className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10" 
										value={data.department_id} 
										onChange={(e) => setData('department_id', e.target.value)}
									>
										<option value="">Select Department</option>
										{departments.map((dept) => (
											<option key={dept.id} value={dept.id}>{dept.name}</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Optional Department</label>
									<select 
										className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10" 
										value={data.optional_department_id} 
										onChange={(e) => setData('optional_department_id', e.target.value)}
									>
										<option value="">None (Optional)</option>
										{departments.filter(dept => dept.id != data.department_id).map((dept) => (
											<option key={dept.id} value={dept.id}>{dept.name}</option>
										))}
									</select>
								</div>
								<div className="md:col-span-2 lg:col-span-3">
									<button 
										disabled={processing} 
										className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-primary to-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:from-brand-primary/90 hover:to-emerald-600/90 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-brand-primary/20 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
									>
										{processing ? (
											<div className="flex items-center gap-3">
												<div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
												Creating...
											</div>
										) : (
											<div className="flex items-center gap-3">
												<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
												</svg>
												Create User
											</div>
										)}
									</button>
								</div>
							</form>
						</div>
					)}

					{/* Users Table */}
					<div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
						<div className="px-8 py-6 border-b border-gray-200">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-2xl font-bold text-gray-900 mb-2">
										{activeTab === 'active' ? 'Active Users' : 'Deactivated Users'}
									</h3>
									<p className="text-gray-600">Manage existing administrators and their roles</p>
								</div>
								{/* Tabs */}
								<div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
									<button
										onClick={() => setActiveTab('active')}
										className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
											activeTab === 'active'
												? 'bg-white text-gray-900 shadow-sm'
												: 'text-gray-600 hover:text-gray-900'
										}`}
									>
										Active ({users.length})
									</button>
									<button
										onClick={() => setActiveTab('deactivated')}
										className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
											activeTab === 'deactivated'
												? 'bg-white text-gray-900 shadow-sm'
												: 'text-gray-600 hover:text-gray-900'
										}`}
									>
										Deactivated ({deactivatedCount})
									</button>
								</div>
							</div>
						</div>
						<div className="overflow-x-auto">
							<table className="min-w-full">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
										<th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
										<th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
										<th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Departments</th>
										{activeTab === 'deactivated' && (
											<th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Deactivated At</th>
										)}
										<th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{isLoadingDeactivated && activeTab === 'deactivated' ? (
										<tr>
											<td colSpan={activeTab === 'deactivated' ? 6 : 5} className="px-8 py-12 text-center">
												<div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
												<p className="mt-2 text-sm text-gray-500">Loading...</p>
											</td>
										</tr>
									) : displayUsers.length === 0 ? (
										<tr>
											<td colSpan={activeTab === 'deactivated' ? 6 : 5} className="px-8 py-12 text-center text-sm text-gray-500">
												<div className="flex flex-col items-center">
													<svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
													</svg>
													<p className="text-lg font-medium text-gray-900">
														{activeTab === 'active' ? 'No active users found' : 'No deactivated users found'}
													</p>
												</div>
											</td>
										</tr>
									) : (
										displayUsers.map((u) => (
											<tr key={u.id} className="transition-colors hover:bg-gray-50">
												<td className="px-8 py-6">
													<div className="flex items-center">
														<div className="h-10 w-10 bg-gradient-to-br from-brand-primary to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
															{u.name.charAt(0).toUpperCase()}
														</div>
														<div className="ml-4">
															<div className="text-base font-semibold text-gray-900">{u.name}</div>
														</div>
													</div>
												</td>
												<td className="px-8 py-6">
													<div className="text-base text-gray-900">{u.email}</div>
												</td>
												<td className="px-8 py-6">
													<span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
														u.roles?.[0]?.name === 'Super Admin' 
															? 'bg-purple-100 text-purple-800' 
															: 'bg-blue-100 text-blue-800'
													}`}>
														{u.roles?.[0]?.name || 'No Role'}
													</span>
												</td>
												<td className="px-8 py-6">
													<div className="text-sm text-gray-900">
														{u.department ? (
															<div>
																<span className="font-medium">{u.department.name}</span>
																{u.optional_department && (
																	<span className="text-gray-500">, {u.optional_department.name}</span>
																)}
															</div>
														) : (
															<span className="text-gray-400">No departments assigned</span>
														)}
													</div>
												</td>
												{activeTab === 'deactivated' && (
													<td className="px-8 py-6">
														<div className="text-sm text-gray-500">
															{u.deleted_at ? new Date(u.deleted_at).toLocaleDateString() : 'N/A'}
														</div>
													</td>
												)}
												<td className="px-8 py-6">
													<div className="flex items-center space-x-2">
														{activeTab === 'active' ? (
															<>
																<button 
																	onClick={() => handleEdit(u)}
																	className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
																>
																	Edit
																</button>
																{/* Hide deactivate button for Teacher role users - they are managed in Teachers tab */}
																{u.roles?.[0]?.name !== 'Teacher' && (
																	<button 
																		onClick={() => handleDeactivate(u)}
																		className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
																	>
																		Deactivate
																	</button>
																)}
															</>
														) : (
															<button 
																onClick={() => handleRestore(u)}
																className="text-green-600 hover:text-green-800 font-medium text-sm transition-colors"
															>
																Reactivate
															</button>
														)}
													</div>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>
					
					{/* Edit User Modal */}
					{showEditModal && editingUser && (
						<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
							<div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
								<div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
									<h3 className="text-xl font-semibold text-gray-900">Edit User</h3>
									<button
										onClick={() => {
											setShowEditModal(false);
											setEditingUser(null);
											editForm.reset();
										}}
										className="text-gray-400 hover:text-gray-600"
									>
										<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
								<form onSubmit={submitEdit} className="p-6 space-y-4">
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
										<input 
											className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10" 
											placeholder="Enter full name" 
											value={editForm.data.name} 
											onChange={(e) => editForm.setData('name', e.target.value)} 
											required
										/>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
										<input 
											className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10" 
											placeholder="Enter email address" 
											type="email"
											value={editForm.data.email} 
											onChange={(e) => editForm.setData('email', e.target.value)} 
											required
										/>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
										<select 
											className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10" 
											value={editForm.data.role} 
											onChange={(e) => editForm.setData('role', e.target.value)}
										>
											{roles.map((r) => <option key={r} value={r}>{r}</option>)}
										</select>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
										<select 
											className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10" 
											value={editForm.data.department_id} 
											onChange={(e) => editForm.setData('department_id', e.target.value)}
										>
											<option value="">Select Department</option>
											{departments.map((dept) => (
												<option key={dept.id} value={dept.id}>{dept.name}</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">Optional Department</label>
										<select 
											className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10" 
											value={editForm.data.optional_department_id} 
											onChange={(e) => editForm.setData('optional_department_id', e.target.value)}
										>
											<option value="">None (Optional)</option>
											{departments.filter(dept => dept.id != editForm.data.department_id).map((dept) => (
												<option key={dept.id} value={dept.id}>{dept.name}</option>
											))}
										</select>
									</div>
									<div className="flex justify-end space-x-3 pt-4">
										<button
											type="button"
											onClick={() => {
												setShowEditModal(false);
												setEditingUser(null);
												editForm.reset();
											}}
											className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
										>
											Cancel
										</button>
										<button
											type="submit"
											disabled={editForm.processing}
											className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
										>
											{editForm.processing ? 'Saving...' : 'Save Changes'}
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
