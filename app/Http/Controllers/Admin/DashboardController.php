<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Intervention;
use App\Models\WeeklySummary;
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
		$labels = $weeks->map(fn($w) => $w->format('Y-m-d'))->all();

		$weeklyRates = [];
		foreach ($weeks as $w) {
			$rangeStart = $w->toDateString();
			$rangeEnd = $w->endOfWeek()->toDateString();
			$summary = WeeklySummary::whereBetween('week_start', [$rangeStart, $rangeEnd])->get();
			$total = max(1, $summary->sum(fn($s) => $s->present_count + $s->late_count + $s->absent_count));
			$present = $summary->sum('present_count');
			$weeklyRates[] = round(($present / $total) * 100, 1);
		}

		$recentInterventions = Intervention::orderByDesc('date')->limit(10)->get(['id','student_id','date','type','outcome']);
		$recentAbsences = AttendanceRecord::where('status','absent')->orderByDesc('date')->limit(10)->get(['id','student_id','date','status']);

		return Inertia::render('Admin/Dashboard', [
			'chart' => [
				'labels' => $labels,
				'weeklyRates' => $weeklyRates,
			],
			'recentInterventions' => $recentInterventions,
			'recentAbsences' => $recentAbsences,
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
