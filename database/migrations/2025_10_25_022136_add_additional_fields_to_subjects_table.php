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
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('department')->nullable();
            $table->string('program')->nullable();
            $table->string('year_level')->nullable();
            $table->string('semester')->nullable();
            $table->string('adviser')->nullable();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedBigInteger('program_id')->nullable();
            
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
            $table->foreign('program_id')->references('id')->on('programs')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropForeign(['program_id']);
            $table->dropColumn([
                'department',
                'program', 
                'year_level',
                'semester',
                'adviser',
                'department_id',
                'program_id'
            ]);
        });
    }
};
