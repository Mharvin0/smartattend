<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AttendanceImportRequest extends FormRequest
{
	public function authorize(): bool
	{
		return $this->user()?->hasAnyRole(['Admin', 'Super Admin']) ?? false;
	}

	public function rules(): array
	{
		return [
			'file' => ['required', 'file', 'mimetypes:text/plain,text/csv,text/tsv,text/comma-separated-values,application/vnd.ms-excel', 'max:10240'],
		];
	}
}
