<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Intervention;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InterventionController extends Controller
{
	public function __construct()
	{
		$this->middleware(['auth', 'role:Admin|Super Admin']);
		$this->middleware('permission:manage interventions');
	}

	public function index(Request $request)
	{
		$filters = [
			'date' => $request->input('date'),
			'type' => $request->input('type'),
			'status' => $request->input('status'),
			'priority' => $request->input('priority'),
		];
		$interventions = Intervention::with('student:id,first_name,last_name')
			->when($filters['date'], fn($q, $d) => $q->whereDate('date', $d))
			->when($filters['type'], fn($q, $t) => $q->where('type', $t))
			->when($filters['status'], fn($q, $s) => $q->where('status', $s))
			->when($filters['priority'], fn($q, $p) => $q->where('priority', $p))
			->orderByDesc('date')
			->paginate(10)
			->withQueryString();
		$students = Student::orderBy('last_name')->get(['id','first_name','last_name']);
		return Inertia::render('Admin/Interventions', compact('interventions','students','filters'));
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
			'status' => ['nullable','in:open,in_progress,resolved,archived'],
			'priority' => ['nullable','in:low,medium,high'],
			'due_date' => ['nullable','date'],
		]);
		$intervention->update($validated);
		return back()->with('success','Intervention updated');
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
				$interventions->update(['status' => $validated['value']]);
				$message = 'Status updated for ' . count($validated['ids']) . ' interventions';
				break;
			case 'priority':
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
