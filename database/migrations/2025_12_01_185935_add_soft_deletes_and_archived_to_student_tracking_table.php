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
        Schema::table('student_tracking', function (Blueprint $table) {
            $table->boolean('archived')->default(false)->after('follow_up_date');
            $table->timestamp('archived_at')->nullable()->after('archived');
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_tracking', function (Blueprint $table) {
            $table->dropColumn(['archived', 'archived_at', 'deleted_at']);
        });
    }
};
