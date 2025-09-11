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
        'department',
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
            'College of Management and Accountancy' => [
                'BSA' => 'Bachelor of Science in Accountancy',
                'BSMA' => 'Bachelor of Science in Management Accounting',
                'BSAT' => 'Bachelor of Science in Accountancy Technology',
                'BSHM' => 'Bachelor of Science in Hospitality Management',
                'BSTM' => 'Bachelor of Science in Tourism Management',
                'BSBA' => 'Bachelor of Science in Business Administration',
                'BSBA-MM' => 'Bachelor of Science in Business Administration Major in Marketing Management',
                'BSBA-FM' => 'Bachelor of Science in Business Administration Major in Financial Management',
            ],
            'College of Education and Liberal Arts' => [
                'BAPS' => 'Bachelor of Arts in Political Science',
                'BSEED' => 'Bachelor of Science in Elementary Education',
                'BSED' => 'Bachelor of Secondary Education',
                'BSED-ENG' => 'Bachelor of Secondary Education Major in English',
                'BSED-MATH' => 'Bachelor of Secondary Education Major in Math',
                'BSED-SCI' => 'Bachelor of Secondary Education Major in Science',
                'BSED-SS' => 'Bachelor of Secondary Education Major in Social Studies',
            ],
            'College of Criminal Justice Education' => [
                'BSCRIM' => 'Bachelor of Science in Criminology',
            ],
            'College of Engineering and Architechture' => [
                'BSARCH' => 'Bachelor of Science in Architecture',
                'BSCpE' => 'Bachelor of Science in Computer Engineering',
                'BSCE' => 'Bachelor of Science in Civil Engineering',
                'BSEE' => 'Bachelor of Science in Electrical Engineering',
                'BSME' => 'Bachelor of Science in Mechanical Engineering',
            ],
            'College of Allied Health Sciences' => [
                'BSN' => 'Bachelor of Science in Nursing',
                'BSPHARM' => 'Bachelor of Science in Pharmacy',
                'BMLS' => 'Bachelor in Medical Laboratory Science',
                'BSPSYCH' => 'Bachelor of Science in Psychology',
            ],
            'College of Information Technology' => [
                'BSIT' => 'Bachelor of Science in Information Technology',
            ],
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

    public static function getDepartments(): array
    {
        return [
            'College of Management and Accountancy',
            'College of Education and Liberal Arts',
            'College of Criminal Justice Education',
            'College of Engineering and Architechture',
            'College of Allied Health Sciences',
            'College of Information Technology',
        ];
    }
}