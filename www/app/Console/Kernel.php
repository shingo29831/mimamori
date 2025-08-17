<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('meraki:fetch-sensors')
            ->everyFiveMinutes()          // 例: 5分ごと
            ->withoutOverlapping(10)      // 10分でロック解放
            ->onOneServer()               // マルチサーバで1台だけ実行（要 shared cache）
            ->runInBackground()
            ->appendOutputTo(storage_path('logs/meraki_fetch.log'))
            ->timezone('Asia/Tokyo');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
