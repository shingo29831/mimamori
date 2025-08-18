<?php

namespace App\Http\Controllers\Admin;



use App\Models\Home;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Sensor;
use App\Models\SensorReading;
use App\Events\SensorMetricsUpdated;

class SensorReadingController extends Controller
{
    private string $TZ = 'Asia/Tokyo';

    private function jstNow(): Carbon
    {
        return now($this->TZ);
    }

    private function parseAsJst(?string $ts): ?Carbon
    {
        return $ts ? Carbon::parse($ts, $this->TZ) : null;
    }

    private function toIsoJst(?Carbon $c): ?string
    {
        return $c ? $c->copy()->setTimezone($this->TZ)->toIso8601String() : null;
    }

    private function parseNumeric($raw, array $keys = ['value','celsius','temperature','temp','t','relativePercentage'])
    {
        if (is_numeric($raw)) return floatval($raw);

        if (is_string($raw)) {
            $dec = json_decode($raw, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($dec)) {
                foreach ($keys as $k) {
                    if (isset($dec[$k]) && is_numeric($dec[$k])) {
                        return floatval($dec[$k]);
                    }
                }
            }
            if (is_numeric($raw)) return floatval($raw);
        }
        return null;
    }

    public function index()
    {
        try {
            // ===== 判定パラメータ（.env で上書き可） =====
            $FALL_RECENT_WINDOW_SEC = (int) env('FALL_RECENT_WINDOW_SEC', 600); // 直近10分
            $FALL_SUSTAIN_SEC       = (int) env('FALL_SUSTAIN_SEC', 10);       // 継続10秒以上
            $FALL_MIN_COUNT         = (int) env('FALL_MIN_COUNT', 2);          // 最低2件
            // ★ ドアは「イベント不在」の閾値（例：6時間）
            $DOOR_INACTIVITY_SEC    = (int) env('DOOR_INACTIVITY_SEC', 6 * 60 * 60);

            // 1) Homes
            $homes = DB::table('Homes')
                ->orderByDesc('created_at')
                ->get(['home_id','home_name','address']);

            if ($homes->isEmpty()) {
                return response()->json([]);
            }
            $homeIds = $homes->pluck('home_id')->all();

            // 2) 現在入居者
            $currentResidents = DB::table('Resident_Homes as rh')
                ->join('Residents as r','r.resident_id','=','rh.resident_id')
                ->whereIn('rh.home_id', $homeIds)
                ->where(function($q){
                    $q->whereNull('rh.assigned_to')
                    ->orWhere('rh.assigned_to','>', now());
                })
                ->orderBy('rh.assigned_from','desc')
                ->get(['rh.home_id','r.resident_name'])
                ->unique('home_id')
                ->keyBy('home_id');

            // 3) センサー一覧
            $sensorsByHome = DB::table('Sensors')
                ->whereIn('home_id', $homeIds)
                ->get(['sensor_id','home_id','sensor_type','status','last_seen'])
                ->groupBy('home_id');

            $nowJst = $this->jstNow();
            $recentSinceJst = $nowJst->copy()->subSeconds($FALL_RECENT_WINDOW_SEC);

            // 4) 各センサーの「最新」温度/湿度/ドアのみ取得（fall はここでは使わない）
            $latestPerSensorMetric = DB::table('Sensor_Readings as sr1')
                ->join(
                    DB::raw('(SELECT sensor_id, metric, MAX(`received_at`) AS ts
                            FROM Sensor_Readings
                            WHERE metric IN ("temperature","humidity","door")
                            GROUP BY sensor_id, metric) as last'),
                    function ($join) {
                        $join->on('sr1.sensor_id','=','last.sensor_id')
                            ->on('sr1.metric','=','last.metric')
                            ->on('sr1.received_at','=','last.ts');
                    }
                )
                ->get(['sr1.sensor_id','sr1.metric','sr1.value','sr1.received_at']);

            // sensor_id => metric => ['val'=>…, 'ts'=>…]
            $latestBySensor = [];
            foreach ($latestPerSensorMetric as $row) {
                $sid   = $row->sensor_id;
                $metric= $row->metric;
                $raw   = $row->value;
                $tsJst = $this->parseAsJst($row->received_at);

                $normVal = null;
                if ($metric === 'temperature') {
                    $normVal = $this->parseNumeric($raw, ['celsius','value','temperature','temp','t']);
                } elseif ($metric === 'humidity') {
                    $normVal = $this->parseNumeric($raw, ['relativePercentage','percentage','value','humidity','h']);
                } elseif ($metric === 'door') {
                    // open/closed/event/1/true などを正規化
                    $decoded = is_string($raw) ? json_decode($raw, true) : null;
                    if (is_array($decoded)) {
                        $state = strtolower((string)($decoded['state'] ?? $decoded['value'] ?? (($decoded['open'] ?? false) ? 'open' : 'closed')));
                        $normVal = in_array($state, ['open','opened','1','true','event'], true) ? 'open' : 'closed';
                    } else {
                        $v = strtolower(trim((string)$raw));
                        $normVal = in_array($v, ['open','opened','1','true','event'], true) ? 'open' : 'closed';
                    }
                }

                if (!isset($latestBySensor[$sid])) $latestBySensor[$sid] = [];
                $latestBySensor[$sid][$metric] = ['val' => $normVal, 'tsJst' => $tsJst];
            }

            // 5) 転倒：直近窓で 継続時間(最後-最初) >= FALL_SUSTAIN_SEC かつ 件数 >= FALL_MIN_COUNT
            $allSensorIds = $sensorsByHome->flatten(1)->pluck('sensor_id')->unique()->values()->all();

            $fallAgg = collect();
            if (!empty($allSensorIds)) {
                $fallAgg = DB::table('Sensor_Readings')
                    ->whereIn('sensor_id', $allSensorIds)
                    ->where('metric', 'fall')
                    ->where('received_at', '>=', $recentSinceJst->toDateTimeString())
                    ->selectRaw('sensor_id, MIN(`received_at`) as first_ts, MAX(`received_at`) as last_ts, COUNT(*) as cnt')
                    ->groupBy('sensor_id')
                    ->get()
                    ->map(function ($r) {
                        $r->first_ts = Carbon::parse($r->first_ts, 'Asia/Tokyo');
                        $r->last_ts  = Carbon::parse($r->last_ts,  'Asia/Tokyo');
                        return $r;
                    })
                    ->keyBy('sensor_id');
            }


            // 6) Home ごとの集計 の map 開始直後の変数群を整理
            $payload = $homes->map(function ($h) use (
                $currentResidents, $sensorsByHome, $latestBySensor, $fallAgg,
                $nowJst, $DOOR_INACTIVITY_SEC, $FALL_SUSTAIN_SEC, $FALL_MIN_COUNT
            ) {
                $sensorRows = $sensorsByHome->get($h->home_id) ?? collect();

                $tempVals = [];
                $humidVals = [];

                // ★ JSTで追う最終活動／最終ドアイベント
                $lastActivityJst  = null;
                $lastDoorEventJst = null;

                $doorStatus     = 'closed';
                $hasDoorSensor  = false;

                $fallDetected = false;
                $alerts = [];

                $sensorList = $sensorRows->map(function ($s) use (
                    $latestBySensor, $fallAgg,
                    &$tempVals, &$humidVals,
                    &$lastActivityJst, &$lastDoorEventJst, &$doorStatus, &$hasDoorSensor,
                    &$fallDetected, &$alerts,
                    $nowJst, $DOOR_INACTIVITY_SEC, $FALL_SUSTAIN_SEC, $FALL_MIN_COUNT
                ) {
                    $sid     = $s->sensor_id;
                    $metrics = $latestBySensor[$sid] ?? [];

                    // 温度
                    if (isset($metrics['temperature'])) {
                        $v = $metrics['temperature']['val'];
                        if (is_numeric($v)) $tempVals[] = (float)$v;
                        $tsJst = $metrics['temperature']['tsJst'] ?? null;
                        if ($tsJst && (!$lastActivityJst || $tsJst->gt($lastActivityJst))) $lastActivityJst = $tsJst;
                    }

                    // 湿度
                    if (isset($metrics['humidity'])) {
                        $v = $metrics['humidity']['val'];
                        if (is_numeric($v)) $humidVals[] = (float)$v;
                        $tsJst = $metrics['humidity']['tsJst'] ?? null;
                        if ($tsJst && (!$lastActivityJst || $tsJst->gt($lastActivityJst))) $lastActivityJst = $tsJst;
                    }

                    // ドア（最後のイベント値＋最終ドアイベント時刻）
                    if (isset($metrics['door'])) {
                        $val   = strtolower((string)$metrics['door']['val']);
                        $tsJst = $metrics['door']['tsJst'] ?? null;

                        if ($tsJst && (!$lastDoorEventJst || $tsJst->gt($lastDoorEventJst))) {
                            $lastDoorEventJst = $tsJst;
                            $doorStatus = in_array($val, ['open','opened','1','true','event'], true) ? 'open' : 'closed';
                        }
                        if ($tsJst && (!$lastActivityJst || $tsJst->gt($lastActivityJst))) $lastActivityJst = $tsJst;
                    }

                    // ドアセンサーの存在判定（例：型 MT20）
                    if (in_array($s->sensor_type, ['MT20'])) {
                        $hasDoorSensor = true;
                    }

                    // 転倒（最近の窓で継続時間＆件数確認）
                    if (!$fallDetected && $fallAgg->has($sid)) {
                        $rec   = $fallAgg->get($sid);
                        $first = Carbon::parse($rec->first_ts, 'Asia/Tokyo');
                        $last  = Carbon::parse($rec->last_ts,  'Asia/Tokyo');
                        $dur   = $last->diffInSeconds($first);

                        if ((int)$rec->cnt >= $FALL_MIN_COUNT && $dur >= $FALL_SUSTAIN_SEC) {
                            $fallDetected = true;
                            if (!$lastActivityJst || $last->gt($lastActivityJst)) $lastActivityJst = $last;

                            $alerts[] = [
                                'type'      => 'fall',
                                'message'   => "直近に継続的な転倒の可能性を検知（{$rec->cnt}件, 継続{$dur}秒）",
                                'timestamp' => $last->copy()->setTimezone('Asia/Tokyo')->toIso8601String(),
                                'severity'  => 'high',
                            ];
                        }
                    }

                    // last_seen も最終活動候補（JST解釈）
                    if ($s->last_seen) {
                        $seenJst = Carbon::parse($s->last_seen, 'Asia/Tokyo');
                        if (!$lastActivityJst || ($seenJst && $seenJst->gt($lastActivityJst))) $lastActivityJst = $seenJst;
                    }

                    return [
                        'sensorId' => $s->sensor_id,
                        'type'     => in_array($s->sensor_type, ['MT10','MT20','MT30','MV23']) ? $s->sensor_type : 'other',
                        'status'   => $s->status === 'active' ? 'active' : 'inactive',
                        'lastSeen' => $s->last_seen ? (string)$s->last_seen : '',
                    ];
                })->values();

                // ドアのイベント不在警告（JST同士で差分）
                $doorInactiveSec = null;
                if ($hasDoorSensor || $lastDoorEventJst) {
                    if ($lastDoorEventJst) {
                        $doorInactiveSec = $nowJst->diffInSeconds($lastDoorEventJst);
                        if ($doorInactiveSec >= $DOOR_INACTIVITY_SEC) {
                            $hours = (int) ceil($doorInactiveSec / 3600);
                            $alerts[] = [
                                'type'      => 'door',
                                'message'   => "ドアの開閉イベントが{$hours}時間以上発生していません",
                                'timestamp' => $lastDoorEventJst->copy()->setTimezone('Asia/Tokyo')->toIso8601String(),
                                'severity'  => 'medium',
                            ];
                        }
                    } else {
                        $alerts[] = [
                            'type'      => 'door',
                            'message'   => 'ドアの開閉イベントが記録されていません',
                            'timestamp' => null,
                            'severity'  => 'low',
                        ];
                    }
                }

                $avgTemp  = count($tempVals)  ? array_sum($tempVals)  / count($tempVals)  : null;
                $avgHumid = count($humidVals) ? array_sum($humidVals) / count($humidVals) : null;

                return [
                    'homeId'          => $h->home_id,
                    'homeName'        => $h->home_name,
                    'residentName'    => optional($currentResidents->get($h->home_id))->resident_name ?? '',
                    'address'         => $h->address ?? '',
                    'temperature'     => is_null($avgTemp)  ? 0.0 : round($avgTemp, 1),
                    'humidity'        => is_null($avgHumid) ? 0   : (int) round($avgHumid),
                    'doorStatus'      => $doorStatus,
                    'lastDoorEventAt' => $lastDoorEventJst ? $lastDoorEventJst->copy()->setTimezone('Asia/Tokyo')->toIso8601String() : null,
                    'doorInactiveSec' => $doorInactiveSec,
                    'lastActivity'    => $lastActivityJst ? $lastActivityJst->copy()->setTimezone('Asia/Tokyo')->toIso8601String() : '—',
                    'fallDetected'    => $fallDetected,
                    'alerts'          => $alerts,
                    'sensors'         => $sensorList,
                ];
            });

            return response()->json($payload);

        } catch (\Throwable $e) {
            \Log::error('GET /api/admin/homes failed', [
                'msg'=>$e->getMessage(), 'file'=>$e->getFile(), 'line'=>$e->getLine(),
            ]);
            return response()->json(['ok'=>false,'error'=>$e->getMessage()], 500);
        }
    }
}
