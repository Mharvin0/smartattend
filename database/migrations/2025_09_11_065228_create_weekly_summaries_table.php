<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('weekly_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->date('week_start');
            $table->date('week_end');
            $table->unsignedSmallInteger('present_count')->default(0);
            $table->unsignedSmallInteger('absent_count')->default(0);
            $table->unsignedSmallInteger('late_count')->default(0);
            $table->float('improvement_index')->default(0);
            $table->timestamps();
            $table->unique(['student_id', 'week_start', 'week_end']);
            $table->index(['week_start', 'week_end']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weekly_summaries');
    }
};
