<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Sensor;
use App\Models\SensorReading;
use App\Events\SensorMetricsUpdated;

class SensorReadingController extends Controller
{
    // 認証あり
    public function earliest(string $sensorId, string $metric): JsonResponse
    {
        return $this->doEarliest($sensorId, $metric);
    }

    // 一時的に認証なし
    public function earliestOpen(string $sensorId, string $metric): JsonResponse
    {
        return $this->doEarliest($sensorId, $metric);
    }

    private function doEarliest(string $sensorId, string $metric): JsonResponse
    {
        // metric をホワイトリスト化
        $metric = strtolower($metric);
        if (!in_array($metric, ['temperature', 'humidity', 'door', 'activity', 'emergency'])) {
            return response()->json(['ok' => false, 'message' => 'invalid metric'], 422);
        }

        $sensor = Sensor::where('sensor_id', $sensorId)->firstOrFail();

        // 最古1件（timestamp 昇順 → id 昇順でタイブレーク）
        $row = SensorReading::where('sensor_id', $sensorId)
            ->where('metric', $metric)
            ->orderBy('timestamp', 'asc')
            ->orderBy('id', 'asc')
            ->first();

        if (!$row) {
            return response()->json(['ok' => false, 'message' => 'no readings'], 404);
        }

        // value(JSON)の中身を抽出（casts が無い場合に備えて両対応）
        $val = $row->value;
        if (is_string($val)) {
            $decoded = json_decode($val, true);
            $val = is_array($decoded) ? $decoded : ['value' => null];
        }
        $numeric = $val['value'] ?? $val['avg'] ?? $val['celsius'] ?? $val['humidity'] ?? null;

        // 任意: WS で送信（既存の SensorMetricsUpdated を流用する例）
        broadcast(new SensorMetricsUpdated(
            homeId: (string)$sensor->home_id,
            temperature: $metric === 'temperature' ? ($numeric ?? 0.0) : null,
            humidity:    $metric === 'humidity'    ? ($numeric ?? 0.0) : null,
            timestamp:   $row->timestamp?->toIso8601String() ?? now()->toIso8601String(),
        ))->toOthers();

        return response()->json([
            'ok'        => true,
            'sensorId'  => $sensorId,
            'homeId'    => (string)$sensor->home_id,
            'metric'    => $metric,
            'value'     => $numeric,
            'raw'       => $val, // 参考: JSON 全体も返す
            'timestamp' => $row->timestamp?->toIso8601String(),
            'id'        => $row->id,
        ]);
    }
}
