<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'student_number',
        'department_id',
        'program_id',
        'year_level',
        'section_id',
        'gender',
        'birth_date',
        'guardian_name',
        'guardian_contact',
        'status',
        'priority',
        'absence_count',
        'notes'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(Intervention::class);
    }

    public function schedules()
    {
        return $this->belongsToMany(Schedule::class, 'student_schedules');
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'student_subjects');
    }

    public function teachers()
    {
        return $this->belongsToMany(User::class, 'student_teachers');
    }

    // Accessors
    public function getFullNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            'active' => 'text-green-600',
            'inactive' => 'text-gray-600',
            'suspended' => 'text-red-600',
            'graduated' => 'text-blue-600',
            default => 'text-gray-600',
        };
    }

    public function getStatusBadgeAttribute(): string
    {
        return match ($this->status) {
            'active' => 'bg-green-100 text-green-800',
            'inactive' => 'bg-gray-100 text-gray-800',
            'suspended' => 'bg-red-100 text-red-800',
            'graduated' => 'bg-blue-100 text-blue-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    // Scopes
    public function scopeBySection($query, $sectionId)
    {
        return $query->where('section_id', $sectionId);
    }

    public function scopeByYearLevel($query, $yearLevel)
    {
        return $query->where('year_level', $yearLevel);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('first_name', 'like', "%{$search}%")
              ->orWhere('last_name', 'like', "%{$search}%")
              ->orWhere('student_number', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });
    }

    // Priority calculation methods
    public function calculateAbsenceCount()
    {
        $absenceCount = $this->attendanceRecords()
            ->where('status', 'absent')
            ->count();
        
        $this->update(['absence_count' => $absenceCount]);
        return $absenceCount;
    }

    public function calculatePriority()
    {
        $absenceCount = $this->absence_count;
        
        if ($absenceCount < 4) {
            $priority = 'Safe';
        } elseif ($absenceCount >= 4 && $absenceCount < 8) {
            $priority = 'Call Needed';
        } else {
            $priority = 'PNS';
        }
        
        $this->update(['priority' => $priority]);
        return $priority;
    }

    public function updatePriority()
    {
        $this->calculateAbsenceCount();
        return $this->calculatePriority();
    }

    public function getPriorityColorAttribute(): string
    {
        return match ($this->priority) {
            'Safe' => 'text-green-600',
            'Call Needed' => 'text-yellow-600',
            'PNS' => 'text-red-600',
            default => 'text-gray-600',
        };
    }

    public function getPriorityBadgeAttribute(): string
    {
        return match ($this->priority) {
            'Safe' => 'bg-green-100 text-green-800',
            'Call Needed' => 'bg-yellow-100 text-yellow-800',
            'PNS' => 'bg-red-100 text-red-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }
}
