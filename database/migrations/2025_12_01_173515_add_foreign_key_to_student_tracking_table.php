<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the table if it exists without foreign keys
        if (Schema::hasTable('student_tracking')) {
            Schema::dropIfExists('student_tracking');
        }
        
        Schema::create('student_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('tracked_by')->nullable();
            $table->enum('type', ['call', 'home_visit']);
            $table->date('date');
            $table->time('time')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['completed', 'scheduled', 'cancelled', 'no_answer'])->default('completed');
            $table->text('outcome')->nullable();
            $table->text('follow_up_required')->nullable();
            $table->date('follow_up_date')->nullable();
            $table->timestamps();
            $table->index(['student_id', 'date']);
            $table->index(['tracked_by', 'date']);
            
            $table->foreign('tracked_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_tracking');
    }
};
