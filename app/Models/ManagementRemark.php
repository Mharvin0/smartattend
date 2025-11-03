<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ManagementRemark extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id', 'week_start', 'week_end', 'remark', 'created_by'
    ];

    protected $casts = [
        'week_start' => 'date',
        'week_end' => 'date',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}


