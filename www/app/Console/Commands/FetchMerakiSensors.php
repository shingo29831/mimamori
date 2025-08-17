<?php

namespace App\Console\Commands;

use App\Models\SensorReading;
use App\Services\MerakiClient;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Arr;

class FetchMerakiSensors extends Command
{
    protected $signature = 'meraki:fetch-sensors {--dry-run : DBに保存せず出力だけ}';
    protected $description = 'Fetch latest temperature/humidity from Meraki sensors and store to DB';

    public function handle(MerakiClient $meraki): int
    {
        $orgId = $meraki->getOrganizationId();
        $networkId = $meraki->getNetworkId($orgId);

        $metrics = ['temperature', 'humidity'];
        $allRows = [];

        foreach ($metrics as $metric) {
            $payload = $meraki->latestBySensor($networkId, $metric);

            foreach ($payload as $row) {
                // いくつかの形に寛容に対応
                $sensor = Arr::get($row, 'sensorId')
                    ?? Arr::get($row, 'serial')
                    ?? Arr::get($row, 'deviceSerial')
                    ?? Arr::get($row, 'sensor.serial');

                // 値 & 時刻
                $val = Arr::get($row, 'value')
                    ?? Arr::get($row, "metrics.{$metric}.value");

                $ts  = Arr::get($row, 'ts')
                    ?? Arr::get($row, 'time')
                    ?? Arr::get($row, "metrics.{$metric}.ts")
                    ?? Arr::get($row, "metrics.{$metric}.time");

                if (!$sensor || $val === null || !$ts) {
                    // スキップ（API 仕様差異を考慮）
                    $this->warn("skip row (metric={$metric}) ".json_encode($row));
                    continue;
                }

                $allRows[] = [
                    'sensor_id'   => (string) $sensor,
                    'network_id'  => $networkId,
                    'metric'      => $metric,
                    'value'       => (float) $val,
                    'recorded_at' => CarbonImmutable::parse($ts), // UTC想定
                    'raw'         => $row,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ];
            }
        }

        if ($this->option('dry-run')) {
            $this->line('--- DRY RUN ---');
            $this->line(collect($allRows)->take(5)->toJson(JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
            $this->info('rows='.count($allRows));
            return self::SUCCESS;
        }

        // upsert（同一センサー・同一時刻は更新）
        if ($allRows) {
            SensorReading::upsert(
                $allRows,
                ['sensor_id', 'metric', 'recorded_at'],
                ['value', 'raw', 'network_id', 'updated_at']
            );
        }

        $this->info('stored rows='.count($allRows));
        return self::SUCCESS;
    }
}
