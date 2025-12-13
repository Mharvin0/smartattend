<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\StudentTracking;
use Carbon\Carbon;

class PermanentlyDeleteOldTrackingRecords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tracking:permanently-delete-old';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently delete tracking records that were soft-deleted more than 30 days ago';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cutoffDate = Carbon::now()->subDays(30);
        
        $deletedRecords = StudentTracking::withTrashed()
            ->whereNotNull('deleted_at')
            ->where('deleted_at', '<=', $cutoffDate)
            ->get();

        $count = $deletedRecords->count();

        if ($count > 0) {
            foreach ($deletedRecords as $record) {
                $record->forceDelete(); // Permanently delete
            }
            $this->info("Permanently deleted {$count} tracking record(s) that were soft-deleted more than 30 days ago.");
        } else {
            $this->info('No tracking records to permanently delete.');
        }

        return Command::SUCCESS;
    }
}
