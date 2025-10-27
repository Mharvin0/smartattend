<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Intervention;
use App\Models\Student;
use App\Models\Department;
use App\Models\Program;
use App\Models\Section;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class InterventionController extends Controller
{
	public function __construct()
	{
		$this->middleware(['auth']);
		$this->middleware(function ($request, $next) {
			if (!auth()->user()->hasAnyRole(['Admin', 'Super Admin'])) {
				abort(403, 'Unauthorized access');
			}
			return $next($request);
		});
		$this->middleware('permission:manage interventions');
	}

	public function index(Request $request)
	{
		// Get filter parameters
		$departmentId = $request->get('department_id');
		$programId = $request->get('program_id');
		$sectionId = $request->get('section_id');
		$scheduleId = $request->get('schedule_id');
		$studentNumber = $request->get('student_number');
		$studentName = $request->get('student_name');
		$status = $request->get('status');
		$priority = $request->get('priority');
		$dateFrom = $request->get('date_from');
		$dateTo = $request->get('date_to');
		$search = $request->get('search');

		// Build query with eager loading for performance
		$query = Intervention::with([
			'student:id,first_name,last_name,student_number,section_id',
			'student.section:id,name,program_id',
			'student.section.program:id,name,department_id',
			'student.section.program.department:id,name',
			'recordedBy:id,name,email',
			'responsibleStaff:id,name,email'
		]);

		// Apply filters
		if ($departmentId) {
			$query->byDepartment($departmentId);
		}

		if ($programId) {
			$query->byProgram($programId);
		}

		if ($sectionId) {
			$query->bySection($sectionId);
		}

		if ($scheduleId) {
			$query->whereHas('student.schedules', function($q) use ($scheduleId) {
				$q->where('schedules.id', $scheduleId);
			});
		}

		if ($studentNumber) {
			$query->whereHas('student', function($q) use ($studentNumber) {
				$q->where('student_number', 'like', "%{$studentNumber}%");
			});
		}

		if ($studentName) {
			$query->whereHas('student', function($q) use ($studentName) {
				$q->where(DB::raw("CONCAT(first_name, ' ', last_name)"), 'like', "%{$studentName}%");
			});
		}

		if ($status) {
			$query->byStatus($status);
		}

		if ($priority) {
			$query->byPriority($priority);
		}

		if ($dateFrom && $dateTo) {
			$query->byDateRange($dateFrom, $dateTo);
		}

		if ($search) {
			$query->where(function($q) use ($search) {
				$q->where('type', 'like', "%{$search}%")
				  ->orWhere('details', 'like', "%{$search}%")
				  ->orWhere('action_taken', 'like', "%{$search}%")
				  ->orWhereHas('student', function($studentQuery) use ($search) {
					  $studentQuery->where(DB::raw("CONCAT(first_name, ' ', last_name)"), 'like', "%{$search}%")
								   ->orWhere('student_number', 'like', "%{$search}%");
				  });
			});
		}

		// Get paginated results with performance optimization
		$interventions = $query->orderBy('created_at', 'desc')
			->paginate(50) // Limit to 50 per page for performance
			->withQueryString();

		// Get filter options
		$departments = Department::select('id', 'name')->orderBy('name')->get();
		$programs = Program::select('id', 'name', 'department_id')
			->when($departmentId, function($q) use ($departmentId) {
				$q->where('department_id', $departmentId);
			})
			->orderBy('name')->get();
		$sections = Section::select('id', 'name', 'program_id')
			->when($programId, function($q) use ($programId) {
				$q->where('program_id', $programId);
			})
			->orderBy('name')->get();
		$schedules = Schedule::with(['subject:id,name,code', 'section:id,name'])
			->when($sectionId, function($q) use ($sectionId) {
				$q->where('section_id', $sectionId);
			})
			->orderBy('day_of_week')
			->orderBy('time_start')
			->get();

		// Get statistics
		$stats = [
			'total' => Intervention::count(),
			'done' => Intervention::byStatus(Intervention::STATUS_DONE)->count(),
			'in_progress' => Intervention::byStatus(Intervention::STATUS_IN_PROGRESS)->count(),
			'no_response' => Intervention::byStatus(Intervention::STATUS_NO_RESPONSE)->count(),
		];

		return Inertia::render('Admin/Interventions', [
			'interventions' => $interventions,
			'departments' => $departments,
			'programs' => $programs,
			'sections' => $sections,
			'schedules' => $schedules,
			'stats' => $stats,
			'statusOptions' => Intervention::getStatusOptions(),
			'priorityOptions' => Intervention::getPriorityOptions(),
			'filters' => $request->only([
				'department_id', 'program_id', 'section_id', 'schedule_id',
				'student_number', 'student_name', 'status', 'priority',
				'date_from', 'date_to', 'search'
			])
		]);
	}

	public function store(Request $request)
	{
		$validated = $request->validate([
			'student_id' => ['required','exists:students,id'],
			'date' => ['required','date'],
			'type' => ['required','string','max:255'],
			'details' => ['nullable','string'],
			'action_taken' => ['nullable','string'],
			'responsible_staff' => ['nullable','string','max:255'],
			'follow_up_date' => ['nullable','date'],
			'outcome' => ['nullable','string','max:255'],
			'status' => ['nullable','in:open,in_progress,resolved,archived'],
			'priority' => ['nullable','in:low,medium,high'],
			'due_date' => ['nullable','date'],
		]);
		$validated['recorded_by'] = $request->user()->id ?? null;
		Intervention::create($validated);
		return back()->with('success','Intervention created');
	}

	public function update(Request $request, Intervention $intervention)
	{
		$validated = $request->validate([
			'student_id' => ['required','exists:students,id'],
			'date' => ['required','date'],
			'type' => ['required','string','max:255'],
			'details' => ['nullable','string'],
			'action_taken' => ['nullable','string'],
			'responsible_staff' => ['nullable','string','max:255'],
			'follow_up_date' => ['nullable','date'],
			'outcome' => ['nullable','string','max:255'],
			'status' => ['nullable','in:done,in_progress,no_response'],
			'priority' => ['nullable','in:low,medium,high'],
			'due_date' => ['nullable','date'],
		]);
		$intervention->update($validated);
		return back()->with('success','Intervention updated');
	}

	public function updateStatus(Request $request, Intervention $intervention)
	{
		$validated = $request->validate([
			'status' => ['required','in:done,in_progress,no_response'],
			'outcome' => ['nullable','string','max:255'],
		]);

		$intervention->update($validated);
		
		return response()->json([
			'success' => true,
			'message' => 'Intervention status updated successfully',
			'intervention' => $intervention->load(['student:id,first_name,last_name,student_number'])
		]);
	}

	public function destroy(Intervention $intervention)
	{
		$intervention->delete();
		return back()->with('success','Intervention deleted');
	}

	public function bulkAction(Request $request)
	{
		$validated = $request->validate([
			'action' => ['required', 'in:status,priority,delete'],
			'value' => ['nullable', 'string'],
			'ids' => ['required', 'array'],
			'ids.*' => ['integer', 'exists:interventions,id'],
		]);

		$interventions = Intervention::whereIn('id', $validated['ids']);

		switch ($validated['action']) {
			case 'status':
				$validated['value'] = in_array($validated['value'], ['done', 'in_progress', 'no_response']) 
					? $validated['value'] 
					: 'in_progress';
				$interventions->update(['status' => $validated['value']]);
				$message = 'Status updated for ' . count($validated['ids']) . ' interventions';
				break;
			case 'priority':
				$validated['value'] = in_array($validated['value'], ['low', 'medium', 'high']) 
					? $validated['value'] 
					: 'medium';
				$interventions->update(['priority' => $validated['value']]);
				$message = 'Priority updated for ' . count($validated['ids']) . ' interventions';
				break;
			case 'delete':
				$interventions->delete();
				$message = count($validated['ids']) . ' interventions deleted';
				break;
		}

		return back()->with('success', $message);
	}
}
