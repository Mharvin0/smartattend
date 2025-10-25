<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
	use HasFactory;

	protected $fillable = [
		'subject_id', 'section_id', 'day_of_week', 'time_start', 'time_end',
		'department', 'program', 'day', 'department_id', 'program_id',
	];

	public function subject()
	{
		return $this->belongsTo(Subject::class);
	}

	public function section()
	{
		return $this->belongsTo(Section::class);
	}

	public function department()
	{
		return $this->belongsTo(Department::class);
	}

	public function program()
	{
		return $this->belongsTo(Program::class);
	}

	/**
	 * Get available days of the week
	 */
	public static function getDays()
	{
		return [
			'Monday' => 'Monday',
			'Tuesday' => 'Tuesday',
			'Wednesday' => 'Wednesday',
			'Thursday' => 'Thursday',
			'Friday' => 'Friday',
			'Saturday' => 'Saturday',
			'Sunday' => 'Sunday',
		];
	}

	/**
	 * Get formatted time range
	 */
	public function getTimeRangeAttribute()
	{
		return $this->time_start . ' - ' . $this->time_end;
	}

	/**
	 * Get formatted day and time
	 */
	public function getDayTimeAttribute()
	{
		return $this->day . ' (' . $this->time_range . ')';
	}
}
