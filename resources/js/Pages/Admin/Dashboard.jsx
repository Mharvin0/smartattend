import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import StatsCard from '@/Components/StatsCard';
import DataTable from '@/Components/DataTable';

export default function Dashboard() {
	const { chart, recentInterventions, recentAbsences } = usePage().props;
	const canvasRef = useRef(null);

	useEffect(() => {
		if (!canvasRef.current || !chart) return;
		const ctx = canvasRef.current.getContext('2d');
		const instance = new Chart(ctx, {
			type: 'line',
			data: {
				labels: chart.labels,
				datasets: [
					{
						label: 'Weekly Attendance %',
						data: chart.weeklyRates,
						borderColor: '#3B4F26',
						backgroundColor: 'rgba(59, 79, 38, 0.1)',
						fill: true,
						tension: 0.3,
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					legend: { display: true },
					tooltip: {
						backgroundColor: '#3B4F26',
						titleColor: '#FFFFFF',
						bodyColor: '#FFFFFF',
						padding: 12,
						displayColors: false,
					},
				},
				scales: {
					y: {
						min: 0,
						max: 100,
						grid: {
							color: 'rgba(0, 0, 0, 0.05)',
						},
					},
					x: {
						grid: {
							display: false,
						},
					},
				},
			},
		});
		return () => instance.destroy();
	}, [chart]);

	return (
		<AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">PedroHub Dashboard</h2>}>
			<Head title="PedroHub Dashboard" />
			<div className="py-6">
				<div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
					{/* Quick Actions */}
					<div className="grid grid-cols-1 gap-6 md:grid-cols-4">
						<Link href={route('admin.attendance')} className="card group hover:border-brand-primary hover:shadow-md">
							<div className="flex items-center gap-4">
								<div className="rounded-lg bg-brand-primary bg-opacity-10 p-3 group-hover:bg-brand-primary group-hover:text-white">
									<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
								</div>
								<div>
									<h3 className="font-medium text-gray-900">Record Attendance</h3>
									<p className="text-sm text-gray-500">Take daily attendance</p>
								</div>
							</div>
						</Link>

						<Link href={route('admin.interventions')} className="card group hover:border-brand-primary hover:shadow-md">
							<div className="flex items-center gap-4">
								<div className="rounded-lg bg-brand-primary bg-opacity-10 p-3 group-hover:bg-brand-primary group-hover:text-white">
									<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
									</svg>
								</div>
								<div>
									<h3 className="font-medium text-gray-900">Interventions</h3>
									<p className="text-sm text-gray-500">Manage student interventions</p>
								</div>
							</div>
						</Link>

						<Link href={route('admin.reports')} className="card group hover:border-brand-primary hover:shadow-md">
							<div className="flex items-center gap-4">
								<div className="rounded-lg bg-brand-primary bg-opacity-10 p-3 group-hover:bg-brand-primary group-hover:text-white">
									<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								<div>
									<h3 className="font-medium text-gray-900">Reports</h3>
									<p className="text-sm text-gray-500">View attendance reports</p>
								</div>
							</div>
						</Link>

						<Link href={route('admin.sections')} className="card group hover:border-brand-primary hover:shadow-md">
							<div className="flex items-center gap-4">
								<div className="rounded-lg bg-brand-primary bg-opacity-10 p-3 group-hover:bg-brand-primary group-hover:text-white">
									<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
								</div>
								<div>
									<h3 className="font-medium text-gray-900">Sections</h3>
									<p className="text-sm text-gray-500">Manage class sections</p>
								</div>
							</div>
						</Link>
					</div>

					{/* Stats Overview */}
					<div className="grid grid-cols-1 gap-6 md:grid-cols-4">
						<StatsCard
							icon={<svg className="h-6 w-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>}
							title="Present Today"
							value="95%"
							subtitle="Total: 150 students"
						/>
						<StatsCard
							icon={<svg className="h-6 w-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>}
							title="Late Today"
							value="3%"
							subtitle="5 students"
						/>
						<StatsCard
							icon={<svg className="h-6 w-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
							</svg>}
							title="Absent Today"
							value="2%"
							subtitle="3 students"
						/>
						<StatsCard
							icon={<svg className="h-6 w-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>}
							title="Weekly Average"
							value="96%"
							subtitle="This week"
						/>
					</div>

					{/* Attendance Trend */}
					<div className="card">
						<h3 className="mb-4 text-lg font-semibold text-gray-800">Attendance Trend</h3>
						<canvas ref={canvasRef} height="80"></canvas>
					</div>

					{/* Recent Activities */}
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div className="card">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="text-lg font-semibold text-gray-800">Recent Absences</h3>
								<Link href={route('admin.attendance')} className="text-sm font-medium text-brand-primary hover:text-brand-primary/80">
									View All
								</Link>
							</div>
							<div className="divide-y">
								{recentAbsences.map((r) => (
									<div key={r.id} className="flex items-center justify-between py-3">
										<div>
											<p className="font-medium text-gray-900">{r.student?.name || 'Student'}</p>
											<p className="text-sm text-gray-500">{r.date}</p>
										</div>
										<span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium uppercase text-red-800">{r.status}</span>
									</div>
								))}
							</div>
						</div>

						<div className="card">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="text-lg font-semibold text-gray-800">Recent Interventions</h3>
								<Link href={route('admin.interventions')} className="text-sm font-medium text-brand-primary hover:text-brand-primary/80">
									View All
								</Link>
							</div>
							<div className="divide-y">
								{recentInterventions.map((i) => (
									<div key={i.id} className="flex items-center justify-between py-3">
										<div>
											<p className="font-medium text-gray-900">{i.student?.name || 'Student'}</p>
											<p className="text-sm text-gray-500">{i.date}</p>
										</div>
										<span className="rounded-full bg-brand-primary bg-opacity-10 px-3 py-1 text-xs font-medium text-brand-primary">{i.type}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}