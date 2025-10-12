<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\AttendanceController;
use App\Http\Controllers\Admin\InterventionController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\SectionController;
use App\Http\Controllers\Admin\SubjectController;
use App\Http\Controllers\Admin\ScheduleAdminController;
use App\Http\Controllers\Admin\DepartmentController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => false,
    ]);
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Admin (PedroHub) routes
    Route::middleware(['role:Admin|Super Admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/student/{student}', [DashboardController::class, 'studentProfile'])->name('student');

        // Attendance
        Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance');
        Route::get('/attendance/by-section', [AttendanceController::class, 'bySection'])->name('attendance.section');
        Route::post('/attendance/by-section', [AttendanceController::class, 'storeSection'])->name('attendance.section.store');
        Route::get('/attendance/by-schedule', [AttendanceController::class, 'bySchedule'])->name('attendance.schedule');
        Route::post('/attendance/by-schedule', [AttendanceController::class, 'storeSchedule'])->name('attendance.schedule.store');
        Route::get('/attendance/import', [AttendanceController::class, 'importForm'])->name('attendance.import');
        Route::post('/attendance/import', [AttendanceController::class, 'importStore'])->name('attendance.import.store');

        // Interventions
        Route::get('/interventions', [InterventionController::class, 'index'])->name('interventions');
        Route::post('/interventions', [InterventionController::class, 'store'])->name('interventions.store');
        Route::patch('/interventions/{intervention}', [InterventionController::class, 'update'])->name('interventions.update');
        Route::delete('/interventions/{intervention}', [InterventionController::class, 'destroy'])->name('interventions.destroy');
        Route::post('/interventions/bulk', [InterventionController::class, 'bulkAction'])->name('interventions.bulk');

        // Reports
        Route::get('/reports', [ReportController::class, 'index'])->name('reports');
        Route::get('/reports/weekly/pdf', [ReportController::class, 'weeklyPdf'])->name('reports.weekly.pdf');

        // Sections
        Route::get('/sections', [SectionController::class, 'index'])->name('sections');
        Route::post('/sections', [SectionController::class, 'store'])->name('sections.store');
        Route::get('/sections/import', [SectionController::class, 'importForm'])->name('sections.import');
        Route::post('/sections/import', [SectionController::class, 'importStore'])->name('sections.import.store');
        Route::patch('/sections/{section}', [SectionController::class, 'update'])->name('sections.update');
        Route::delete('/sections/{section}', [SectionController::class, 'destroy'])->name('sections.destroy');

        // Subjects
        Route::get('/subjects', [SubjectController::class, 'index'])->name('subjects');
        Route::post('/subjects', [SubjectController::class, 'store'])->name('subjects.store');
        Route::patch('/subjects/{subject}', [SubjectController::class, 'update'])->name('subjects.update');
        Route::delete('/subjects/{subject}', [SubjectController::class, 'destroy'])->name('subjects.destroy');

        // Schedules
        Route::get('/schedules', [ScheduleAdminController::class, 'index'])->name('schedules');
        Route::post('/schedules', [ScheduleAdminController::class, 'store'])->name('schedules.store');
        Route::patch('/schedules/{schedule}', [ScheduleAdminController::class, 'update'])->name('schedules.update');
        Route::delete('/schedules/{schedule}', [ScheduleAdminController::class, 'destroy'])->name('schedules.destroy');
    });

    // Super Admin management
    Route::middleware(['role:Super Admin'])->prefix('super')->name('super.')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        
        // Departments and Programs
        Route::get('/departments', [DepartmentController::class, 'index'])->name('departments');
        Route::post('/departments', [DepartmentController::class, 'store'])->name('departments.store');
        Route::patch('/departments/{department}', [DepartmentController::class, 'update'])->name('departments.update');
        Route::delete('/departments/{department}', [DepartmentController::class, 'destroy'])->name('departments.destroy');
        
        // Program management
        Route::post('/programs', [DepartmentController::class, 'storeProgram'])->name('programs.store');
        Route::patch('/programs/{program}', [DepartmentController::class, 'updateProgram'])->name('programs.update');
        Route::delete('/programs/{program}', [DepartmentController::class, 'destroyProgram'])->name('programs.destroy');
    });
});

require __DIR__.'/auth.php';