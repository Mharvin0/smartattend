export default function StatsCard({ icon, title, value, subtitle }) {
	return (
		<div className="card flex items-center gap-4 p-4">
			<div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-brand-primary bg-opacity-10`}>
				{icon}
			</div>
			<div>
				<p className="text-sm font-medium text-gray-500">{title}</p>
				<h3 className="text-xl font-semibold text-gray-900">{value}</h3>
				{subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
			</div>
		</div>
	);
}
