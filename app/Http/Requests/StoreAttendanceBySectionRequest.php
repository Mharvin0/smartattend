<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceBySectionRequest extends FormRequest
{
	public function authorize(): bool
	{
		return $this->user()?->hasAnyRole(['Admin', 'Super Admin']) ?? false;
	}

	public function rules(): array
	{
		return [
			'date' => ['required', 'date'],
			'records' => ['required', 'array', 'min:1'],
			'records.*.student_id' => ['required', 'integer', 'exists:students,id'],
			'records.*.status' => ['required', 'in:present,late,absent,excused'],
			'records.*.remarks' => ['nullable', 'string', 'max:1000'],
		];
	}
}
