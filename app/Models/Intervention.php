<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Intervention extends Model
{
	use HasFactory;

	protected $fillable = [
		'student_id','date','type','details','action_taken','responsible_staff','follow_up_date','outcome','recorded_by','status','priority','due_date'
	];

	protected $casts = [
		'date' => 'date',
		'follow_up_date' => 'date',
		'due_date' => 'date',
	];

	// Status constants
	public const STATUS_DONE = 'done';
	public const STATUS_IN_PROGRESS = 'in_progress';
	public const STATUS_NO_RESPONSE = 'no_response';

	// Priority constants
	public const PRIORITY_LOW = 'low';
	public const PRIORITY_MEDIUM = 'medium';
	public const PRIORITY_HIGH = 'high';

	public function student(): BelongsTo
	{
		return $this->belongsTo(Student::class);
	}

	public function recordedBy(): BelongsTo
	{
		return $this->belongsTo(User::class, 'recorded_by');
	}

	public function responsibleStaff(): BelongsTo
	{
		return $this->belongsTo(User::class, 'responsible_staff');
	}

	// Scopes for filtering
	public function scopeByStatus($query, $status)
	{
		return $query->where('status', $status);
	}

	public function scopeByPriority($query, $priority)
	{
		return $query->where('priority', $priority);
	}

	public function scopeByStudent($query, $studentId)
	{
		return $query->where('student_id', $studentId);
	}

	public function scopeByDepartment($query, $departmentId)
	{
		return $query->whereHas('student.section.program', function($q) use ($departmentId) {
			$q->where('department_id', $departmentId);
		});
	}

	public function scopeByProgram($query, $programId)
	{
		return $query->whereHas('student.section', function($q) use ($programId) {
			$q->where('program_id', $programId);
		});
	}

	public function scopeBySection($query, $sectionId)
	{
		return $query->whereHas('student', function($q) use ($sectionId) {
			$q->where('section_id', $sectionId);
		});
	}

	public function scopeByDateRange($query, $startDate, $endDate)
	{
		return $query->whereBetween('date', [$startDate, $endDate]);
	}

	public function scopeRecent($query, $days = 30)
	{
		return $query->where('date', '>=', now()->subDays($days));
	}

	// Accessors
	public function getStatusColorAttribute(): string
	{
		return match ($this->status) {
			self::STATUS_DONE => 'text-green-600',
			self::STATUS_IN_PROGRESS => 'text-yellow-600',
			self::STATUS_NO_RESPONSE => 'text-red-600',
			default => 'text-gray-600',
		};
	}

	public function getStatusBadgeAttribute(): string
	{
		return match ($this->status) {
			self::STATUS_DONE => 'bg-green-100 text-green-800',
			self::STATUS_IN_PROGRESS => 'bg-yellow-100 text-yellow-800',
			self::STATUS_NO_RESPONSE => 'bg-red-100 text-red-800',
			default => 'bg-gray-100 text-gray-800',
		};
	}

	public function getPriorityColorAttribute(): string
	{
		return match ($this->priority) {
			self::PRIORITY_HIGH => 'text-red-600',
			self::PRIORITY_MEDIUM => 'text-yellow-600',
			self::PRIORITY_LOW => 'text-green-600',
			default => 'text-gray-600',
		};
	}

	public function getPriorityBadgeAttribute(): string
	{
		return match ($this->priority) {
			self::PRIORITY_HIGH => 'bg-red-100 text-red-800',
			self::PRIORITY_MEDIUM => 'bg-yellow-100 text-yellow-800',
			self::PRIORITY_LOW => 'bg-green-100 text-green-800',
			default => 'bg-gray-100 text-gray-800',
		};
	}

	// Static methods
	public static function getStatusOptions(): array
	{
		return [
			['value' => self::STATUS_DONE, 'label' => 'Done', 'color' => 'text-green-600', 'bg' => 'bg-green-100'],
			['value' => self::STATUS_IN_PROGRESS, 'label' => 'In Progress', 'color' => 'text-yellow-600', 'bg' => 'bg-yellow-100'],
			['value' => self::STATUS_NO_RESPONSE, 'label' => 'No Response', 'color' => 'text-red-600', 'bg' => 'bg-red-100'],
		];
	}

	public static function getPriorityOptions(): array
	{
		return [
			['value' => self::PRIORITY_LOW, 'label' => 'Low', 'color' => 'text-green-600', 'bg' => 'bg-green-100'],
			['value' => self::PRIORITY_MEDIUM, 'label' => 'Medium', 'color' => 'text-yellow-600', 'bg' => 'bg-yellow-100'],
			['value' => self::PRIORITY_HIGH, 'label' => 'High', 'color' => 'text-red-600', 'bg' => 'bg-red-100'],
		];
	}
}
