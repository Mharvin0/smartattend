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
use App\Http\Controllers\Admin\AdminPageController;
use App\Http\Controllers\Admin\AdminTrackingController;
use App\Http\Controllers\CSDL\CSDLPageController;
use App\Http\Controllers\CSDL\DashboardController as CSDLDashboardController;
use App\Http\Controllers\CSDL\ReportController as CSDLReportController;
use App\Http\Controllers\Super\SystemAdminController;
use App\Http\Controllers\Super\SuperAdminController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => false,
    ]);
});

Route::middleware(['auth', \App\Http\Middleware\RequirePasswordChange::class])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Debug route to test authentication
    Route::get('/debug-auth', function () {
        $user = auth()->user();
        return response()->json([
            'authenticated' => auth()->check(),
            'user' => $user ? $user->name : 'Not authenticated',
            'email' => $user ? $user->email : 'N/A',
            'roles' => $user ? $user->roles->pluck('name') : [],
            'has_admin_role' => $user ? $user->hasRole('Admin') : false,
            'has_super_admin_role' => $user ? $user->hasRole('Super Admin') : false,
            'can_access_admin' => $user ? $user->hasAnyRole(['Admin', 'Super Admin']) : false,
            'session_id' => session()->getId(),
        ]);
    })->name('debug.auth');

    // Admin (PedroHub) routes - Only for Admin and Super Admin roles (explicitly exclude CSDL)
    // CSDL users are blocked at the controller level
    Route::middleware(['auth', \App\Http\Middleware\RequirePasswordChange::class])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [AdminPageController::class, 'index'])->name('dashboard');
        Route::get('/admin-page', [AdminPageController::class, 'index'])->name('admin-page');
        Route::get('/admin-page/live-data', [AdminPageController::class, 'getLiveData'])->name('admin-page.live-data');
        Route::post('/admin-page/quick-attendance', [AdminPageController::class, 'quickAttendance'])->name('admin-page.quick-attendance');
        Route::post('/admin-page/intervention', [AdminPageController::class, 'createIntervention'])->name('admin-page.intervention');
        Route::post('/admin-page/communication', [AdminPageController::class, 'sendCommunication'])->name('admin-page.communication');
        Route::post('/admin-page/bulk-operation', [AdminPageController::class, 'bulkOperation'])->name('admin-page.bulk-operation');
        Route::post('/admin-page/student', [AdminPageController::class, 'storeStudent'])->name('admin-page.student.store');
        Route::post('/admin-page/export-records', [AdminPageController::class, 'exportStudentRecords'])->name('admin-page.export-records');
        Route::get('/student/{student}', [DashboardController::class, 'studentProfile'])->name('student');

				// Attendance
				Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance');
				Route::get('/attendance/by-section', [AttendanceController::class, 'bySection'])->name('attendance.section');
				Route::post('/attendance/by-section', [AttendanceController::class, 'storeSection'])->name('attendance.section.store');
				Route::get('/attendance/by-schedule', [AttendanceController::class, 'bySchedule'])->name('attendance.schedule');
				Route::post('/attendance/by-schedule', [AttendanceController::class, 'storeSchedule'])->name('attendance.schedule.store');
				Route::get('/attendance/import', [AttendanceController::class, 'importForm'])->name('attendance.import');
				Route::post('/attendance/import', [AttendanceController::class, 'importStore'])->name('attendance.import.store');
				Route::post('/attendance/bulk-update', [AttendanceController::class, 'bulkUpdate'])->name('attendance.bulk-update');
				Route::get('/attendance/analytics', [AttendanceController::class, 'analytics'])->name('attendance.analytics');
				Route::get('/attendance/department-rates', [AttendanceController::class, 'departmentAttendanceRates'])->name('attendance.department-rates');
				Route::get('/attendance/faculty-compliance', [AttendanceController::class, 'facultyCompliance'])->name('attendance.faculty-compliance');
				Route::post('/attendance/generate-report', [AttendanceController::class, 'generateReport'])->name('attendance.generate-report');
        Route::get('/attendance/student/{student}/history', [AttendanceController::class, 'studentHistory'])->name('attendance.student.history');

        // Student Tracking (replaces Interventions)
        Route::get('/tracking', [AdminTrackingController::class, 'index'])->name('tracking');
        Route::post('/tracking/track-student', [AdminTrackingController::class, 'trackStudent'])->name('tracking.track-student');
        Route::get('/tracking/archived', [AdminTrackingController::class, 'getArchivedTracking'])->name('tracking.archived-tracking');
        Route::get('/tracking/deleted', [AdminTrackingController::class, 'getDeletedTracking'])->name('tracking.deleted-tracking');
        Route::get('/tracking/export', [AdminTrackingController::class, 'exportTracking'])->name('tracking.export-tracking');
        Route::get('/tracking/{id}', [AdminTrackingController::class, 'viewTracking'])->name('tracking.view-tracking');
        Route::put('/tracking/{id}', [AdminTrackingController::class, 'updateTracking'])->name('tracking.update-tracking');
        Route::post('/tracking/{id}/archive', [AdminTrackingController::class, 'archiveTracking'])->name('tracking.archive-tracking');
        Route::post('/tracking/{id}/unarchive', [AdminTrackingController::class, 'unarchiveTracking'])->name('tracking.unarchive-tracking');
        Route::post('/tracking/{id}/restore', [AdminTrackingController::class, 'restoreTracking'])->name('tracking.restore-tracking');
        Route::delete('/tracking/{id}', [AdminTrackingController::class, 'deleteTracking'])->name('tracking.delete-tracking');
        
        // Student attention management routes
        Route::get('/tracking/students/deleted', [AdminTrackingController::class, 'getDeletedStudents'])->name('tracking.deleted-students');
        Route::post('/tracking/students/{id}/restore', [AdminTrackingController::class, 'restoreStudent'])->name('tracking.restore-student');
        Route::post('/tracking/students/{id}/archive-from-attention', [AdminTrackingController::class, 'archiveStudentFromAttention'])->name('tracking.archive-student-from-attention');
        Route::delete('/tracking/students/{id}', [AdminTrackingController::class, 'destroyStudent'])->name('tracking.delete-student');

        // Interventions (legacy - kept for backward compatibility)
        Route::get('/interventions', [InterventionController::class, 'index'])->name('interventions');
        Route::post('/interventions', [InterventionController::class, 'store'])->name('interventions.store');
        Route::patch('/interventions/{intervention}', [InterventionController::class, 'update'])->name('interventions.update');
        Route::patch('/interventions/{intervention}/status', [InterventionController::class, 'updateStatus'])->name('interventions.status');
        Route::delete('/interventions/{intervention}', [InterventionController::class, 'destroy'])->name('interventions.destroy');
        Route::post('/interventions/bulk', [InterventionController::class, 'bulkAction'])->name('interventions.bulk');

        // Reports
        Route::get('/reports', [ReportController::class, 'index'])->name('reports');
        Route::get('/reports/weekly/pdf', [ReportController::class, 'weeklyPdf'])->name('reports.weekly.pdf');

               // Sections
               Route::get('/sections', [SectionController::class, 'index'])->name('sections');
               Route::get('/sections/{section}', [SectionController::class, 'show'])->name('sections.show');
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

        // Students
        Route::get('/students', [\App\Http\Controllers\Admin\StudentController::class, 'index'])->name('students');
        Route::post('/students', [\App\Http\Controllers\Admin\StudentController::class, 'store'])->name('students.store');
        Route::patch('/students/{student}', [\App\Http\Controllers\Admin\StudentController::class, 'update'])->name('students.update');
        Route::post('/students/import', [\App\Http\Controllers\Admin\StudentController::class, 'import'])->name('students.import');
        Route::post('/students/export', [\App\Http\Controllers\Admin\StudentController::class, 'export'])->name('students.export');
        Route::post('/students/update-priority', [\App\Http\Controllers\Admin\StudentController::class, 'updatePriority'])->name('students.update-priority');
        Route::post('/students/{student}/send-to-csdl', [\App\Http\Controllers\Admin\StudentController::class, 'sendToCSDL'])->name('students.send-to-csdl');
        Route::delete('/students/{student}', [\App\Http\Controllers\Admin\StudentController::class, 'destroy'])->name('students.destroy');
        Route::get('/students/{student}', [\App\Http\Controllers\Admin\StudentController::class, 'show'])->name('students.show');
    });

    // CSDL routes - Only for CSDL role
    Route::middleware(['auth', 'role:CSDL', \App\Http\Middleware\RequirePasswordChange::class])->prefix('csdl')->name('csdl.')->group(function () {
        Route::get('/', [CSDLDashboardController::class, 'index'])->name('dashboard');
        Route::get('/dashboard/live-data', [CSDLDashboardController::class, 'getLiveData'])->name('dashboard.live-data');
        Route::get('/csdl-page', [CSDLPageController::class, 'index'])->name('csdl-page');
        Route::post('/csdl-page/track-student', [CSDLPageController::class, 'trackStudent'])->name('csdl-page.track-student');
        Route::get('/csdl-page/tracking/archived', [CSDLPageController::class, 'getArchivedTracking'])->name('csdl-page.archived-tracking');
        Route::get('/csdl-page/tracking/deleted', [CSDLPageController::class, 'getDeletedTracking'])->name('csdl-page.deleted-tracking');
        Route::get('/csdl-page/tracking/export', [CSDLPageController::class, 'exportTracking'])->name('csdl-page.export-tracking');
        Route::get('/csdl-page/tracking/{id}', [CSDLPageController::class, 'viewTracking'])->name('csdl-page.view-tracking');
        Route::put('/csdl-page/tracking/{id}', [CSDLPageController::class, 'updateTracking'])->name('csdl-page.update-tracking');
        Route::post('/csdl-page/tracking/{id}/archive', [CSDLPageController::class, 'archiveTracking'])->name('csdl-page.archive-tracking');
        Route::post('/csdl-page/tracking/{id}/unarchive', [CSDLPageController::class, 'unarchiveTracking'])->name('csdl-page.unarchive-tracking');
        Route::post('/csdl-page/tracking/{id}/restore', [CSDLPageController::class, 'restoreTracking'])->name('csdl-page.restore-tracking');
        Route::delete('/csdl-page/tracking/{id}', [CSDLPageController::class, 'deleteTracking'])->name('csdl-page.delete-tracking');
        
        // Student attention management routes
        Route::get('/csdl-page/students/deleted', [CSDLPageController::class, 'getDeletedStudents'])->name('csdl-page.deleted-students');
        Route::post('/csdl-page/students/{id}/restore', [CSDLPageController::class, 'restoreStudent'])->name('csdl-page.restore-student');
        Route::post('/csdl-page/students/{id}/archive-from-attention', [CSDLPageController::class, 'archiveStudentFromAttention'])->name('csdl-page.archive-student-from-attention');
        Route::delete('/csdl-page/students/{id}', [CSDLPageController::class, 'destroyStudent'])->name('csdl-page.delete-student');
        Route::get('/reports', [CSDLReportController::class, 'index'])->name('reports');
        Route::get('/reports/export', [CSDLReportController::class, 'export'])->name('reports.export');
        Route::get('/reports/{id}', [CSDLReportController::class, 'show'])->name('reports.show');
        Route::post('/reports/{id}/archive', [CSDLReportController::class, 'archive'])->name('reports.archive');
        Route::post('/reports/{id}/unarchive', [CSDLReportController::class, 'unarchive'])->name('reports.unarchive');
        Route::delete('/reports/{id}', [CSDLReportController::class, 'destroy'])->name('reports.destroy');
        Route::post('/reports/{id}/restore', [CSDLReportController::class, 'restore'])->name('reports.restore');
    });

    // Redirect CSDL away from admin routes (only if they don't have admin roles)
    Route::middleware(['auth', 'role:CSDL', \App\Http\Middleware\RequirePasswordChange::class])->group(function () {
        Route::get('/admin', function () {
            return redirect()->route('csdl.dashboard');
        });
    });

    // Super Admin management
    Route::middleware(['auth', 'role:Super Admin', \App\Http\Middleware\RequirePasswordChange::class])->prefix('super')->name('super.')->group(function () {
        Route::get('/', [SystemAdminController::class, 'index'])->name('dashboard');
        
        // Super Admin tabs
        Route::get('/management', [SystemAdminController::class, 'management'])->name('management');
        // Backward-compat: redirect old Interventions URL to Management
        Route::get('/interventions', function () {
            return redirect()->route('super.management');
        });
        Route::get('/attendance', [SystemAdminController::class, 'attendance'])->name('attendance');
        Route::get('/attendance/live-data', [SystemAdminController::class, 'getAttendanceLiveData'])->name('attendance.live-data');
        Route::get('/sections', [SystemAdminController::class, 'sections'])->name('sections');
        Route::post('/sections', [SystemAdminController::class, 'storeSection'])->name('sections.store');
        Route::put('/sections/{id}', [SystemAdminController::class, 'updateSection'])->name('sections.update');
        Route::delete('/sections/{id}', [SystemAdminController::class, 'destroySection'])->name('sections.destroy');
        
        // Sections Management - Import routes only
        Route::get('/sections/import', [SectionController::class, 'importForm'])->name('sections.import');
        Route::post('/sections/import', [SectionController::class, 'importStore'])->name('sections.import.store');
        
        // Subjects Management
        Route::get('/subjects', [SubjectController::class, 'index'])->name('subjects');
        Route::post('/subjects', [SubjectController::class, 'store'])->name('subjects.store');
        Route::patch('/subjects/{subject}', [SubjectController::class, 'update'])->name('subjects.update');
        Route::delete('/subjects/{subject}', [SubjectController::class, 'destroy'])->name('subjects.destroy');
        
        // Schedules Management
        Route::get('/schedules', [ScheduleAdminController::class, 'index'])->name('schedules');
        Route::post('/schedules', [ScheduleAdminController::class, 'store'])->name('schedules.store');
        Route::patch('/schedules/{schedule}', [ScheduleAdminController::class, 'update'])->name('schedules.update');
        Route::delete('/schedules/{schedule}', [ScheduleAdminController::class, 'destroy'])->name('schedules.destroy');
        Route::get('/settings', [SystemAdminController::class, 'settings'])->name('settings');
        
        // Student Management
        Route::post('/students', [SystemAdminController::class, 'storeStudent'])->name('students.store');
        Route::patch('/students/{id}', [SystemAdminController::class, 'updateStudent'])->name('students.update');
        Route::post('/students/{id}/send-to-csdl', [SystemAdminController::class, 'sendStudentToCSDL'])->name('students.send-to-csdl');
        Route::get('/students/deleted', [SystemAdminController::class, 'getDeletedStudents'])->name('students.deleted');
        Route::post('/students/{id}/restore', [SystemAdminController::class, 'restoreStudent'])->name('students.restore');
        Route::delete('/students/{id}', [SystemAdminController::class, 'destroyStudent'])->name('students.destroy');
        Route::post('/students/import', [SystemAdminController::class, 'importStudents'])->name('students.import');
        Route::post('/students/export', [SystemAdminController::class, 'exportStudents'])->name('students.export');
        Route::get('/departments/{id}/teachers', [SystemAdminController::class, 'getDepartmentTeachers'])->name('departments.get-teachers');
        
        // Cleanup Duplicates
        Route::post('/cleanup-duplicates', [SystemAdminController::class, 'cleanupDuplicates'])->name('cleanup.duplicates');
        
        // Student Tracking routes
        Route::post('/management/track-student', [SystemAdminController::class, 'trackStudent'])->name('management.track-student');
        // These specific routes must come before the {id} routes to avoid route conflicts
        Route::get('/management/tracking', [SystemAdminController::class, 'getTrackingRecords'])->name('management.get-tracking');
        Route::get('/management/tracking/archived', [SystemAdminController::class, 'getArchivedTracking'])->name('management.archived-tracking');
        Route::get('/management/tracking/deleted', [SystemAdminController::class, 'getDeletedTracking'])->name('management.deleted-tracking');
        Route::get('/management/tracking/export', [SystemAdminController::class, 'exportTracking'])->name('management.export-tracking');
        Route::get('/management/tracking/{id}', [SystemAdminController::class, 'viewTracking'])->name('management.view-tracking');
        Route::post('/management/tracking/{id}/archive', [SystemAdminController::class, 'archiveTracking'])->name('management.archive-tracking');
        Route::post('/management/tracking/{id}/unarchive', [SystemAdminController::class, 'unarchiveTracking'])->name('management.unarchive-tracking');
        Route::post('/management/tracking/{id}/restore', [SystemAdminController::class, 'restoreTracking'])->name('management.restore-tracking');
        Route::put('/management/tracking/{id}', [SystemAdminController::class, 'updateTracking'])->name('management.update-tracking');
        Route::delete('/management/tracking/{id}', [SystemAdminController::class, 'deleteTracking'])->name('management.delete-tracking');
        
        // Student attention management routes
        Route::post('/management/students/{id}/archive-from-attention', [SystemAdminController::class, 'archiveStudentFromAttention'])->name('management.archive-student-from-attention');
        Route::delete('/management/students/{id}', [SystemAdminController::class, 'destroyStudent'])->name('management.delete-student');

        // Teacher/Adviser Management Routes
        Route::get('/teachers', [SystemAdminController::class, 'teachers'])->name('teachers');
        Route::post('/teachers', [SystemAdminController::class, 'storeTeacher'])->name('teachers.store');
        Route::put('/teachers/{id}', [SystemAdminController::class, 'updateTeacher'])->name('teachers.update');
        Route::delete('/teachers/{id}', [SystemAdminController::class, 'destroyTeacher'])->name('teachers.destroy');
        
        // CSDL User Management Routes
        Route::post('/csdl-users', [SystemAdminController::class, 'storeCSDLUser'])->name('csdl-users.store');
        Route::put('/csdl-users/{id}', [SystemAdminController::class, 'updateCSDLUser'])->name('csdl-users.update');
        Route::delete('/csdl-users/{id}', [SystemAdminController::class, 'destroyCSDLUser'])->name('csdl-users.destroy');
        
        // Intervention Management Routes
        Route::post('/interventions', [SystemAdminController::class, 'storeIntervention'])->name('interventions.store');
        Route::put('/interventions/{id}', [SystemAdminController::class, 'updateIntervention'])->name('interventions.update');
        Route::delete('/interventions/{id}', [SystemAdminController::class, 'destroyIntervention'])->name('interventions.destroy');

        // Dashboard refresh route
        Route::get('/dashboard/refresh', [SystemAdminController::class, 'refreshDashboard'])->name('dashboard.refresh');
        
        // Section Management Routes
        Route::post('/sections', [SystemAdminController::class, 'storeSection'])->name('sections.store');
        Route::put('/sections/{id}', [SystemAdminController::class, 'updateSection'])->name('sections.update');
        Route::delete('/sections/{id}', [SystemAdminController::class, 'destroySection'])->name('sections.destroy');
        
        Route::get('/users', [UserController::class, 'index'])->name('users');
        Route::get('/users/deactivated', [UserController::class, 'getDeactivated'])->name('users.deactivated');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::post('/users/{id}/restore', [UserController::class, 'restore'])->name('users.restore');
        
        // Departments and Programs
        Route::get('/departments', [DepartmentController::class, 'index'])->name('departments');
        Route::post('/departments', [DepartmentController::class, 'store'])->name('departments.store');
        Route::patch('/departments/{department}', [DepartmentController::class, 'update'])->name('departments.update');
        Route::delete('/departments/{department}', [DepartmentController::class, 'destroy'])->name('departments.destroy');
        
        // Program management
        Route::post('/programs', [DepartmentController::class, 'storeProgram'])->name('programs.store');
        Route::patch('/programs/{program}', [DepartmentController::class, 'updateProgram'])->name('programs.update');
        Route::delete('/programs/{program}', [DepartmentController::class, 'destroyProgram'])->name('programs.destroy');
        
				// System Administration
				Route::get('/system-admin', [SystemAdminController::class, 'systemAdmin'])->name('system-admin');
				Route::get('/system-admin/test', [SystemAdminController::class, 'test'])->name('system-admin.test');
				Route::post('/system-admin/clear-cache', [SystemAdminController::class, 'clearCache'])->name('system-admin.clear-cache');
				Route::post('/system-admin/optimize', [SystemAdminController::class, 'optimizeSystem'])->name('system-admin.optimize');
				Route::post('/system-admin/backup', [SystemAdminController::class, 'createBackup'])->name('system-admin.backup');
				Route::post('/system-admin/maintenance', [SystemAdminController::class, 'runMaintenance'])->name('system-admin.maintenance');
				Route::get('/system-admin/logs', [SystemAdminController::class, 'getSystemLogs'])->name('system-admin.logs');
				
				// Super Admin Attendance Features
				Route::get('/attendance/department-rates', [SystemAdminController::class, 'departmentAttendanceRates'])->name('attendance.department-rates');
				Route::get('/attendance/faculty-compliance', [SystemAdminController::class, 'facultyCompliance'])->name('attendance.faculty-compliance');
				Route::post('/attendance/generate-report', [SystemAdminController::class, 'generateReport'])->name('attendance.generate-report');
        
    });
});

require __DIR__.'/auth.php';