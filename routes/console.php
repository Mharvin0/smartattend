<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
	$this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule weekly summaries via closure (backup to Kernel)
Schedule::call(function () {
	\App\Jobs\GenerateWeeklySummaries::dispatch();
})->weeklyOn(6, '22:00');
