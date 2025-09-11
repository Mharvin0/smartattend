export default function DataTable({ columns, data, actions = true }) {
	return (
		<div className="overflow-x-auto">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						{columns.map((column) => (
							<th key={column.key} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								{column.label}
							</th>
						))}
						{actions && <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>}
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-200 bg-white">
					{data.map((row, i) => (
						<tr key={i} className="transition-colors hover:bg-gray-50">
							{columns.map((column) => (
								<td key={column.key} className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
									{typeof column.render === 'function' ? column.render(row[column.key], row) : row[column.key]}
								</td>
							))}
							{actions && (
								<td className="whitespace-nowrap px-6 py-4 text-right text-sm">
									<button className="font-medium text-brand-primary hover:text-brand-primary/80">Edit</button>
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
