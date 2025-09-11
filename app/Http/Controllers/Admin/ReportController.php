<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WeeklySummary;
use App\Models\Section;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
	public function __construct()
	{
		$this->middleware(['auth', 'role:Admin|Super Admin']);
		$this->middleware('permission:view reports')->only(['index']);
		$this->middleware('permission:export reports')->only(['weeklyPdf']);
	}

	public function index(Request $request)
	{
		$filters = [
			'section_id' => $request->integer('section_id'),
			'week_start' => $request->input('week_start'),
		];
		$query = WeeklySummary::with('student:id,first_name,last_name,section_id')
			->when($filters['section_id'], fn($q, $sid) => $q->whereHas('student', fn($sq) => $sq->where('section_id', $sid)))
			->when($filters['week_start'], fn($q, $ws) => $q->where('week_start', $ws))
			->orderByDesc('week_start');
		$summaries = $query->paginate(10)->withQueryString();
		$sections = Section::orderBy('name')->get(['id','name']);
		return Inertia::render('Admin/Reports', [
			'summaries' => $summaries,
			'sections' => $sections,
			'filters' => $filters,
		]);
	}

	public function weeklyPdf(Request $request)
	{
		$sectionId = $request->integer('section_id');
		$weekStart = $request->input('week_start');
		$query = WeeklySummary::with('student')
			->when($sectionId, fn($q, $sid) => $q->whereHas('student', fn($sq) => $sq->where('section_id', $sid)))
			->when($weekStart, fn($q, $ws) => $q->where('week_start', $ws))
			->orderBy('student_id');
		$data = [
			'summaries' => $query->get(),
			'week_start' => $weekStart,
		];
		$pdf = Pdf::loadView('pdf.weekly_report', $data)->setPaper('a4', 'portrait');
		$filename = 'weekly-report'.($weekStart ? '-'.$weekStart : '').'.pdf';
		return $pdf->download($filename);
	}
}
