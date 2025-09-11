<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8" />
	<title>Weekly Report</title>
	<style>
		body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
		h1 { font-size: 18px; }
		table { width: 100%; border-collapse: collapse; }
		th, td { border: 1px solid #000; padding: 6px; text-align: left; }
	</style>
</head>
<body>
	<h1>Weekly Attendance Report {{ $week_start ? ('- '.$week_start) : '' }}</h1>
	<table>
		<thead>
			<tr>
				<th>Student</th>
				<th>Present</th>
				<th>Late</th>
				<th>Absent</th>
				<th>Improvement</th>
			</tr>
		</thead>
		<tbody>
			@foreach($summaries as $s)
				<tr>
					<td>{{ $s->student->last_name }}, {{ $s->student->first_name }}</td>
					<td>{{ $s->present_count }}</td>
					<td>{{ $s->late_count }}</td>
					<td>{{ $s->absent_count }}</td>
					<td>{{ $s->improvement_index }}</td>
				</tr>
			@endforeach
		</tbody>
	</table>
</body>
</html>
