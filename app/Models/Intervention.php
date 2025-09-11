<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Intervention extends Model
{
	use HasFactory;

	protected $fillable = [
		'student_id','date','type','details','action_taken','responsible_staff','follow_up_date','outcome','recorded_by'
	];

	public function student()
	{
		return $this->belongsTo(Student::class);
	}
}
