<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\ResidentHome;
use App\Models\Sensor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RelationshipController extends Controller
{
    public function index()
    {
        // user-resident
        $g = DB::table('guardians')
            ->join('users','users.user_id','=','guardians.user_id')
            ->join('residents','residents.resident_id','=','guardians.resident_id')
            ->orderBy('guardians.id','desc')
            ->get([
                DB::raw("'user-resident' as type"),
                'guardians.id',
                'users.user_name as from_name',
                'residents.resident_name as to_name',
                'guardians.relationship',
                DB::raw('NULL as room_name'),
                'guardians.assigned_from as created_at',
            ]);

        // resident-home
        $rh = DB::table('resident_homes')
            ->join('residents','residents.resident_id','=','resident_homes.resident_id')
            ->join('homes','homes.home_id','=','resident_homes.home_id')
            ->orderBy('resident_homes.id','desc')
            ->get([
                DB::raw("'resident-home' as type"),
                'resident_homes.id',
                'residents.resident_name as from_name',
                'homes.home_name as to_name',
                DB::raw('NULL as relationship'),
                DB::raw('NULL as room_name'),
                'resident_homes.assigned_from as created_at',
            ]);

        // home-sensor（id は sensor_id を使う）
        $hs = DB::table('sensors')
            ->join('homes','homes.home_id','=','sensors.home_id')
            ->orderBy('sensors.created_at','desc')
            ->get([
                DB::raw("'home-sensor' as type"),
                'sensors.sensor_id as id',
                'homes.home_name as from_name',
                'sensors.sensor_name as to_name',
                DB::raw("JSON_UNQUOTE(JSON_EXTRACT(sensors.calibration_meta, '$.room_name')) as room_name"),
                DB::raw('NULL as relationship'),
                'sensors.created_at',
            ]);

        $relationships = $g->concat($rh)->concat($hs)->values();

        return response()->json(['relationships' => $relationships]);
    }

    public function store(Request $request)
    {
        $type = $request->input('type');

        if ($type === 'user-resident') {
            $v = $request->validate([
                'userId'     => ['required','string','exists:users,user_id'],
                'residentId' => ['required','string','exists:residents,resident_id'],
                'relationship' => ['nullable','string','max:64'],
            ]);
            Guardian::create([
                'user_id'      => $v['userId'],
                'resident_id'  => $v['residentId'],
                'relationship' => $v['relationship'] ?? null,
            ]);
            return response()->json(['success'=>true]);
        }

        if ($type === 'resident-home') {
            $v = $request->validate([
                'residentId' => ['required','string','exists:residents,resident_id'],
                'homeId'     => ['required','string','exists:homes,home_id'],
            ]);
            ResidentHome::create([
                'resident_id' => $v['residentId'],
                'home_id'     => $v['homeId'],
            ]);
            return response()->json(['success'=>true]);
        }

        if ($type === 'home-sensor') {
            $v = $request->validate([
                'sensorId' => ['required','string','exists:sensors,sensor_id'],
                'homeId'   => ['required','string','exists:homes,home_id'],
                'roomName' => ['nullable','string','max:255'],
            ]);

            $sensor = Sensor::findOrFail($v['sensorId']);
            $sensor->home_id = $v['homeId'];
            $meta = $sensor->calibration_meta ?? [];
            $meta['room_name'] = $v['roomName'] ?? null;
            $sensor->calibration_meta = $meta;
            $sensor->save();

            return response()->json(['success'=>true]);
        }

        return response()->json(['success'=>false,'message'=>'Invalid type'], 422);
    }

    public function destroy(Request $request)
    {
        $type = $request->query('type');
        $id   = $request->query('id');

        if ($type === 'user-resident') {
            Guardian::where('id',$id)->delete();
            return response()->json(['success'=>true]);
        }

        if ($type === 'resident-home') {
            ResidentHome::where('id',$id)->delete();
            return response()->json(['success'=>true]);
        }

        if ($type === 'home-sensor') {
            // 「紐付けを削除」＝センサー自体を削除（unregister の代替）
            Sensor::where('sensor_id',$id)->delete();
            return response()->json(['success'=>true]);
        }

        return response()->json(['success'=>false,'message'=>'Invalid type'], 422);
    }
}
