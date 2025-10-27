<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Section extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'year_level',
        'adviser_name',
        'adviser_id',
        'program',
        'department',
        'semester',
        'academic_year',
        'department_id',
        'program_id',
    ];

    protected $appends = ['students_count'];

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
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

    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'teacher_sections', 'section_id', 'teacher_id')
                    ->withPivot('subject')
                    ->withTimestamps();
    }

    public function adviser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adviser_id');
    }

    public function getStudentsCountAttribute(): int
    {
        return $this->students()->count();
    }

    public static function getYearLevels(): array
    {
        return [
            '1st Year',
            '2nd Year',
            '3rd Year',
            '4th Year',
        ];
    }

    public static function getPrograms(): array
    {
        $departments = Department::with('programs')->where('is_active', true)->get();
        $programs = [];
        
        foreach ($departments as $department) {
            $departmentPrograms = [];
            foreach ($department->programs->where('is_active', true) as $program) {
                $departmentPrograms[$program->code] = $program->name;
            }
            if (!empty($departmentPrograms)) {
                $programs[$department->name] = $departmentPrograms;
            }
        }
        
        return $programs;
    }

    public static function getSemesters(): array
    {
        return [
            '1st Semester',
            '2nd Semester',
            'Summer',
        ];
    }

    public static function getDepartments(): array
    {
        return Department::where('is_active', true)->pluck('name')->toArray();
    }
}