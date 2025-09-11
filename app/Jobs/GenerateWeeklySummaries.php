<?php

namespace App\Jobs;

use App\Models\AttendanceRecord;
use App\Models\WeeklySummary;
use App\Models\Student;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class GenerateWeeklySummaries implements ShouldQueue
{
	use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

	public function __construct()
	{
	}

	public function handle(): void
	{
		$today = CarbonImmutable::today();
		$weekStart = $today->startOfWeek(CarbonImmutable::MONDAY);
		$weekEnd = $today->endOfWeek(CarbonImmutable::SUNDAY);

		DB::transaction(function () use ($weekStart, $weekEnd) {
			$studentIds = Student::query()->pluck('id');

			foreach ($studentIds as $studentId) {
				$records = AttendanceRecord::query()
					->where('student_id', $studentId)
					->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
					->get();

				$present = $records->where('status', 'present')->count();
				$absent = $records->where('status', 'absent')->count();
				$late = $records->where('status', 'late')->count();

				$summary = WeeklySummary::updateOrCreate(
					[
						'student_id' => $studentId,
						'week_start' => $weekStart->toDateString(),
						'week_end' => $weekEnd->toDateString(),
					],
					[
						'present_count' => $present,
						'absent_count' => $absent,
						'late_count' => $late,
						// Simple improvement index: present - absent (can be refined later)
						'improvement_index' => max(0, $present - $absent),
					]
				);
			}
		});
	}
}
