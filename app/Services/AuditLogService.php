<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuditLogService
{
    /**
     * Log an audit event
     */
    public static function log(
        string $eventType,
        string $eventCategory,
        string $description,
        string $status = AuditLog::STATUS_SUCCESS,
        string $severity = AuditLog::SEVERITY_INFO,
        array $metadata = [],
        ?Request $request = null
    ): AuditLog {
        $user = Auth::user();
        $request = $request ?? request();

        return AuditLog::create([
            'event_type' => $eventType,
            'event_category' => $eventCategory,
            'description' => $description,
            'user_email' => $user?->email,
            'user_name' => $user?->name,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'metadata' => $metadata,
            'status' => $status,
            'severity' => $severity,
        ]);
    }

    /**
     * Log user authentication events
     */
    public static function logAuthentication(string $eventType, string $description, bool $success = true): AuditLog
    {
        return self::log(
            $eventType,
            AuditLog::CATEGORY_AUTHENTICATION,
            $description,
            $success ? AuditLog::STATUS_SUCCESS : AuditLog::STATUS_FAILED,
            $success ? AuditLog::SEVERITY_INFO : AuditLog::SEVERITY_WARNING
        );
    }

    /**
     * Log data management events
     */
    public static function logDataManagement(string $eventType, string $description, array $metadata = []): AuditLog
    {
        return self::log(
            $eventType,
            AuditLog::CATEGORY_DATA_MANAGEMENT,
            $description,
            AuditLog::STATUS_SUCCESS,
            AuditLog::SEVERITY_INFO,
            $metadata
        );
    }

    /**
     * Log system administration events
     */
    public static function logSystemAdmin(string $eventType, string $description, bool $success = true, array $metadata = []): AuditLog
    {
        return self::log(
            $eventType,
            AuditLog::CATEGORY_SYSTEM_ADMIN,
            $description,
            $success ? AuditLog::STATUS_SUCCESS : AuditLog::STATUS_FAILED,
            $success ? AuditLog::SEVERITY_INFO : AuditLog::SEVERITY_ERROR,
            $metadata
        );
    }

    /**
     * Log security events
     */
    public static function logSecurity(string $eventType, string $description, string $severity = AuditLog::SEVERITY_WARNING): AuditLog
    {
        return self::log(
            $eventType,
            AuditLog::CATEGORY_SECURITY,
            $description,
            AuditLog::STATUS_WARNING,
            $severity
        );
    }

    /**
     * Log user management events
     */
    public static function logUserManagement(string $eventType, string $description, array $metadata = []): AuditLog
    {
        return self::log(
            $eventType,
            AuditLog::CATEGORY_USER_MANAGEMENT,
            $description,
            AuditLog::STATUS_SUCCESS,
            AuditLog::SEVERITY_INFO,
            $metadata
        );
    }

    /**
     * Log attendance events
     */
    public static function logAttendance(string $eventType, string $description, array $metadata = []): AuditLog
    {
        return self::log(
            $eventType,
            AuditLog::CATEGORY_ATTENDANCE,
            $description,
            AuditLog::STATUS_SUCCESS,
            AuditLog::SEVERITY_INFO,
            $metadata
        );
    }

    /**
     * Log report events
     */
    public static function logReports(string $eventType, string $description, array $metadata = []): AuditLog
    {
        return self::log(
            $eventType,
            AuditLog::CATEGORY_REPORTS,
            $description,
            AuditLog::STATUS_SUCCESS,
            AuditLog::SEVERITY_INFO,
            $metadata
        );
    }
}
