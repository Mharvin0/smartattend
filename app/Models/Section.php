<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Section extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'year_level',
        'adviser_name',
        'program',
        'semester',
        'academic_year',
    ];

    protected $appends = ['students_count'];

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
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
            '5th Year',
        ];
    }

    public static function getPrograms(): array
    {
        return [
            'BSIT' => 'Bachelor of Science in Information Technology',
            'BSCS' => 'Bachelor of Science in Computer Science',
            'BSIS' => 'Bachelor of Science in Information Systems',
            'BSCpE' => 'Bachelor of Science in Computer Engineering',
            'BSEMC' => 'Bachelor of Science in Entertainment and Multimedia Computing',
        ];
    }

    public static function getSemesters(): array
    {
        return [
            '1st Semester',
            '2nd Semester',
            'Summer',
        ];
    }
}