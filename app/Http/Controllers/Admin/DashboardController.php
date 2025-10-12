<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Intervention;
use App\Models\WeeklySummary;
use App\Models\Section;
use Carbon\CarbonImmutable;
use Inertia\Inertia;

class DashboardController extends Controller
{
	public function __construct()
	{
		$this->middleware(['auth', 'role:Admin|Super Admin']);
	}
	public function index()
	{
		$today = CarbonImmutable::today();
		$weeks = collect(range(0, 7))->map(fn($i) => $today->startOfWeek()->subWeeks($i))->reverse()->values();
		$labels = $weeks->map(fn($w) => $w->format('M d'))->all();

		$weeklyRates = [];
		foreach ($weeks as $w) {
			$rangeStart = $w->toDateString();
			$rangeEnd = $w->endOfWeek()->toDateString();
			$summary = WeeklySummary::whereBetween('week_start', [$rangeStart, $rangeEnd])->get();
			$total = max(1, $summary->sum(fn($s) => $s->present_count + $s->late_count + $s->absent_count));
			$present = $summary->sum('present_count');
			$weeklyRates[] = round(($present / $total) * 100, 1);
		}

		// Today's attendance stats
		$todayRecords = AttendanceRecord::whereDate('date', $today)->get();
		$totalStudents = $todayRecords->count();
		$presentToday = $todayRecords->where('status', 'present')->count();
		$lateToday = $todayRecords->where('status', 'late')->count();
		$absentToday = $todayRecords->where('status', 'absent')->count();
		$excusedToday = $todayRecords->where('status', 'excused')->count();
		
		$presentRate = $totalStudents > 0 ? round(($presentToday / $totalStudents) * 100, 1) : 0;
		$lateRate = $totalStudents > 0 ? round(($lateToday / $totalStudents) * 100, 1) : 0;
		$absentRate = $totalStudents > 0 ? round(($absentToday / $totalStudents) * 100, 1) : 0;

		// Weekly average
		$weeklyAverage = count($weeklyRates) > 0 ? round(array_sum($weeklyRates) / count($weeklyRates), 1) : 0;

		// Recent activities with student names
		$recentInterventions = Intervention::with('student:id,first_name,last_name')
			->orderByDesc('date')
			->limit(5)
			->get(['id','student_id','date','type','status','priority']);
			
		$recentAbsences = AttendanceRecord::with('student:id,first_name,last_name')
			->where('status','absent')
			->orderByDesc('date')
			->limit(5)
			->get(['id','student_id','date','status']);

		// At-risk students (3+ absences in last 2 weeks)
		$atRiskStudents = AttendanceRecord::with('student:id,first_name,last_name')
			->where('status', 'absent')
			->whereDate('date', '>=', $today->subWeeks(2))
			->selectRaw('student_id, COUNT(*) as absence_count')
			->groupBy('student_id')
			->having('absence_count', '>=', 3)
			->limit(5)
			->get();

		// Open interventions count
		$openInterventions = Intervention::whereIn('status', ['open', 'in_progress'])->count();

		// Recent attendance records with full details
		$recentRecords = AttendanceRecord::with(['student.section', 'schedule.subject'])
			->orderByDesc('date')
			->orderByDesc('created_at')
			->limit(50)
			->get();

		// Today's stats for attendance cards
		$todayStats = [
			'present' => $presentToday,
			'late' => $lateToday,
			'absent' => $absentToday,
			'excused' => $excusedToday,
			'total_students' => $totalStudents,
			'attendance_rate' => $presentRate,
		];

		// Sections for filtering
		$sections = Section::orderBy('name')->get(['id', 'name']);

		// Get total students count from database
		$totalStudentsCount = \App\Models\Student::count();

		// Calculate overall attendance rate for today
		$overallAttendanceRate = $totalStudents > 0 ? round(($presentToday / $totalStudents) * 100, 1) : 0;

		return Inertia::render('Admin/Dashboard', [
			'chart' => [
				'labels' => $labels,
				'weeklyRates' => $weeklyRates,
			],
			'stats' => [
				'presentToday' => [
					'rate' => $presentRate,
					'count' => $presentToday,
					'total' => $totalStudents
				],
				'lateToday' => [
					'rate' => $lateRate,
					'count' => $lateToday
				],
				'absentToday' => [
					'rate' => $absentRate,
					'count' => $absentToday
				],
				'weeklyAverage' => $weeklyAverage,
				'openInterventions' => $openInterventions,
				'atRiskStudents' => $atRiskStudents->count()
			],
			'recentInterventions' => $recentInterventions,
			'recentAbsences' => $recentAbsences,
			'atRiskStudents' => $atRiskStudents,
			'recentRecords' => $recentRecords,
			'todayStats' => $todayStats,
			'sections' => $sections,
			'totalStudentsCount' => $totalStudentsCount,
			'overallAttendanceRate' => $overallAttendanceRate,
		]);
	}

	public function studentProfile(\App\Models\Student $student)
	{
		$attendance = AttendanceRecord::where('student_id', $student->id)
			->orderByDesc('date')->limit(50)->get();
		$interventions = Intervention::where('student_id', $student->id)
			->orderByDesc('date')->limit(50)->get();
		return Inertia::render('Admin/StudentProfile', [
			'student' => $student,
			'attendance' => $attendance,
			'interventions' => $interventions,
		]);
	}
}
