<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Teacher extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'department_id',
        'optional_department_id',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function optionalDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'optional_department_id');
    }

    /**
     * Get all departments this teacher belongs to (primary + optional)
     */
    public function getAllDepartments()
    {
        $departments = [$this->department];
        if ($this->optionalDepartment) {
            $departments[] = $this->optionalDepartment;
        }
        return collect($departments)->filter();
    }
}
