<?php

namespace App\Observers;

use App\Models\AttendanceRecord;

class AttendanceRecordObserver
{
    public function created(AttendanceRecord $attendanceRecord): void
    {
        $attendanceRecord->student?->updatePriority();
    }

    public function updated(AttendanceRecord $attendanceRecord): void
    {
        $attendanceRecord->student?->updatePriority();
    }

    public function deleted(AttendanceRecord $attendanceRecord): void
    {
        $attendanceRecord->student?->updatePriority();
    }
}

