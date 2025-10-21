import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';

export default function Schedules({ schedules, sections, subjects }) {
	const { data, setData, post, processing } = useForm({ section_id: '', subject_id: '', day_of_week: 1, time_start: '08:00', time_end: '09:00' });
	const flash = usePage().props.flash || {};
	const submit = (e) => { e.preventDefault(); post(route('admin.schedules')); };

	const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

	return (
		<AuthenticatedLayout header={<h2 className="text-2xl font-bold leading-tight text-gray-800">Schedules</h2>}>
			<Head title="Schedules" />
			<div className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-emerald-50/80 to-brand-secondary/5 py-8">
				<div className="mx-auto max-w-full space-y-10 px-4 sm:px-6 lg:px-8 xl:px-12">
					{flash.success && (
						<div className="pointer-events-none fixed right-6 top-6 z-50 rounded bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">{flash.success}</div>
					)}

					<div className="card">
						<div className="mb-6">
							<h3 className="text-lg font-medium text-gray-900">Add New Schedule</h3>
							<p className="mt-1 text-sm text-gray-600">Create a new class schedule by selecting section, subject, and time.</p>
						</div>

						<form onSubmit={submit} className="grid grid-cols-1 gap-6 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
							<div>
								<label className="block text-sm font-medium text-gray-700">Section</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.section_id}
									onChange={(e) => setData('section_id', e.target.value)}
								>
									<option value="">Select Section</option>
									{sections.map((s) => (
										<option key={s.id} value={s.id}>{s.name}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Subject</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.subject_id}
									onChange={(e) => setData('subject_id', e.target.value)}
								>
									<option value="">Select Subject</option>
									{subjects.map((s) => (
										<option key={s.id} value={s.id}>{s.name}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Day</label>
								<select
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.day_of_week}
									onChange={(e) => setData('day_of_week', e.target.value)}
								>
									{dayNames.map((day, index) => (
										<option key={index + 1} value={index + 1}>{day}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Start Time</label>
								<input
									type="time"
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.time_start}
									onChange={(e) => setData('time_start', e.target.value)}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">End Time</label>
								<input
									type="time"
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
									value={data.time_end}
									onChange={(e) => setData('time_end', e.target.value)}
								/>
							</div>
							<div className="md:col-span-5">
								<button disabled={processing} className="btn-primary inline-flex items-center gap-2">
									<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
									</svg>
									Create Schedule
								</button>
							</div>
						</form>
					</div>

					<div className="card">
						<div className="mb-6 flex items-center justify-between">
							<div>
								<h3 className="text-lg font-medium text-gray-900">All Schedules</h3>
								<p className="mt-1 text-sm text-gray-600">View and manage class schedules.</p>
							</div>
							<div className="flex items-center gap-4">
								<select className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary sm:text-sm">
									<option value="">All Sections</option>
									{sections.map((s) => (
										<option key={s.id} value={s.id}>{s.name}</option>
									))}
								</select>
								<select className="rounded-lg border-gray-300 focus:border-brand-primary focus:ring-brand-primary sm:text-sm">
									<option value="">All Days</option>
									{dayNames.map((day, index) => (
										<option key={index + 1} value={index + 1}>{day}</option>
									))}
								</select>
							</div>
						</div>

						<DataTable
							columns={[
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
									key: 'day_of_week',
									label: 'Day',
									render: (day) => dayNames[day - 1]
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