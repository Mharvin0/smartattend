<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
}


