<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
	public function up(): void
	{
		Schema::create('attendance_histories', function (Blueprint $table) {
			$table->id();
			$table->foreignId('attendance_record_id')->nullable()->constrained('attendance_records')->nullOnDelete();
			$table->foreignId('student_id')->constrained()->cascadeOnDelete();
			$table->date('date');
			$table->foreignId('schedule_id')->nullable()->constrained()->nullOnDelete();
			$table->enum('old_status', ['present', 'late', 'absent', 'excused'])->nullable();
			$table->enum('new_status', ['present', 'late', 'absent', 'excused']);
			$table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
			$table->timestamp('changed_at');
			$table->text('remarks')->nullable();
			$table->timestamps();
			$table->index(['student_id', 'date']);
		});
	}

	public function down(): void
	{
		Schema::dropIfExists('attendance_histories');
	}
};
