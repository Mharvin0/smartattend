<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceHistory extends Model
{
	use HasFactory;

	protected $fillable = [
		'attendance_record_id',
		'student_id',
		'date',
		'schedule_id',
		'old_status',
		'new_status',
		'changed_by',
		'changed_at',
		'remarks',
	];

	protected $casts = [
		'date' => 'date',
		'changed_at' => 'datetime',
	];

	// Relationships
	public function attendanceRecord(): BelongsTo
	{
		return $this->belongsTo(AttendanceRecord::class);
	}

	public function student(): BelongsTo
	{
		return $this->belongsTo(Student::class);
	}

	public function schedule(): BelongsTo
	{
		return $this->belongsTo(Schedule::class);
	}

	public function changedBy(): BelongsTo
	{
		return $this->belongsTo(User::class, 'changed_by');
	}

	// Scopes
	public function scopeByStudent($query, $studentId)
	{
		return $query->where('student_id', $studentId);
	}

	public function scopeByDate($query, $date)
	{
		return $query->whereDate('date', $date);
	}

	public function scopeRecent($query, $days = 30)
	{
		return $query->where('changed_at', '>=', now()->subDays($days));
	}

	// Accessors
	public function getChangeDescriptionAttribute()
	{
		if ($this->old_status && $this->new_status) {
			return "Changed from {$this->old_status} to {$this->new_status}";
		} elseif ($this->new_status) {
			return "Set to {$this->new_status}";
		}
		return "Status updated";
	}

	public function getFormattedChangedAtAttribute()
	{
		return $this->changed_at->format('M d, Y H:i:s');
	}

	// Static methods
	public static function getStudentHistory($studentId, $days = 30)
	{
		return self::byStudent($studentId)
			->recent($days)
			->with(['changedBy', 'schedule.subject'])
			->orderBy('changed_at', 'desc')
			->get();
	}

	public static function getRecentChanges($days = 7)
	{
		return self::recent($days)
			->with(['student', 'changedBy', 'schedule.subject'])
			->orderBy('changed_at', 'desc')
			->get();
	}
}


