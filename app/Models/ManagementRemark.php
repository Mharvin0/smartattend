<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ManagementRemark extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'student_id', 'week_start', 'week_end', 'remark', 'specific_reasons', 'created_by', 'archived', 'archived_at', 'archived_by'
    ];

    protected $casts = [
        'week_start' => 'date',
        'week_end' => 'date',
        'archived' => 'boolean',
        'archived_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function archiver()
    {
        return $this->belongsTo(User::class, 'archived_by');
    }
}


