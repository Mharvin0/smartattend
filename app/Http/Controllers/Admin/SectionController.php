<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SectionController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'role:Admin|Super Admin']);
    }

    public function index()
    {
        $sections = Section::orderBy('program')
            ->orderBy('year_level')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Sections', [
            'sections' => $sections,
            'programs' => Section::getPrograms(),
            'yearLevels' => Section::getYearLevels(),
            'semesters' => Section::getSemesters(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'year_level' => ['required', 'string', 'max:255'],
            'adviser_name' => ['required', 'string', 'max:255'],
            'program' => ['required', 'string', 'max:255'],
            'semester' => ['required', 'string', 'max:255'],
            'academic_year' => ['required', 'string', 'max:255'],
        ]);

        Section::create($validated);
        return back()->with('success', 'Section created successfully');
    }

    public function update(Request $request, Section $section)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'year_level' => ['required', 'string', 'max:255'],
            'adviser_name' => ['required', 'string', 'max:255'],
            'program' => ['required', 'string', 'max:255'],
            'semester' => ['required', 'string', 'max:255'],
            'academic_year' => ['required', 'string', 'max:255'],
        ]);

        $section->update($validated);
        return back()->with('success', 'Section updated successfully');
    }

    public function destroy(Section $section)
    {
        $section->delete();
        return back()->with('success', 'Section deleted successfully');
    }
}