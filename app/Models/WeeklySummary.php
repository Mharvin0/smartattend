<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WeeklySummary extends Model
{
	use HasFactory;

	protected $fillable = [
		'student_id','week_start','week_end','present_count','absent_count','late_count','improvement_index'
	];

	public function student()
	{
		return $this->belongsTo(Student::class);
	}
}
