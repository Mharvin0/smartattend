<?php

namespace App\Providers;

use App\Models\AttendanceRecord;
use App\Observers\AttendanceRecordObserver;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        AttendanceRecord::observe(AttendanceRecordObserver::class);

        // In production behind a proxy (Railway), enforce HTTPS URL generation.
        if (app()->environment('production')) {
            URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);
    }
}
