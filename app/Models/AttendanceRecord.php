<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class AttendanceRecord extends Model
{
    protected $fillable = [
        'student_id',
        'schedule_id',
        'date',
        'status',
        'remarks',
        'recorded_by',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    // Relationships
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(AttendanceHistory::class);
    }

    // Scopes
    public function scopeByDate($query, $date)
    {
        return $query->whereDate('date', $date);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeBySchedule($query, $scheduleId)
    {
        return $query->where('schedule_id', $scheduleId);
    }

    public function scopeBySection($query, $sectionId)
    {
        return $query->whereHas('student', function($q) use ($sectionId) {
            $q->where('section_id', $sectionId);
        });
    }

    public function scopeByDepartment($query, $departmentId)
    {
        return $query->whereHas('student.section', function($q) use ($departmentId) {
            $q->where('department_id', $departmentId);
        });
    }

    public function scopeByProgram($query, $programId)
    {
        return $query->whereHas('student.section', function($q) use ($programId) {
            $q->where('program_id', $programId);
        });
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('date', '>=', now()->subDays($days));
    }

    // Accessors
    public function getStatusColorAttribute()
    {
        return match($this->status) {
            'present' => 'text-green-600',
            'late' => 'text-yellow-600',
            'absent' => 'text-red-600',
            'excused' => 'text-blue-600',
            default => 'text-gray-600',
        };
    }

    public function getStatusBadgeAttribute()
    {
        return match($this->status) {
            'present' => 'bg-green-100 text-green-800',
            'late' => 'bg-yellow-100 text-yellow-800',
            'absent' => 'bg-red-100 text-red-800',
            'excused' => 'bg-blue-100 text-blue-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public function getFormattedDateAttribute()
    {
        return $this->date->format('M d, Y');
    }

    public function getTimeAttribute()
    {
        return $this->schedule ? $this->schedule->time_start . ' - ' . $this->schedule->time_end : 'N/A';
    }

    // Static methods
    public static function getStatusOptions()
    {
        return [
            'present' => 'Present',
            'late' => 'Late',
            'absent' => 'Absent',
            'excused' => 'Excused',
        ];
    }

    public static function getAttendanceStats($filters = [])
    {
        $query = self::query();

        // Apply filters
        if (isset($filters['date'])) {
            $query->byDate($filters['date']);
        }
        if (isset($filters['date_range'])) {
            $query->dateRange($filters['date_range'][0], $filters['date_range'][1]);
        }
        if (isset($filters['section_id'])) {
            $query->bySection($filters['section_id']);
        }
        if (isset($filters['department_id'])) {
            $query->byDepartment($filters['department_id']);
        }
        if (isset($filters['program_id'])) {
            $query->byProgram($filters['program_id']);
        }

        $total = $query->count();
        $present = $query->clone()->byStatus('present')->count();
        $late = $query->clone()->byStatus('late')->count();
        $absent = $query->clone()->byStatus('absent')->count();
        $excused = $query->clone()->byStatus('excused')->count();

        return [
            'total' => $total,
            'present' => $present,
            'late' => $late,
            'absent' => $absent,
            'excused' => $excused,
            'present_percentage' => $total > 0 ? round(($present / $total) * 100, 2) : 0,
            'absent_percentage' => $total > 0 ? round(($absent / $total) * 100, 2) : 0,
        ];
    }

    public static function getStudentAttendanceHistory($studentId, $days = 30)
    {
        return self::byStudent($studentId)
            ->recent($days)
            ->with(['schedule.subject', 'schedule.section'])
            ->orderBy('date', 'desc')
            ->get();
    }

    public static function getSectionAttendanceToday($sectionId)
    {
        return self::bySection($sectionId)
            ->byDate(now())
            ->with(['student', 'schedule.subject'])
            ->get();
    }

    public static function getAttendanceTrends($filters = [])
    {
        $query = self::query();

        if (isset($filters['section_id'])) {
            $query->bySection($filters['section_id']);
        }
        if (isset($filters['department_id'])) {
            $query->byDepartment($filters['department_id']);
        }
        if (isset($filters['program_id'])) {
            $query->byProgram($filters['program_id']);
        }

        return $query->selectRaw('DATE(date) as date, status, COUNT(*) as count')
            ->groupBy('date', 'status')
            ->orderBy('date', 'desc')
            ->get();
    }
}
