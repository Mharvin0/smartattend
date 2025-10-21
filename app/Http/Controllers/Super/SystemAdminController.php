<?php

namespace App\Http\Controllers\Super;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class SystemAdminController extends Controller
{
    public function index()
    {
        // Get all users with their roles
        $users = \App\Models\User::with('roles')->get();
        
        // Get system statistics
        $systemStats = [
            'activeSessions' => \App\Models\User::where('updated_at', '>', now()->subMinutes(30))->count(),
            'totalUsers' => \App\Models\User::count(),
            'databaseSize' => $this->getDatabaseSize(),
            'systemHealth' => $this->getSystemHealth(),
        ];

        // Get recent activity logs from database
        $activityLogs = $this->getRecentActivityLogs();

        // Get integration status (mock data for now)
        $integrations = [
            'email' => [
                'smtp_server' => 'Connected',
                'templates' => 'Active',
            ],
            'sms' => [
                'gateway' => 'Pending',
                'api_key' => 'Not Set',
            ],
            'calendar' => [
                'google_calendar' => 'Connected',
                'outlook' => 'Not Configured',
            ],
            'api' => [
                'rest_api' => 'Active',
                'webhooks' => '3 Active',
            ],
        ];

        return Inertia::render('Super/SystemAdmin', [
            'users' => $users,
            'systemStats' => $systemStats,
            'activityLogs' => $activityLogs,
            'integrations' => $integrations,
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
}
