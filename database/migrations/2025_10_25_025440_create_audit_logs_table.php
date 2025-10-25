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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('event_type'); // e.g., 'user_login', 'data_created', 'system_maintenance'
            $table->string('event_category'); // e.g., 'authentication', 'data_management', 'system_admin'
            $table->string('description'); // User-friendly description
            $table->string('user_email')->nullable(); // Who performed the action
            $table->string('user_name')->nullable(); // User's name
            $table->string('ip_address')->nullable(); // IP address of the user
            $table->string('user_agent')->nullable(); // Browser/device info
            $table->json('metadata')->nullable(); // Additional data (old values, new values, etc.)
            $table->string('status')->default('success'); // success, failed, warning
            $table->string('severity')->default('info'); // info, warning, error, critical
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['event_type', 'created_at']);
            $table->index(['user_email', 'created_at']);
            $table->index(['event_category', 'created_at']);
            $table->index(['status', 'created_at']);
            $table->index(['severity', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};