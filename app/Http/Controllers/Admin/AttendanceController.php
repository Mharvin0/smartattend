<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttendanceByScheduleRequest;
use App\Http\Requests\StoreAttendanceBySectionRequest;
use App\Http\Requests\AttendanceImportRequest;
use App\Models\AttendanceRecord;
use App\Models\AttendanceHistory;
use App\Models\Schedule;
use App\Models\Section;
use App\Models\Student;
use App\Models\Department;
use App\Models\Program;
use App\Models\Subject;
use App\Services\AuditLogService;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use Inertia\Inertia;

class AttendanceController extends Controller
{
	public function __construct()
	{
		$this->middleware(['auth', 'role:Admin|Super Admin']);
		$this->middleware('permission:capture attendance')->only(['bySection','storeSection','bySchedule','storeSchedule']);
		$this->middleware('permission:import attendance')->only(['importForm','importStore']);
	}

	// Main Dashboard
	public function index(Request $request)
	{
		// Get filter parameters
		$filters = [
			'date' => $request->get('date', now()->format('Y-m-d')),
			'date_range' => $request->get('date_range'),
			'department_id' => $request->get('department_id'),
			'program_id' => $request->get('program_id'),
			'section_id' => $request->get('section_id'),
			'status' => $request->get('status'),
			'search' => $request->get('search'),
		];

		// Get attendance statistics
		$stats = AttendanceRecord::getAttendanceStats($filters);
		
		// Get today's attendance overview
		$todayAttendance = $this->getTodayAttendanceOverview();
		
		// Get recent attendance trends
		$trends = AttendanceRecord::getAttendanceTrends($filters);
		
		// Get filter options
		$departments = Department::orderBy('name')->get(['id', 'name']);
		$programs = Program::orderBy('name')->get(['id', 'name']);
		$sections = Section::with(['department', 'program'])->orderBy('name')->get(['id', 'name', 'department_id', 'program_id']);
		
		// Get recent attendance records
		$recentRecords = $this->getRecentAttendanceRecords($filters);
		
		// Get attendance calendar data
		$calendarData = $this->getAttendanceCalendarData($filters);

		return Inertia::render('Admin/Attendance', [
			'stats' => $stats,
			'todayAttendance' => $todayAttendance,
			'trends' => $trends,
			'departments' => $departments,
			'programs' => $programs,
			'sections' => $sections,
			'recentRecords' => $recentRecords,
			'calendarData' => $calendarData,
			'filters' => $filters,
		]);
	}

	// Attendance by Section
	public function bySection(Request $request)
	{
		$filters = [
			'section_id' => $request->get('section_id'),
			'date' => $request->get('date', now()->format('Y-m-d')),
		];

		$sections = Section::with(['department', 'program'])->orderBy('name')->get(['id', 'name', 'department_id', 'program_id']);
		$students = collect();
		$attendanceRecords = collect();
		
		if ($filters['section_id']) {
			$students = Student::where('section_id', $filters['section_id'])
				->orderBy('last_name')
				->get(['id', 'student_number', 'first_name', 'last_name', 'section_id']);
			
			// Get existing attendance records for the selected date
			$attendanceRecords = AttendanceRecord::bySection($filters['section_id'])
				->byDate($filters['date'])
				->with(['student', 'schedule.subject'])
				->get()
				->keyBy('student_id');
		}

		return Inertia::render('Admin/AttendanceBySection', [
			'sections' => $sections,
			'students' => $students,
			'attendanceRecords' => $attendanceRecords,
			'filters' => $filters,
		]);
	}

	public function storeSection(StoreAttendanceBySectionRequest $request)
	{
		$data = $request->validated();
		$userId = Auth::id();

		DB::transaction(function () use ($data, $userId) {
			foreach ($data['records'] as $record) {
				$existing = AttendanceRecord::where('student_id', $record['student_id'])
					->whereNull('schedule_id')
					->whereDate('date', $data['date'])
					->first();

				$updated = AttendanceRecord::updateOrCreate(
					[
						'student_id' => $record['student_id'],
						'date' => $data['date'],
						'schedule_id' => null,
					],
					[
						'status' => $record['status'],
						'remarks' => $record['remarks'] ?? null,
						'recorded_by' => $userId,
					]
				);

				// Create history record
				AttendanceHistory::create([
					'attendance_record_id' => $updated->id,
					'student_id' => $updated->student_id,
					'date' => $updated->date,
					'schedule_id' => $updated->schedule_id,
					'old_status' => $existing?->status,
					'new_status' => $updated->status,
					'changed_by' => $userId,
					'changed_at' => now(),
					'remarks' => $updated->remarks,
				]);

				// Log audit event
				AuditLogService::logAttendance(
					AuditLog::TYPE_DATA_UPDATE,
					"Attendance recorded for student {$updated->student->first_name} {$updated->student->last_name}",
					['student_id' => $updated->student_id, 'status' => $updated->status, 'date' => $updated->date]
				);
			}
		});

		return redirect()->back()->with('success', 'Attendance saved successfully.');
	}

	// Attendance by Schedule
	public function bySchedule(Request $request)
	{
		$filters = [
			'schedule_id' => $request->get('schedule_id'),
			'date' => $request->get('date', now()->format('Y-m-d')),
		];

		$schedules = Schedule::with(['subject:id,name,code', 'section:id,name', 'department:id,name', 'program:id,name'])
			->orderBy('day_of_week')
			->orderBy('time_start')
			->get();
		
		$students = collect();
		$attendanceRecords = collect();
		
		if ($filters['schedule_id']) {
			$schedule = Schedule::find($filters['schedule_id']);
			if ($schedule) {
				$students = Student::where('section_id', $schedule->section_id)
					->orderBy('last_name')
					->get(['id', 'student_number', 'first_name', 'last_name', 'section_id']);
				
				// Get existing attendance records for the selected schedule and date
				$attendanceRecords = AttendanceRecord::bySchedule($filters['schedule_id'])
					->byDate($filters['date'])
					->with(['student'])
					->get()
					->keyBy('student_id');
			}
		}

		return Inertia::render('Admin/AttendanceBySchedule', [
			'schedules' => $schedules,
			'students' => $students,
			'attendanceRecords' => $attendanceRecords,
			'filters' => $filters,
		]);
	}

	public function storeSchedule(StoreAttendanceByScheduleRequest $request)
	{
		$data = $request->validated();
		$userId = Auth::id();

		DB::transaction(function () use ($data, $userId) {
			foreach ($data['records'] as $record) {
				$existing = AttendanceRecord::where('student_id', $record['student_id'])
					->where('schedule_id', $data['schedule_id'])
					->whereDate('date', $data['date'])
					->first();

				$updated = AttendanceRecord::updateOrCreate(
					[
						'student_id' => $record['student_id'],
						'date' => $data['date'],
						'schedule_id' => $data['schedule_id'],
					],
					[
						'status' => $record['status'],
						'remarks' => $record['remarks'] ?? null,
						'recorded_by' => $userId,
					]
				);

				// Create history record
				AttendanceHistory::create([
					'attendance_record_id' => $updated->id,
					'student_id' => $updated->student_id,
					'date' => $updated->date,
					'schedule_id' => $updated->schedule_id,
					'old_status' => $existing?->status,
					'new_status' => $updated->status,
					'changed_by' => $userId,
					'changed_at' => now(),
					'remarks' => $updated->remarks,
				]);

				// Log audit event
				AuditLogService::logAttendance(
					AuditLog::TYPE_DATA_UPDATE,
					"Schedule attendance recorded for student {$updated->student->first_name} {$updated->student->last_name}",
					['student_id' => $updated->student_id, 'schedule_id' => $updated->schedule_id, 'status' => $updated->status, 'date' => $updated->date]
				);
			}
		});

		return redirect()->back()->with('success', 'Attendance saved successfully.');
	}

	// Bulk Operations
	public function bulkUpdate(Request $request)
	{
		$request->validate([
			'records' => 'required|array',
			'records.*.student_id' => 'required|integer|exists:students,id',
			'records.*.status' => 'required|in:present,late,absent,excused',
			'records.*.remarks' => 'nullable|string|max:500',
			'date' => 'required|date',
			'schedule_id' => 'nullable|integer|exists:schedules,id',
		]);

		$data = $request->validated();
		$userId = Auth::id();

		DB::transaction(function () use ($data, $userId) {
			foreach ($data['records'] as $record) {
				$existing = AttendanceRecord::where('student_id', $record['student_id'])
					->where('schedule_id', $data['schedule_id'])
					->whereDate('date', $data['date'])
					->first();

				$updated = AttendanceRecord::updateOrCreate(
					[
						'student_id' => $record['student_id'],
						'date' => $data['date'],
						'schedule_id' => $data['schedule_id'],
					],
					[
						'status' => $record['status'],
						'remarks' => $record['remarks'] ?? null,
						'recorded_by' => $userId,
					]
				);

				// Create history record
				AttendanceHistory::create([
					'attendance_record_id' => $updated->id,
					'student_id' => $updated->student_id,
					'date' => $updated->date,
					'schedule_id' => $updated->schedule_id,
					'old_status' => $existing?->status,
					'new_status' => $updated->status,
					'changed_by' => $userId,
					'changed_at' => now(),
					'remarks' => $updated->remarks,
				]);
			}
		});

		return response()->json(['success' => true, 'message' => 'Bulk attendance updated successfully.']);
	}

	// Import functionality
	public function importForm()
	{
		$sections = Section::with(['department', 'program', 'students'])->orderBy('name')->get();
		$departments = Department::orderBy('name')->get(['id', 'name']);
		$programs = Program::orderBy('name')->get(['id', 'name']);
		
		return Inertia::render('Admin/AttendanceImport', [
			'sections' => $sections,
			'departments' => $departments,
			'programs' => $programs,
		]);
	}

	public function importStore(Request $request)
	{
		$request->validate([
			'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
			'section_id' => ['required', 'integer', 'exists:sections,id'],
			'date' => ['required', 'date'],
		]);

		// Process CSV import
		$file = $request->file('file');
		$csvData = array_map('str_getcsv', file($file->getRealPath()));
		$header = array_shift($csvData);

		$importedCount = 0;
		$errors = [];

		DB::transaction(function () use ($csvData, $header, $request, &$importedCount, &$errors) {
			foreach ($csvData as $index => $row) {
				$data = array_combine($header, $row);
				
				try {
					$student = Student::where('student_number', $data['student_number'] ?? '')
						->where('section_id', $request->section_id)
						->first();

					if (!$student) {
						$errors[] = "Row " . ($index + 2) . ": Student not found";
						continue;
					}

					AttendanceRecord::updateOrCreate(
						[
							'student_id' => $student->id,
							'date' => $request->date,
							'schedule_id' => null,
						],
						[
							'status' => $data['status'] ?? 'absent',
							'remarks' => $data['remarks'] ?? null,
							'recorded_by' => Auth::id(),
						]
					);

					$importedCount++;
				} catch (\Exception $e) {
					$errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
				}
			}
		});

		// Log audit event
		AuditLogService::logAttendance(
			AuditLog::TYPE_DATA_CREATE,
			"Bulk attendance imported for section",
			['section_id' => $request->section_id, 'imported_count' => $importedCount, 'errors' => count($errors)]
		);

		$message = "Successfully imported {$importedCount} attendance records.";
		if (!empty($errors)) {
			$message .= " " . count($errors) . " errors occurred.";
		}

		return redirect()->back()->with('success', $message);
	}

	// Analytics and Reports
	public function analytics(Request $request)
	{
		$filters = [
			'date_range' => $request->get('date_range') ?: [$request->get('date_range.0'), $request->get('date_range.1')],
			'department_id' => $request->get('department_id'),
			'program_id' => $request->get('program_id'),
			'section_id' => $request->get('section_id'),
		];

		try {
			$stats = AttendanceRecord::getAttendanceStats($filters);
			$trends = AttendanceRecord::getAttendanceTrends($filters);
			$topAbsentStudents = $this->getTopAbsentStudents($filters);
			$attendanceByDay = $this->getAttendanceByDay($filters);
			$attendanceByTime = $this->getAttendanceByTime($filters);

			return response()->json([
				'stats' => $stats,
				'trends' => $trends,
				'topAbsentStudents' => $topAbsentStudents,
				'attendanceByDay' => $attendanceByDay,
				'attendanceByTime' => $attendanceByTime,
			]);
		} catch (\Exception $e) {
			\Log::error('Analytics error: ' . $e->getMessage());
			return response()->json([
				'error' => 'Failed to load analytics data',
				'stats' => ['total' => 0, 'present' => 0, 'late' => 0, 'absent' => 0, 'excused' => 0, 'present_percentage' => 0, 'absent_percentage' => 0],
				'trends' => [],
				'topAbsentStudents' => [],
				'attendanceByDay' => [],
				'attendanceByTime' => [],
			], 500);
		}
	}

	// Student attendance history
	public function studentHistory(Request $request, $studentId)
	{
		$days = $request->get('days', 30);
		$history = AttendanceRecord::getStudentAttendanceHistory($studentId, $days);
		
		return response()->json($history);
	}

	// Private helper methods
	private function getTodayAttendanceOverview()
	{
		$today = now()->format('Y-m-d');
		
		return [
			'total_students' => Student::count(),
			'present_today' => AttendanceRecord::byDate($today)->byStatus('present')->count(),
			'late_today' => AttendanceRecord::byDate($today)->byStatus('late')->count(),
			'absent_today' => AttendanceRecord::byDate($today)->byStatus('absent')->count(),
			'excused_today' => AttendanceRecord::byDate($today)->byStatus('excused')->count(),
		];
	}

	private function getRecentAttendanceRecords($filters)
	{
		$query = AttendanceRecord::with(['student', 'schedule.subject', 'recordedBy'])
			->recent(7);

		if (isset($filters['section_id'])) {
			$query->bySection($filters['section_id']);
		}
		if (isset($filters['department_id'])) {
			$query->byDepartment($filters['department_id']);
		}
		if (isset($filters['program_id'])) {
			$query->byProgram($filters['program_id']);
		}

		return $query->orderBy('created_at', 'desc')->limit(20)->get();
	}

	private function getAttendanceCalendarData($filters)
	{
		$startDate = now()->subDays(30);
		$endDate = now()->addDays(30);

		$query = AttendanceRecord::dateRange($startDate, $endDate);

		if (isset($filters['section_id'])) {
			$query->bySection($filters['section_id']);
		}

		return $query->selectRaw('DATE(date) as date, status, COUNT(*) as count')
			->groupBy('date', 'status')
			->get()
			->groupBy('date');
	}

	private function getTopAbsentStudents($filters)
	{
		$query = AttendanceRecord::byStatus('absent');

		if (isset($filters['date_range'])) {
			$query->dateRange($filters['date_range'][0], $filters['date_range'][1]);
		}
		if (isset($filters['section_id'])) {
			$query->bySection($filters['section_id']);
		}

		return $query->with('student')
			->selectRaw('student_id, COUNT(*) as absent_count')
			->groupBy('student_id')
			->orderBy('absent_count', 'desc')
			->limit(10)
			->get();
	}

	private function getAttendanceByDay($filters)
	{
		$query = AttendanceRecord::query();

		if (isset($filters['date_range'])) {
			$query->dateRange($filters['date_range'][0], $filters['date_range'][1]);
		}
		if (isset($filters['section_id'])) {
			$query->bySection($filters['section_id']);
		}

		return $query->selectRaw('DAYOFWEEK(date) as day_of_week, status, COUNT(*) as count')
			->groupBy('day_of_week', 'status')
			->get()
			->groupBy('day_of_week');
	}

	private function getAttendanceByTime($filters)
	{
		$query = AttendanceRecord::with('schedule')
			->whereNotNull('schedule_id');

		if (isset($filters['date_range'])) {
			$query->dateRange($filters['date_range'][0], $filters['date_range'][1]);
		}
		if (isset($filters['section_id'])) {
			$query->bySection($filters['section_id']);
		}

		return $query->selectRaw('HOUR(schedules.time_start) as hour, status, COUNT(*) as count')
			->join('schedules', 'attendance_records.schedule_id', '=', 'schedules.id')
			->groupBy('hour', 'status')
			->get()
			->groupBy('hour');
	}
}