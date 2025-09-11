import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Interventions({ interventions, students, filters }) {
	const { data, setData, post, processing, reset } = useForm({
		student_id: '', date: new Date().toISOString().slice(0,10), type: '', details: '', action_taken: '', responsible_staff: '', follow_up_date: '', outcome: '', status: 'open', priority: 'medium', due_date: ''
	});

	const [selectedItems, setSelectedItems] = useState([]);
	const [showFilters, setShowFilters] = useState(false);
	const [editingIntervention, setEditingIntervention] = useState(null);

	const interventionTemplates = [
		{
			id: 'chronic_absence',
			name: 'Chronic Absence',
			type: 'Chronic Absence',
			details: 'Student has missed 3+ consecutive days or 10%+ of total attendance',
			action_taken: 'Contact parent/guardian, schedule meeting, review attendance policy',
			priority: 'high',
			status: 'open'
		},
		{
			id: 'tardiness',
			name: 'Frequent Tardiness',
			type: 'Tardiness',
			details: 'Student consistently arrives late to class',
			action_taken: 'Discuss punctuality expectations, implement arrival tracking',
			priority: 'medium',
			status: 'open'
		},
		{
			id: 'behavioral',
			name: 'Behavioral Issues',
			type: 'Behavioral',
			details: 'Disruptive behavior affecting learning environment',
			action_taken: 'Behavioral intervention plan, parent conference, counseling referral',
			priority: 'high',
			status: 'open'
		},
		{
			id: 'academic',
			name: 'Academic Performance',
			type: 'Academic',
			details: 'Declining grades or academic concerns',
			action_taken: 'Academic support plan, tutoring referral, progress monitoring',
			priority: 'medium',
			status: 'open'
		},
		{
			id: 'family_engagement',
			name: 'Family Engagement',
			type: 'Family Engagement',
			details: 'Limited family involvement in student education',
			action_taken: 'Outreach to family, home visits, communication plan',
			priority: 'low',
			status: 'open'
		}
	];

	const submit = (e) => { e.preventDefault(); post(route('admin.interventions.store'), { onSuccess: () => reset() }); };

	const handleFilter = (key, value) => {
		router.get(route('admin.interventions'), { ...filters, [key]: value }, { preserveState: true });
	};

	const handleBulkAction = (action, value) => {
		if (selectedItems.length === 0) return;
		
		const formData = new FormData();
		formData.append('action', action);
		formData.append('value', value ?? '');
		selectedItems.forEach((id) => formData.append('ids[]', id));
		
		router.post(route('admin.interventions.bulk'), formData, {
			onSuccess: () => setSelectedItems([])
		});
	};

	const toggleSelect = (id) => {
		setSelectedItems(prev => 
			prev.includes(id) 
				? prev.filter(item => item !== id)
				: [...prev, id]
		);
	};

	const selectAll = () => {
		const allIds = interventions.data.map(i => i.id);
		setSelectedItems(allIds);
	};

	const applyTemplate = (template) => {
		setData({
			...data,
			type: template.type,
			details: template.details,
			action_taken: template.action_taken,
			priority: template.priority,
			status: template.status
		});
	};

	return (
		<AuthenticatedLayout header={<h2 className="text-2xl font-bold leading-tight text-gray-800">Interventions</h2>}>
			<Head title="Interventions" />
			<div className="min-h-screen py-8">
				<div className="mx-auto max-w-full space-y-10 px-4 sm:px-6 lg:px-8 xl:px-12">
					{/* Filters and Actions Bar */}
					<div className="card p-8">
						<div className="flex flex-wrap items-center justify-between gap-8">
							<div className="flex flex-wrap items-center gap-6">
								<button 
									onClick={() => setShowFilters(!showFilters)}
									className="btn-secondary text-lg px-8 py-4"
								>
									{showFilters ? 'Hide' : 'Show'} Filters
								</button>
								
								{showFilters && (
									<>
										<select 
											value={filters.status || ''} 
											onChange={(e) => handleFilter('status', e.target.value)}
											className="rounded-lg border px-6 py-4 text-lg"
										>
											<option value="">All Statuses</option>
											<option value="open">Open</option>
											<option value="in_progress">In Progress</option>
											<option value="resolved">Resolved</option>
											<option value="archived">Archived</option>
										</select>
										
										<select 
											value={filters.priority || ''} 
											onChange={(e) => handleFilter('priority', e.target.value)}
											className="rounded-lg border px-6 py-4 text-lg"
										>
											<option value="">All Priorities</option>
											<option value="low">Low</option>
											<option value="medium">Medium</option>
											<option value="high">High</option>
										</select>
										
										<input 
											type="date" 
											value={filters.date || ''} 
											onChange={(e) => handleFilter('date', e.target.value)}
											className="rounded-lg border px-6 py-4 text-lg"
										/>
										
										<button 
											onClick={() => router.get(route('admin.interventions'))}
											className="btn-secondary text-lg px-8 py-4"
										>
											Clear Filters
										</button>
									</>
								)}
							</div>
							
							{selectedItems.length > 0 && (
								<div className="flex items-center gap-6">
									<span className="text-lg font-medium text-gray-600">{selectedItems.length} selected</span>
									<select 
										onChange={(e) => handleBulkAction('status', e.target.value)}
										className="rounded-lg border px-6 py-4 text-lg"
									>
										<option value="">Change Status</option>
										<option value="open">Open</option>
										<option value="in_progress">In Progress</option>
										<option value="resolved">Resolved</option>
										<option value="archived">Archived</option>
									</select>
									<select 
										onChange={(e) => handleBulkAction('priority', e.target.value)}
										className="rounded-lg border px-6 py-4 text-lg"
									>
										<option value="">Change Priority</option>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
									</select>
									<button 
										onClick={() => handleBulkAction('delete', '')}
										className="btn-secondary text-lg px-8 py-4 text-red-600 hover:text-red-700"
									>
										Delete Selected
									</button>
								</div>
							)}
						</div>
					</div>

					<div className="card p-8">
						{/* Template Selection */}
						<div className="mb-8 border-b pb-8">
							<h3 className="text-2xl font-semibold text-gray-700 mb-6">Quick Templates</h3>
							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
								{interventionTemplates.map((template) => (
									<button
										key={template.id}
										type="button"
										onClick={() => applyTemplate(template)}
										className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-8 py-4 text-lg font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 transition-colors duration-200"
									>
										{template.name}
									</button>
								))}
							</div>
						</div>

						<form onSubmit={submit} className="grid grid-cols-1 gap-8 md:grid-cols-4">
							<select className="rounded-lg border px-6 py-4 text-lg" value={data.student_id} onChange={(e) => setData('student_id', e.target.value)}>
								<option value="">Student</option>
								{students.map((s) => <option key={s.id} value={s.id}>{s.last_name}, {s.first_name}</option>)}
							</select>
							<input className="rounded-lg border px-6 py-4 text-lg" type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} />
							<input className="rounded-lg border px-6 py-4 text-lg" placeholder="Type" value={data.type} onChange={(e) => setData('type', e.target.value)} />
							<div className="grid grid-cols-2 gap-6 md:col-span-1">
								<select className="rounded-lg border px-6 py-4 text-lg" value={data.status} onChange={(e) => setData('status', e.target.value)}>
									<option value="open">Status: Open</option>
									<option value="in_progress">Status: In Progress</option>
									<option value="resolved">Status: Resolved</option>
									<option value="archived">Status: Archived</option>
								</select>
								<select className="rounded-lg border px-6 py-4 text-lg" value={data.priority} onChange={(e) => setData('priority', e.target.value)}>
									<option value="low">Priority: Low</option>
									<option value="medium">Priority: Medium</option>
									<option value="high">Priority: High</option>
								</select>
							</div>
							<input className="rounded-lg border px-6 py-4 text-lg md:col-span-4" placeholder="Details" value={data.details} onChange={(e) => setData('details', e.target.value)} />
							<input className="rounded-lg border px-6 py-4 text-lg md:col-span-4" placeholder="Action Taken" value={data.action_taken} onChange={(e) => setData('action_taken', e.target.value)} />
							<input className="rounded-lg border px-6 py-4 text-lg" placeholder="Responsible Staff" value={data.responsible_staff} onChange={(e) => setData('responsible_staff', e.target.value)} />
							<input className="rounded-lg border px-6 py-4 text-lg" type="date" placeholder="Follow-up Date" value={data.follow_up_date || ''} onChange={(e) => setData('follow_up_date', e.target.value)} />
							<input className="rounded-lg border px-6 py-4 text-lg" type="date" placeholder="Due Date" value={data.due_date || ''} onChange={(e) => setData('due_date', e.target.value)} />
							<input className="rounded-lg border px-6 py-4 text-lg" placeholder="Outcome" value={data.outcome} onChange={(e) => setData('outcome', e.target.value)} />
							<div className="md:col-span-4"><button className="btn-primary text-xl px-10 py-5" disabled={processing}>Add Intervention</button></div>
						</form>
					</div>

					<div className="card p-8">
						<table className="min-w-full text-left text-lg">
							<thead>
								<tr>
									<th className="px-6 py-6">
										<input 
											type="checkbox" 
											checked={selectedItems.length === interventions.data.length && interventions.data.length > 0}
											onChange={selectAll}
											className="rounded border-gray-300 h-6 w-6"
										/>
									</th>
									<th className="px-6 py-6 text-xl font-semibold">Student</th>
									<th className="px-6 py-6 text-xl font-semibold">Date</th>
									<th className="px-6 py-6 text-xl font-semibold">Type</th>
									<th className="px-6 py-6 text-xl font-semibold">Status</th>
									<th className="px-6 py-6 text-xl font-semibold">Priority</th>
									<th className="px-6 py-6 text-xl font-semibold">Due</th>
									<th className="px-6 py-6 text-xl font-semibold">Outcome</th>
									<th className="px-6 py-6 text-xl font-semibold text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{interventions.data.map((i) => (
									<tr key={i.id} className="hover:bg-gray-50">
										<td className="px-6 py-6">
											<input 
												type="checkbox" 
												checked={selectedItems.includes(i.id)}
												onChange={() => toggleSelect(i.id)}
												className="rounded border-gray-300 h-6 w-6"
											/>
										</td>
										<td className="px-6 py-6 text-lg font-medium">{i.student?.last_name}, {i.student?.first_name}</td>
										<td className="px-6 py-6 text-lg">{i.date}</td>
										<td className="px-6 py-6 text-lg">{i.type}</td>
										<td className="px-6 py-6">
											<span className={`rounded-lg px-4 py-2 text-base font-medium ${i.status === 'resolved' ? 'bg-green-100 text-green-700' : i.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : i.status === 'archived' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-800'}`}>{i.status?.replace('_',' ') || 'open'}</span>
										</td>
										<td className="px-6 py-6">
											<span className={`rounded-lg px-4 py-2 text-base font-medium ${i.priority === 'high' ? 'bg-red-100 text-red-700' : i.priority === 'low' ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'}`}>{i.priority || 'medium'}</span>
										</td>
										<td className="px-6 py-6 text-lg">{i.due_date || '-'}</td>
										<td className="px-6 py-6 text-lg">{i.outcome}</td>
										<td className="px-6 py-6 text-right">
											<div className="flex items-center justify-end gap-4">
												<button 
													onClick={() => setEditingIntervention(i)}
													className="btn-secondary text-lg px-6 py-3"
												>
													Edit
												</button>
												<Link as="button" method="delete" href={route('admin.interventions.destroy', i.id)} className="btn-secondary text-lg px-6 py-3 text-red-600 hover:text-red-700">Delete</Link>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						<div className="mt-8 flex flex-wrap items-center gap-4">
							{interventions.links.map((l, idx) => (
								<Link key={idx} href={l.url || '#'} className={`rounded-lg px-6 py-3 text-lg font-medium ${l.active ? 'bg-brand-secondary text-black' : 'bg-gray-100 hover:bg-gray-200'}`} dangerouslySetInnerHTML={{ __html: l.label }} />
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Edit Intervention Slide-over */}
			{editingIntervention && (
				<div className="fixed inset-0 z-50 overflow-hidden">
					<div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setEditingIntervention(null)}></div>
					<div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl">
						<div className="flex h-full flex-col">
							<div className="flex items-center justify-between border-b px-8 py-6">
								<h3 className="text-2xl font-bold">Edit Intervention</h3>
								<button 
									onClick={() => setEditingIntervention(null)}
									className="text-gray-400 hover:text-gray-600 p-2"
								>
									<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
							
							<div className="flex-1 overflow-y-auto p-8">
								<EditInterventionForm 
									intervention={editingIntervention} 
									students={students}
									onClose={() => setEditingIntervention(null)}
								/>
							</div>
						</div>
					</div>
				</div>
			)}
		</AuthenticatedLayout>
	);
}

// Edit Intervention Form Component
function EditInterventionForm({ intervention, students, onClose }) {
	const { data, setData, put, processing, errors } = useForm({
		student_id: intervention.student_id || '',
		date: intervention.date || '',
		type: intervention.type || '',
		details: intervention.details || '',
		action_taken: intervention.action_taken || '',
		responsible_staff: intervention.responsible_staff || '',
		follow_up_date: intervention.follow_up_date || '',
		outcome: intervention.outcome || '',
		status: intervention.status || 'open',
		priority: intervention.priority || 'medium',
		due_date: intervention.due_date || '',
	});

	const submit = (e) => {
		e.preventDefault();
		put(route('admin.interventions.update', intervention.id), {
			onSuccess: () => onClose()
		});
	};

	return (
		<form onSubmit={submit} className="space-y-6">
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<label className="block text-lg font-semibold text-gray-700 mb-2">Student</label>
					<select 
						className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary px-4 py-3 text-base"
						value={data.student_id} 
						onChange={(e) => setData('student_id', e.target.value)}
					>
						<option value="">Select Student</option>
						{students.map((s) => (
							<option key={s.id} value={s.id}>{s.last_name}, {s.first_name}</option>
						))}
					</select>
					{errors.student_id && <div className="mt-2 text-base text-red-600">{errors.student_id}</div>}
				</div>

				<div>
					<label className="block text-lg font-semibold text-gray-700 mb-2">Date</label>
					<input 
						type="date" 
						className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary px-4 py-3 text-base"
						value={data.date} 
						onChange={(e) => setData('date', e.target.value)}
					/>
					{errors.date && <div className="mt-2 text-base text-red-600">{errors.date}</div>}
				</div>

				<div>
					<label className="block text-lg font-semibold text-gray-700 mb-2">Type</label>
					<input 
						type="text" 
						className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary px-4 py-3 text-base"
						value={data.type} 
						onChange={(e) => setData('type', e.target.value)}
					/>
					{errors.type && <div className="mt-2 text-base text-red-600">{errors.type}</div>}
				</div>

				<div>
					<label className="block text-lg font-semibold text-gray-700 mb-2">Status</label>
					<select 
						className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary px-4 py-3 text-base"
						value={data.status} 
						onChange={(e) => setData('status', e.target.value)}
					>
						<option value="open">Open</option>
						<option value="in_progress">In Progress</option>
						<option value="resolved">Resolved</option>
						<option value="archived">Archived</option>
					</select>
				</div>

				<div>
					<label className="block text-lg font-semibold text-gray-700 mb-2">Priority</label>
					<select 
						className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary px-4 py-3 text-base"
						value={data.priority} 
						onChange={(e) => setData('priority', e.target.value)}
					>
						<option value="low">Low</option>
						<option value="medium">Medium</option>
						<option value="high">High</option>
					</select>
				</div>

				<div>
					<label className="block text-lg font-semibold text-gray-700 mb-2">Due Date</label>
					<input 
						type="date" 
						className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary px-4 py-3 text-base"
						value={data.due_date} 
						onChange={(e) => setData('due_date', e.target.value)}
					/>
				</div>
			</div>

			<div>
				<label className="block text-lg font-semibold text-gray-700 mb-2">Details</label>
				<textarea 
					rows={4}
					className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary px-4 py-3 text-base"
					value={data.details} 
					onChange={(e) => setData('details', e.target.value)}
				/>
			</div>

			<div>
				<label className="block text-lg font-semibold text-gray-700 mb-2">Action Taken</label>
				<textarea 
					rows={4}
					className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary px-4 py-3 text-base"
					value={data.action_taken} 
					onChange={(e) => setData('action_taken', e.target.value)}
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<label className="block text-lg font-semibold text-gray-700 mb-2">Responsible Staff</label>
					<input 
						type="text" 
						className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary px-4 py-3 text-base"
						value={data.responsible_staff} 
						onChange={(e) => setData('responsible_staff', e.target.value)}
					/>
				</div>

				<div>
					<label className="block text-lg font-semibold text-gray-700 mb-2">Follow-up Date</label>
					<input 
						type="date" 
						className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary px-4 py-3 text-base"
						value={data.follow_up_date} 
						onChange={(e) => setData('follow_up_date', e.target.value)}
					/>
				</div>
			</div>

			<div>
				<label className="block text-lg font-semibold text-gray-700 mb-2">Outcome</label>
				<input 
					type="text" 
					className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary px-4 py-3 text-base"
					value={data.outcome} 
					onChange={(e) => setData('outcome', e.target.value)}
				/>
			</div>

			<div className="flex justify-end gap-4 pt-6">
				<button 
					type="button" 
					onClick={onClose}
					className="btn-secondary text-lg px-8 py-3"
				>
					Cancel
				</button>
				<button 
					type="submit" 
					disabled={processing}
					className="btn-primary text-lg px-8 py-3"
				>
					{processing ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</form>
	);
}
