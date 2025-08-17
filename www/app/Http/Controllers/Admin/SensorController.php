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
        // フロントの mapSensor は: sensor_id, sensor_name, sensor_type, home_id/home_name, room_name?, status, last_active を読む
        // DBは last_seen を持つので last_active に alias
        $rows = DB::table('Sensors')
            ->leftJoin('Homes','Homes.home_id','=','Sensors.home_id')
            ->select([
                'Sensors.sensor_id',
                'Sensors.sensor_name',
                'Sensors.sensor_type',
                'Sensors.home_id',
                'Homes.home_name',
                DB::raw('NULL as room_name'),
                'Sensors.status',
                DB::raw('Sensors.last_seen as last_active')
            ])
            ->orderByDesc('Sensors.created_at')
            ->get();

        return response()->json(['sensors' => $rows]);
    }

     public function store(Request $request)
    {
        $data = $request->validate([
            'sensorName' => ['required','string','max:255'],
            'sensorType' => ['required','in:MT10,MT20,MT30,MV23,other'],
            'homeId'     => ['required','string','max:64'],
            'roomName'   => ['nullable','string','max:255'], // 今は使わないが受け取ってOK
        ]);

        Sensor::create([
            'sensor_id'   => (string) Str::uuid(),
            'sensor_name' => $data['sensorName'],
            'sensor_type' => $data['sensorType'],
            'home_id'     => $data['homeId'],
            'status'      => 'active',
            'last_seen'   => null,
        ]);

        return response()->json(['success' => true]);
    }

    public function destroy(string $sensorId)
    {
        $deleted = Sensor::where('sensor_id', $sensorId)->delete();
        return response()->json(['success' => (bool) $deleted]);
    }

}
