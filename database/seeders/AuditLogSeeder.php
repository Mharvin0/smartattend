<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use Illuminate\Database\Seeder;

class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        // Create sample audit logs
        $auditLogs = [
            [
                'event_type' => AuditLog::TYPE_USER_LOGIN,
                'event_category' => AuditLog::CATEGORY_AUTHENTICATION,
                'description' => 'User logged in successfully',
                'user_email' => 'superadmin@smartattend.local',
                'user_name' => 'Super Admin',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'status' => AuditLog::STATUS_SUCCESS,
                'severity' => AuditLog::SEVERITY_INFO,
                'created_at' => now()->subHours(2),
            ],
            [
                'event_type' => AuditLog::TYPE_SYSTEM_BACKUP,
                'event_category' => AuditLog::CATEGORY_SYSTEM_ADMIN,
                'description' => 'Database backup completed successfully',
                'user_email' => 'superadmin@smartattend.local',
                'user_name' => 'Super Admin',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'status' => AuditLog::STATUS_SUCCESS,
                'severity' => AuditLog::SEVERITY_INFO,
                'metadata' => ['backup_file' => 'backup_2025-10-25_02-44-19.sql', 'file_size' => '200KB'],
                'created_at' => now()->subHours(1),
            ],
            [
                'event_type' => AuditLog::TYPE_CACHE_CLEAR,
                'event_category' => AuditLog::CATEGORY_SYSTEM_ADMIN,
                'description' => 'System cache cleared successfully',
                'user_email' => 'superadmin@smartattend.local',
                'user_name' => 'Super Admin',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'status' => AuditLog::STATUS_SUCCESS,
                'severity' => AuditLog::SEVERITY_INFO,
                'metadata' => ['cache_types' => ['application', 'config', 'route', 'view', 'event']],
                'created_at' => now()->subMinutes(30),
            ],
            [
                'event_type' => AuditLog::TYPE_SYSTEM_MAINTENANCE,
                'event_category' => AuditLog::CATEGORY_SYSTEM_ADMIN,
                'description' => 'System maintenance completed successfully',
                'user_email' => 'superadmin@smartattend.local',
                'user_name' => 'Super Admin',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'status' => AuditLog::STATUS_SUCCESS,
                'severity' => AuditLog::SEVERITY_INFO,
                'metadata' => ['maintenance_tasks' => ['migrate', 'seed']],
                'created_at' => now()->subMinutes(15),
            ],
            [
                'event_type' => AuditLog::TYPE_DATA_CREATE,
                'event_category' => AuditLog::CATEGORY_DATA_MANAGEMENT,
                'description' => 'New section created',
                'user_email' => 'pedrohub@smartattend.local',
                'user_name' => 'PedroHub Admin',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'status' => AuditLog::STATUS_SUCCESS,
                'severity' => AuditLog::SEVERITY_INFO,
                'metadata' => ['section_name' => 'BSIT 1A', 'department' => 'Computer Studies'],
                'created_at' => now()->subMinutes(10),
            ],
            [
                'event_type' => AuditLog::TYPE_DATA_UPDATE,
                'event_category' => AuditLog::CATEGORY_DATA_MANAGEMENT,
                'description' => 'Subject updated',
                'user_email' => 'pedrohub@smartattend.local',
                'user_name' => 'PedroHub Admin',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'status' => AuditLog::STATUS_SUCCESS,
                'severity' => AuditLog::SEVERITY_INFO,
                'metadata' => ['subject_name' => 'Programming 1', 'changes' => ['department', 'program']],
                'created_at' => now()->subMinutes(5),
            ],
            [
                'event_type' => AuditLog::TYPE_USER_LOGIN,
                'event_category' => AuditLog::CATEGORY_AUTHENTICATION,
                'description' => 'Login attempt failed',
                'user_email' => null,
                'user_name' => null,
                'ip_address' => '192.168.1.100',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'status' => AuditLog::STATUS_FAILED,
                'severity' => AuditLog::SEVERITY_WARNING,
                'metadata' => ['attempted_email' => 'hacker@example.com', 'reason' => 'Invalid credentials'],
                'created_at' => now()->subMinutes(3),
            ],
            [
                'event_type' => AuditLog::TYPE_SECURITY_ALERT,
                'event_category' => AuditLog::CATEGORY_SECURITY,
                'description' => 'Unauthorized access attempt detected',
                'user_email' => null,
                'user_name' => null,
                'ip_address' => '192.168.1.100',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'status' => AuditLog::STATUS_WARNING,
                'severity' => AuditLog::SEVERITY_WARNING,
                'metadata' => ['attempted_email' => 'hacker@example.com', 'blocked' => true],
                'created_at' => now()->subMinutes(2),
            ],
        ];

        foreach ($auditLogs as $log) {
            AuditLog::create($log);
        }
    }
}