<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
	use HasFactory;

	protected $fillable = [
		'subject_id', 'section_id', 'day_of_week', 'time_start', 'time_end',
	];

	public function subject()
	{
		return $this->belongsTo(Subject::class);
	}

	public function section()
	{
		return $this->belongsTo(Section::class);
	}
}
