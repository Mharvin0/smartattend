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
		<AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Users</h2>}>
			<Head title="Users" />
			<div className="py-6">
				<div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">
					{flash.success && (
						<div className="pointer-events-none fixed right-6 top-6 z-50 rounded bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">{flash.success}</div>
					)}
					<div className="card">
						<form onSubmit={submitCreate} className="grid grid-cols-1 gap-3 md:grid-cols-4">
							<input className="rounded border px-2 py-1" placeholder="Name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
							<input className="rounded border px-2 py-1" placeholder="Email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
							<input className="rounded border px-2 py-1" placeholder="Password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} />
							<select className="rounded border px-2 py-1" value={data.role} onChange={(e) => setData('role', e.target.value)}>
								{roles.map((r) => <option key={r}>{r}</option>)}
							</select>
							<div className="md:col-span-4">
								<button disabled={processing} className="btn-primary">Create</button>
							</div>
						</form>
					</div>

					<div className="card">
						<table className="min-w-full text-left text-sm">
							<thead><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Role</th></tr></thead>
							<tbody>
								{users.map((u) => (
									<tr key={u.id} className="transition-colors hover:bg-gray-50"><td className="px-3 py-2">{u.name}</td><td className="px-3 py-2">{u.email}</td><td className="px-3 py-2">{u.roles?.[0]?.name || ''}</td></tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
