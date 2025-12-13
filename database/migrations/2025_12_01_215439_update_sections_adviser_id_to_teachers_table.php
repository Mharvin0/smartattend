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
        Schema::table('sections', function (Blueprint $table) {
            // Drop the old foreign key constraint
            $table->dropForeign(['adviser_id']);
            
            // Change the foreign key to reference teachers table
            $table->foreign('adviser_id')
                ->references('id')
                ->on('teachers')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            // Drop the teachers foreign key
            $table->dropForeign(['adviser_id']);
            
            // Restore the users foreign key
            $table->foreign('adviser_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
        });
    }
};
