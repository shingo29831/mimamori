<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sensor;
use App\Models\Home;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SensorController extends Controller
{
    /** フロント → DB enum 変換 */
    private function mapSensorType(string $uiType): string
    {
        $map = [
            'motion'      => 'MV23', // 人感
            'door'        => 'MT20', // ドア
            'temperature' => 'MT10', // 温度
            'button'    => 'MT30', // 湿度も同筐体とみなす例
        ];
        return $map[strtolower($uiType)] ?? 'other';
    }

    public function index()
    {
        $sensors = Sensor::query()
            ->leftJoin('homes','homes.home_id','=','sensors.home_id')
            ->orderBy('sensors.created_at','desc')
            ->get([
                'sensors.sensor_id',
                'sensors.sensor_name',
                'sensors.sensor_type',
                'sensors.home_id',
                'homes.home_name',
                'sensors.status',
                'sensors.last_seen',
                DB::raw("JSON_UNQUOTE(JSON_EXTRACT(sensors.calibration_meta, '$.room_name')) as room_name"),
                'sensors.updated_at',
                'sensors.created_at',
            ])
            ->map(function ($r) {
                // UI が期待するキー名に合わせる（lastActive など）
                return [
                    'sensor_id'   => $r->sensor_id,
                    'sensor_name' => $r->sensor_name,
                    'sensor_type' => $r->sensor_type,
                    'home_id'     => $r->home_id,
                    'home_name'   => $r->home_name,
                    'room_name'   => $r->room_name,
                    'status'      => $r->status,
                    'last_active' => $r->last_seen ?? $r->updated_at,
                    'created_at'  => $r->created_at,
                ];
            });

        return response()->json(['sensors'=>$sensors]);
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'sensorName' => ['required','string','max:255'],
            'sensorType' => ['required','string','max:50'],
            'homeId'     => ['required','string','max:64','exists:homes,home_id'],
            'roomName'   => ['nullable','string','max:255'],
        ], [], [
            'sensorName'=>'センサー名','sensorType'=>'センサー種別','homeId'=>'配置先','roomName'=>'部屋名'
        ]);

        $sensor = new Sensor();
        $sensor->sensor_id   = (string) Str::uuid();
        $sensor->sensor_name = $v['sensorName'];
        $sensor->sensor_type = $this->mapSensorType($v['sensorType']);
        $sensor->home_id     = $v['homeId'];
        $sensor->status      = 'active';
        $sensor->calibration_meta = ['room_name' => $v['roomName'] ?? null];

        $sensor->save();

        return response()->json(['success'=>true]);
    }
}
