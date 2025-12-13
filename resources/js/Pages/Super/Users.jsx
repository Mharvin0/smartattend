import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function Users({ users, roles }) {
	const { data, setData, post, processing } = useForm({
		name: '', email: '', password: '', role: 'Admin',
	});
	const flash = usePage().props.flash || {};

	const submitCreate = (e) => {
		e.preventDefault();
		post(route('super.users'));
	};

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
					
					{/* Create User Form */}
					<div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
						<div className="mb-6">
							<h3 className="text-2xl font-bold text-gray-900 mb-2">Create New User</h3>
							<p className="text-gray-600">Add a new administrator to the system</p>
						</div>
						<form onSubmit={submitCreate} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
								<label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
								<input 
									className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10" 
									placeholder="Enter password" 
									type="password" 
									value={data.password} 
									onChange={(e) => setData('password', e.target.value)} 
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
							<div className="md:col-span-2 lg:col-span-4">
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

					{/* Users Table */}
					<div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
						<div className="px-8 py-6 border-b border-gray-200">
							<h3 className="text-2xl font-bold text-gray-900 mb-2">System Users</h3>
							<p className="text-gray-600">Manage existing administrators and their roles</p>
						</div>
						<div className="overflow-x-auto">
							<table className="min-w-full">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
										<th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
										<th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
										<th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{users.map((u) => (
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
												<div className="flex items-center space-x-2">
													<button className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">
														Edit
													</button>
													{/* Hide delete button for Teacher role users - they are managed in Teachers tab */}
													{u.roles?.[0]?.name !== 'Teacher' && (
														<button className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors">
															Delete
														</button>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
