<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentTracking extends Model
{
    use SoftDeletes;

    protected $table = 'student_tracking';

    protected $fillable = [
        'student_id',
        'tracked_by',
        'type',
        'date',
        'time',
        'notes',
        'status',
        'outcome',
        'follow_up_required',
        'follow_up_date',
        'archived',
        'archived_at',
    ];

    protected $casts = [
        'date' => 'date',
        'time' => 'datetime',
        'follow_up_date' => 'date',
        'archived' => 'boolean',
        'archived_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function trackedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tracked_by');
    }
}

