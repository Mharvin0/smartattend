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
        Schema::table('schedules', function (Blueprint $table) {
            $table->string('department')->nullable();
            $table->string('program')->nullable();
            $table->string('day')->nullable(); // Day name (Monday, Tuesday, etc.)
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedBigInteger('program_id')->nullable();
            
            // Add foreign key constraints
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
            $table->foreign('program_id')->references('id')->on('programs')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropForeign(['program_id']);
            $table->dropColumn([
                'department',
                'program',
                'day',
                'department_id',
                'program_id'
            ]);
        });
    }
};