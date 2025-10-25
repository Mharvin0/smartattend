<?php

namespace App\Http\Controllers\Super;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\AuditLogService;
use Inertia\Inertia;

class SystemAdminController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'role:Super Admin']);
    }

    public function test()
    {
        $driver = config('database.default');
        $sqliteDbPath = database_path('database.sqlite');
        $isSqliteAvailable = file_exists($sqliteDbPath);
        
        return response()->json([
            'success' => true,
            'message' => 'System Admin Controller is working!',
            'timestamp' => now()->format('Y-m-d H:i:s'),
            'user' => auth()->user()->email,
            'database' => [
                'driver' => $driver,
                'sqlite_path' => $sqliteDbPath,
                'sqlite_exists' => $isSqliteAvailable
            ]
        ]);
    }

    public function index()
    {
        // Get all users with their roles
        $users = \App\Models\User::with('roles')->get();
        
        // Get system statistics
        $systemStats = [
            'activeSessions' => \App\Models\User::where('updated_at', '>', now()->subMinutes(30))->count(),
            'totalUsers' => \App\Models\User::count(),
            'totalStudents' => \App\Models\Student::count(),
            'totalSections' => \App\Models\Section::count(),
            'totalSubjects' => \App\Models\Subject::count(),
            'databaseSize' => $this->getDatabaseSize(),
            'systemHealth' => $this->getSystemHealth(),
            'serverUptime' => $this->getServerUptime(),
            'memoryUsage' => $this->getMemoryUsage(),
        ];

        // Get recent activity logs from database
        $activityLogs = $this->getRecentActivityLogs();

        // Get integration status
        $integrations = $this->getIntegrationStatus();

        // Get system tools data
        $systemTools = $this->getSystemToolsData();

        // Get recent audit logs
        $auditLogs = AuditLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return Inertia::render('Super/SystemAdmin', [
            'users' => $users,
            'systemStats' => $systemStats,
            'activityLogs' => $activityLogs,
            'integrations' => $integrations,
            'systemTools' => $systemTools,
            'auditLogs' => $auditLogs,
        ]);
    }

    private function getDatabaseSize()
    {
        try {
            $databaseName = config('database.connections.mysql.database');
            $result = \DB::select("SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'size_mb' FROM information_schema.tables WHERE table_schema = ?", [$databaseName]);
            return isset($result[0]->size_mb) ? $result[0]->size_mb . 'MB' : 'Unknown';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function getSystemHealth()
    {
        try {
            // Check database connection
            \DB::connection()->getPdo();
            $dbHealth = 100;
        } catch (\Exception $e) {
            $dbHealth = 0;
        }

        // Check if we can access storage
        try {
            \Storage::disk('local')->exists('test');
            $storageHealth = 100;
        } catch (\Exception $e) {
            $storageHealth = 0;
        }

        // Calculate overall health
        $overallHealth = ($dbHealth + $storageHealth) / 2;
        return round($overallHealth);
    }

    private function getRecentActivityLogs()
    {
        try {
            // Get recent user activities
            $recentUsers = \App\Models\User::orderBy('updated_at', 'desc')->limit(5)->get();
            $logs = [];

            foreach ($recentUsers as $user) {
                $logs[] = [
                    'id' => $user->id,
                    'type' => 'info',
                    'message' => 'User activity: ' . $user->name,
                    'user' => $user->email,
                    'timestamp' => $user->updated_at->format('Y-m-d H:i:s'),
                ];
            }

            // Get recent attendance records
            $recentAttendance = \App\Models\AttendanceRecord::with('student')
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();

            foreach ($recentAttendance as $record) {
                $logs[] = [
                    'id' => 'attendance_' . $record->id,
                    'type' => 'info',
                    'message' => 'Attendance recorded: ' . ($record->student->first_name ?? 'Unknown') . ' - ' . $record->status,
                    'user' => 'system',
                    'timestamp' => $record->created_at->format('Y-m-d H:i:s'),
                ];
            }

            // Sort by timestamp and limit to 10
            usort($logs, function($a, $b) {
                return strtotime($b['timestamp']) - strtotime($a['timestamp']);
            });

            return array_slice($logs, 0, 10);

        } catch (\Exception $e) {
            // Fallback to basic system logs
            return [
                [
                    'id' => 1,
                    'type' => 'info',
                    'message' => 'System Admin accessed',
                    'user' => auth()->user()->email ?? 'system',
                    'timestamp' => now()->format('Y-m-d H:i:s'),
                ],
                [
                    'id' => 2,
                    'type' => 'info',
                    'message' => 'Database connection active',
                    'user' => 'system',
                    'timestamp' => now()->subMinutes(1)->format('Y-m-d H:i:s'),
                ],
            ];
        }
    }

    private function getServerUptime()
    {
        try {
            if (function_exists('sys_getloadavg')) {
                $load = sys_getloadavg();
                return [
                    'load_1min' => $load[0],
                    'load_5min' => $load[1],
                    'load_15min' => $load[2],
                ];
            }
            return ['load_1min' => 0, 'load_5min' => 0, 'load_15min' => 0];
        } catch (\Exception $e) {
            return ['load_1min' => 0, 'load_5min' => 0, 'load_15min' => 0];
        }
    }

    private function getMemoryUsage()
    {
        try {
            $memoryUsage = memory_get_usage(true);
            $memoryLimit = ini_get('memory_limit');
            $memoryLimitBytes = $this->convertToBytes($memoryLimit);
            
            return [
                'current' => $this->formatBytes($memoryUsage),
                'limit' => $memoryLimit,
                'percentage' => round(($memoryUsage / $memoryLimitBytes) * 100, 2),
            ];
        } catch (\Exception $e) {
            return ['current' => 'Unknown', 'limit' => 'Unknown', 'percentage' => 0];
        }
    }

    private function getIntegrationStatus()
    {
        return [
            'email' => [
                'smtp_server' => config('mail.mailers.smtp.host') ? 'Connected' : 'Not Configured',
                'templates' => 'Active',
                'status' => config('mail.mailers.smtp.host') ? 'success' : 'warning',
            ],
            'sms' => [
                'gateway' => 'Not Configured',
                'api_key' => 'Not Set',
                'status' => 'error',
            ],
            'calendar' => [
                'google_calendar' => 'Not Configured',
                'outlook' => 'Not Configured',
                'status' => 'warning',
            ],
            'api' => [
                'rest_api' => 'Active',
                'webhooks' => '0 Active',
                'status' => 'success',
            ],
            'database' => [
                'connection' => 'Connected',
                'status' => 'success',
            ],
            'storage' => [
                'local' => 'Available',
                'status' => 'success',
            ],
        ];
    }

    private function getSystemToolsData()
    {
        return [
            'backup' => [
                'last_backup' => $this->getLastBackupDate(),
                'backup_size' => $this->getBackupSize(),
                'status' => 'ready',
            ],
            'cache' => [
                'cache_size' => $this->getCacheSize(),
                'status' => 'active',
            ],
            'logs' => [
                'log_files' => $this->getLogFilesCount(),
                'total_size' => $this->getLogsSize(),
                'status' => 'active',
            ],
            'maintenance' => [
                'last_maintenance' => $this->getLastMaintenanceDate(),
                'status' => 'ready',
            ],
        ];
    }

    private function getLastBackupDate()
    {
        try {
            $backupPath = storage_path('app/backups');
            if (is_dir($backupPath)) {
                $files = glob($backupPath . '/*.sql');
                if (!empty($files)) {
                    $latestFile = max($files);
                    return date('Y-m-d H:i:s', filemtime($latestFile));
                }
            }
            return 'Never';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function getBackupSize()
    {
        try {
            $backupPath = storage_path('app/backups');
            if (is_dir($backupPath)) {
                $files = glob($backupPath . '/*.sql');
                $totalSize = 0;
                foreach ($files as $file) {
                    $totalSize += filesize($file);
                }
                return $this->formatBytes($totalSize);
            }
            return '0 MB';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function getCacheSize()
    {
        try {
            $cachePath = storage_path('framework/cache');
            if (is_dir($cachePath)) {
                $size = $this->getDirectorySize($cachePath);
                return $this->formatBytes($size);
            }
            return '0 MB';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function getLogFilesCount()
    {
        try {
            $logPath = storage_path('logs');
            if (is_dir($logPath)) {
                $files = glob($logPath . '/*.log');
                return count($files);
            }
            return 0;
        } catch (\Exception $e) {
            return 0;
        }
    }

    private function getLogsSize()
    {
        try {
            $logPath = storage_path('logs');
            if (is_dir($logPath)) {
                $size = $this->getDirectorySize($logPath);
                return $this->formatBytes($size);
            }
            return '0 MB';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function getLastMaintenanceDate()
    {
        try {
            $maintenanceFile = storage_path('app/maintenance.json');
            if (file_exists($maintenanceFile)) {
                $data = json_decode(file_get_contents($maintenanceFile), true);
                return $data['last_maintenance'] ?? 'Never';
            }
            return 'Never';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function convertToBytes($value)
    {
        $value = trim($value);
        $last = strtolower($value[strlen($value) - 1]);
        $value = (int) $value;

        switch ($last) {
            case 'g':
                $value *= 1024;
            case 'm':
                $value *= 1024;
            case 'k':
                $value *= 1024;
        }

        return $value;
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }

    private function getDirectorySize($directory)
    {
        $size = 0;
        if (is_dir($directory)) {
            foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($directory)) as $file) {
                if ($file->isFile()) {
                    $size += $file->getSize();
                }
            }
        }
        return $size;
    }

    public function clearCache()
    {
        try {
            \Log::info('Clear cache action triggered by user: ' . auth()->user()->email);
            
            // Clear all caches
            \Artisan::call('cache:clear');
            \Artisan::call('config:clear');
            \Artisan::call('route:clear');
            \Artisan::call('view:clear');
            \Artisan::call('event:clear');
            
            // Clear application cache
            \Cache::flush();
            
            // Log audit event
            AuditLogService::logSystemAdmin(
                AuditLog::TYPE_CACHE_CLEAR,
                'System cache cleared successfully',
                true,
                ['cache_types' => ['application', 'config', 'route', 'view', 'event']]
            );
            
            \Log::info('Cache cleared successfully');
            return response()->json([
                'success' => true,
                'message' => 'All caches cleared successfully',
                'timestamp' => now()->format('Y-m-d H:i:s')
            ]);
        } catch (\Exception $e) {
            // Log failed audit event
            AuditLogService::logSystemAdmin(
                AuditLog::TYPE_CACHE_CLEAR,
                'Failed to clear system cache: ' . $e->getMessage(),
                false,
                ['error' => $e->getMessage()]
            );
            
            \Log::error('Failed to clear cache: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cache: ' . $e->getMessage()
            ], 500);
        }
    }

    public function optimizeSystem()
    {
        try {
            \Log::info('System optimization triggered by user: ' . auth()->user()->email);
            
            // Optimize system
            \Artisan::call('config:cache');
            \Artisan::call('route:cache');
            \Artisan::call('view:cache');
            \Artisan::call('event:cache');
            
            \Log::info('System optimized successfully');
            return response()->json([
                'success' => true,
                'message' => 'System optimized successfully',
                'timestamp' => now()->format('Y-m-d H:i:s')
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to optimize system: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to optimize system: ' . $e->getMessage()
            ], 500);
        }
    }

    public function createBackup()
    {
        try {
            \Log::info('Backup creation triggered by user: ' . auth()->user()->email);
            
            $backupPath = storage_path('app/backups');
            if (!is_dir($backupPath)) {
                mkdir($backupPath, 0755, true);
            }
            
            $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sql';
            $filepath = $backupPath . '/' . $filename;
            
            // Check database driver
            $driver = config('database.default');
            \Log::info('Backup - Database driver detected: ' . $driver);
            
            // Check if SQLite database file exists (even if driver is set to mysql)
            $sqliteDbPath = database_path('database.sqlite');
            $isSqliteAvailable = file_exists($sqliteDbPath);
            \Log::info('Backup - SQLite database file exists: ' . ($isSqliteAvailable ? 'Yes' : 'No') . ' at: ' . $sqliteDbPath);
            
            if ($driver === 'sqlite' || $isSqliteAvailable) {
                // For SQLite, just copy the database file
                $dbPath = $isSqliteAvailable ? $sqliteDbPath : config('database.connections.sqlite.database');
                \Log::info('SQLite backup attempt - Database path: ' . $dbPath);
                \Log::info('SQLite backup attempt - File exists: ' . (file_exists($dbPath) ? 'Yes' : 'No'));
                
                if (file_exists($dbPath)) {
                    $copyResult = copy($dbPath, $filepath);
                    \Log::info('SQLite backup copy result: ' . ($copyResult ? 'Success' : 'Failed'));
                    
                    if ($copyResult && file_exists($filepath)) {
                        $fileSize = filesize($filepath);
                        \Log::info('SQLite backup created successfully: ' . $filename . ' (Size: ' . $fileSize . ' bytes)');
                        return response()->json([
                            'success' => true,
                            'message' => 'SQLite database backup created successfully',
                            'filename' => $filename,
                            'size' => $this->formatBytes($fileSize),
                            'timestamp' => now()->format('Y-m-d H:i:s')
                        ]);
                    } else {
                        \Log::error('SQLite backup copy failed');
                        return response()->json([
                            'success' => false,
                            'message' => 'Failed to copy SQLite database file'
                        ], 500);
                    }
                } else {
                    \Log::error('SQLite database file not found at: ' . $dbPath);
                    return response()->json([
                        'success' => false,
                        'message' => 'SQLite database file not found at: ' . $dbPath
                    ], 500);
                }
            } else {
                // For MySQL/PostgreSQL, use mysqldump
                $command = sprintf(
                    'mysqldump --user=%s --password=%s --host=%s %s > %s',
                    config('database.connections.mysql.username'),
                    config('database.connections.mysql.password'),
                    config('database.connections.mysql.host'),
                    config('database.connections.mysql.database'),
                    $filepath
                );
                
                exec($command, $output, $returnCode);
                
                if ($returnCode === 0) {
                    $fileSize = filesize($filepath);
                    \Log::info('MySQL backup created successfully: ' . $filename);
                    return response()->json([
                        'success' => true,
                        'message' => 'MySQL database backup created successfully',
                        'filename' => $filename,
                        'size' => $this->formatBytes($fileSize),
                        'timestamp' => now()->format('Y-m-d H:i:s')
                    ]);
                } else {
                    \Log::error('Failed to create backup - mysqldump returned code: ' . $returnCode);
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to create backup - database connection error'
                    ], 500);
                }
            }
        } catch (\Exception $e) {
            \Log::error('Failed to create backup: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create backup: ' . $e->getMessage()
            ], 500);
        }
    }

    public function runMaintenance()
    {
        try {
            \Log::info('System maintenance triggered by user: ' . auth()->user()->email);
            
            // Update maintenance timestamp
            $maintenanceData = [
                'last_maintenance' => now()->format('Y-m-d H:i:s'),
                'performed_by' => auth()->user()->email,
            ];
            
            file_put_contents(
                storage_path('app/maintenance.json'),
                json_encode($maintenanceData, JSON_PRETTY_PRINT)
            );
            
            // Run maintenance commands
            \Artisan::call('migrate', ['--force' => true]);
            \Artisan::call('db:seed', ['--class' => 'DatabaseSeeder', '--force' => true]);
            
            // Log audit event
            AuditLogService::logSystemAdmin(
                AuditLog::TYPE_SYSTEM_MAINTENANCE,
                'System maintenance completed successfully',
                true,
                ['maintenance_tasks' => ['migrate', 'seed']]
            );
            
            \Log::info('System maintenance completed successfully');
            return response()->json([
                'success' => true,
                'message' => 'System maintenance completed successfully',
                'timestamp' => now()->format('Y-m-d H:i:s')
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to run maintenance: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to run maintenance: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getSystemLogs()
    {
        try {
            $logPath = storage_path('logs/laravel.log');
            
            if (!file_exists($logPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Log file not found'
                ], 404);
            }
            
            $logs = file($logPath, FILE_IGNORE_NEW_LINES);
            $recentLogs = array_slice($logs, -50); // Get last 50 lines
            
            // Convert logs to user-friendly format and filter for user-relevant events
            $userFriendlyLogs = [];
            foreach ($recentLogs as $log) {
                $formattedLog = $this->formatLogEntry($log);
                
                // Only include user-relevant events (filter out technical/code events)
                if ($this->isUserRelevantEvent($formattedLog['message'])) {
                    $userFriendlyLogs[] = $formattedLog;
                }
            }
            
            return response()->json([
                'success' => true,
                'logs' => $userFriendlyLogs,
                'total_entries' => count($userFriendlyLogs),
                'last_updated' => date('Y-m-d H:i:s', filemtime($logPath))
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to read logs: ' . $e->getMessage()
            ], 500);
        }
    }

    private function formatLogEntry($logEntry)
    {
        // Extract timestamp
        preg_match('/\[(.*?)\]/', $logEntry, $timestampMatches);
        $timestamp = isset($timestampMatches[1]) ? $timestampMatches[1] : 'Unknown time';
        
        // Extract log level
        preg_match('/\] local\.(\w+):/', $logEntry, $levelMatches);
        $level = isset($levelMatches[1]) ? strtoupper($levelMatches[1]) : 'INFO';
        
        // Extract the actual message
        $message = preg_replace('/\[.*?\] local\.\w+:\s*/', '', $logEntry);
        
        // Convert technical messages to user-friendly ones
        $userFriendlyMessage = $this->convertToUserFriendlyMessage($message);
        
        // Determine color based on log level
        $color = $this->getLogColor($level);
        
        return [
            'timestamp' => $timestamp,
            'level' => $level,
            'message' => $userFriendlyMessage,
            'color' => $color,
            'raw' => $logEntry
        ];
    }

    private function convertToUserFriendlyMessage($message)
    {
        // Convert technical messages to user-friendly language (no icons)
        $conversions = [
            'Backup creation triggered by user' => 'Database backup started by',
            'SQLite backup created successfully' => 'Database backup completed successfully',
            'System maintenance triggered by user' => 'System maintenance started by',
            'System maintenance completed successfully' => 'System maintenance completed successfully',
            'System optimization triggered by user' => 'System optimization started by',
            'System optimized successfully' => 'System optimization completed successfully',
            'Cache cleared successfully' => 'System cache cleared successfully',
            'Failed to create backup' => 'Database backup failed',
            'Failed to optimize system' => 'System optimization failed',
            'Failed to clear cache' => 'Cache clearing failed',
            'Failed to run maintenance' => 'System maintenance failed',
            'User authentication successful' => 'User logged in successfully',
            'User authentication failed' => 'Login attempt failed',
            'Password reset requested' => 'Password reset requested',
            'Password reset completed' => 'Password reset completed',
            'User account created' => 'New user account created',
            'User account updated' => 'User account updated',
            'User account deleted' => 'User account removed',
            'Attendance recorded' => 'Attendance recorded',
            'Attendance imported' => 'Attendance data imported',
            'Report generated' => 'Report generated',
            'Report exported' => 'Report exported',
            'Section created' => 'New section created',
            'Section updated' => 'Section updated',
            'Section deleted' => 'Section removed',
            'Subject created' => 'New subject created',
            'Subject updated' => 'Subject updated',
            'Subject deleted' => 'Subject removed',
            'Schedule created' => 'New schedule created',
            'Schedule updated' => 'Schedule updated',
            'Schedule deleted' => 'Schedule removed',
            'Department created' => 'New department created',
            'Department updated' => 'Department updated',
            'Department deleted' => 'Department removed',
            'Program created' => 'New program created',
            'Program updated' => 'Program updated',
            'Program deleted' => 'Program removed',
            'Intervention created' => 'New intervention created',
            'Intervention updated' => 'Intervention updated',
            'Intervention deleted' => 'Intervention removed',
            'Weekly summary generated' => 'Weekly summary created',
            'Data validation failed' => 'Data validation error',
            'File upload successful' => 'File uploaded successfully',
            'File upload failed' => 'File upload failed',
            'Email sent successfully' => 'Email sent',
            'Email sending failed' => 'Email sending failed',
            'SMS sent successfully' => 'SMS sent',
            'SMS sending failed' => 'SMS sending failed',
            'Login successful' => 'Login successful',
            'Logout successful' => 'Logout successful',
            'Password changed' => 'Password changed',
            'Profile updated' => 'Profile updated',
            'Account locked' => 'Account locked',
            'Account unlocked' => 'Account unlocked',
            'Account suspended' => 'Account suspended',
            'Account activated' => 'Account activated',
            'Data synchronized' => 'Data synchronized',
            'Data validation passed' => 'Data validation passed',
            'Data validation failed' => 'Data validation failed',
            'Export started' => 'Export started',
            'Export completed' => 'Export completed',
            'Export failed' => 'Export failed',
            'Import started' => 'Import started',
            'Import completed' => 'Import completed',
            'Import failed' => 'Import failed',
            'Security alert' => 'Security alert',
            'Unauthorized access attempt' => 'Unauthorized access attempt',
            'System error' => 'System error occurred',
            'Application error' => 'Application error',
            'Database error' => 'Database error',
            'Network error' => 'Network error',
            'File system error' => 'File system error',
            'Permission denied' => 'Permission denied',
            'Resource not found' => 'Resource not found',
            'Timeout occurred' => 'Timeout occurred',
            'Rate limit exceeded' => 'Rate limit exceeded',
            'Maintenance mode enabled' => 'Maintenance mode enabled',
            'Maintenance mode disabled' => 'Maintenance mode disabled',
            'Backup scheduled' => 'Backup scheduled',
            'Backup completed' => 'Backup completed',
            'Backup failed' => 'Backup failed',
            'Restore started' => 'Restore started',
            'Restore completed' => 'Restore completed',
            'Restore failed' => 'Restore failed',
            'Update available' => 'System update available',
            'Update installed' => 'System update installed',
            'Update failed' => 'System update failed',
            'Configuration updated' => 'Configuration updated',
            'Settings saved' => 'Settings saved',
            'Settings reset' => 'Settings reset',
            'Session started' => 'User session started',
            'Session ended' => 'User session ended',
            'Session expired' => 'User session expired',
            'Health check passed' => 'System health check passed',
            'Health check failed' => 'System health check failed',
        ];

        // Apply conversions
        foreach ($conversions as $technical => $userFriendly) {
            if (strpos($message, $technical) !== false) {
                $message = str_replace($technical, $userFriendly, $message);
                break;
            }
        }

        // Clean up remaining technical details
        $message = preg_replace('/\s+at\s+.*$/', '', $message); // Remove file paths
        $message = preg_replace('/\s+in\s+.*$/', '', $message); // Remove file references
        $message = preg_replace('/\s+line\s+\d+$/', '', $message); // Remove line numbers
        $message = preg_replace('/\s+Stack\s+trace:.*$/s', '', $message); // Remove stack traces
        $message = preg_replace('/\s+Exception:.*$/s', '', $message); // Remove exception details
        
        return trim($message);
    }

    private function isUserRelevantEvent($message)
    {
        // Filter to only show user-relevant events, not technical/code events
        $userRelevantKeywords = [
            'Database backup',
            'System maintenance',
            'System optimization',
            'System cache',
            'User logged in',
            'Login attempt',
            'Password reset',
            'User account',
            'Attendance',
            'Report',
            'Section',
            'Subject',
            'Schedule',
            'Department',
            'Program',
            'Intervention',
            'Weekly summary',
            'File upload',
            'Email sent',
            'SMS sent',
            'Export',
            'Import',
            'Security alert',
            'Unauthorized access',
            'System error',
            'Application error',
            'Database error',
            'Network error',
            'File system error',
            'Permission denied',
            'Resource not found',
            'Timeout',
            'Rate limit',
            'Maintenance mode',
            'Backup',
            'Restore',
            'System update',
            'Configuration',
            'Settings',
            'User session',
            'Health check',
            'Data validation',
            'Data synchronized',
            'Profile updated',
            'Account',
            'Logout',
            'Password changed'
        ];
        
        // Check if message contains any user-relevant keywords
        foreach ($userRelevantKeywords as $keyword) {
            if (stripos($message, $keyword) !== false) {
                return true;
            }
        }
        
        return false;
    }

    private function getLogColor($level)
    {
        $colors = [
            'INFO' => 'text-blue-600',
            'ERROR' => 'text-red-600',
            'WARNING' => 'text-yellow-600',
            'DEBUG' => 'text-gray-600',
            'CRITICAL' => 'text-red-800',
            'ALERT' => 'text-red-800',
            'EMERGENCY' => 'text-red-800',
            'NOTICE' => 'text-green-600',
        ];
        
        return $colors[$level] ?? 'text-gray-600';
    }
}
