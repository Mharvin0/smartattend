<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_type',
        'event_category',
        'description',
        'user_email',
        'user_name',
        'ip_address',
        'user_agent',
        'metadata',
        'status',
        'severity',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Event categories
    const CATEGORY_AUTHENTICATION = 'authentication';
    const CATEGORY_DATA_MANAGEMENT = 'data_management';
    const CATEGORY_SYSTEM_ADMIN = 'system_admin';
    const CATEGORY_SECURITY = 'security';
    const CATEGORY_USER_MANAGEMENT = 'user_management';
    const CATEGORY_ATTENDANCE = 'attendance';
    const CATEGORY_REPORTS = 'reports';

    // Event types
    const TYPE_USER_LOGIN = 'user_login';
    const TYPE_USER_LOGOUT = 'user_logout';
    const TYPE_PASSWORD_CHANGE = 'password_change';
    const TYPE_DATA_CREATE = 'data_create';
    const TYPE_DATA_UPDATE = 'data_update';
    const TYPE_DATA_DELETE = 'data_delete';
    const TYPE_SYSTEM_BACKUP = 'system_backup';
    const TYPE_SYSTEM_MAINTENANCE = 'system_maintenance';
    const TYPE_SYSTEM_OPTIMIZATION = 'system_optimization';
    const TYPE_CACHE_CLEAR = 'cache_clear';
    const TYPE_SECURITY_ALERT = 'security_alert';
    const TYPE_UNAUTHORIZED_ACCESS = 'unauthorized_access';

    // Status values
    const STATUS_SUCCESS = 'success';
    const STATUS_FAILED = 'failed';
    const STATUS_WARNING = 'warning';

    // Severity levels
    const SEVERITY_INFO = 'info';
    const SEVERITY_WARNING = 'warning';
    const SEVERITY_ERROR = 'error';
    const SEVERITY_CRITICAL = 'critical';

    /**
     * Get the user who performed the action
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_email', 'email');
    }

    /**
     * Scope for filtering by category
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('event_category', $category);
    }

    /**
     * Scope for filtering by event type
     */
    public function scopeByEventType($query, $eventType)
    {
        return $query->where('event_type', $eventType);
    }

    /**
     * Scope for filtering by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for filtering by severity
     */
    public function scopeBySeverity($query, $severity)
    {
        return $query->where('severity', $severity);
    }

    /**
     * Scope for recent logs
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Get formatted timestamp
     */
    public function getFormattedTimestampAttribute()
    {
        return $this->created_at->format('M d, Y H:i:s');
    }

    /**
     * Get status badge color
     */
    public function getStatusColorAttribute()
    {
        return match($this->status) {
            self::STATUS_SUCCESS => 'text-green-600',
            self::STATUS_FAILED => 'text-red-600',
            self::STATUS_WARNING => 'text-yellow-600',
            default => 'text-gray-600',
        };
    }

    /**
     * Get severity badge color
     */
    public function getSeverityColorAttribute()
    {
        return match($this->severity) {
            self::SEVERITY_INFO => 'text-blue-600',
            self::SEVERITY_WARNING => 'text-yellow-600',
            self::SEVERITY_ERROR => 'text-red-600',
            self::SEVERITY_CRITICAL => 'text-red-800',
            default => 'text-gray-600',
        };
    }

    /**
     * Get category badge color
     */
    public function getCategoryColorAttribute()
    {
        return match($this->event_category) {
            self::CATEGORY_AUTHENTICATION => 'text-purple-600',
            self::CATEGORY_DATA_MANAGEMENT => 'text-blue-600',
            self::CATEGORY_SYSTEM_ADMIN => 'text-orange-600',
            self::CATEGORY_SECURITY => 'text-red-600',
            self::CATEGORY_USER_MANAGEMENT => 'text-green-600',
            self::CATEGORY_ATTENDANCE => 'text-indigo-600',
            self::CATEGORY_REPORTS => 'text-pink-600',
            default => 'text-gray-600',
        };
    }
}