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
    public function index(Request $request)
    {
        $types = collect(explode(',', (string) $request->query('types')))
            ->map(fn($t) => trim($t))
            ->filter()
            ->values();

        $out = collect();

        // user-resident
        if ($types->isEmpty() || $types->contains('user-resident')) {
            $g = DB::table('Guardians')
                ->join('Users','Users.user_id','=','Guardians.user_id')
                ->join('Residents','Residents.resident_id','=','Guardians.resident_id')
                ->orderBy('Guardians.id','desc')
                ->get([
                    DB::raw("'user-resident' as type"),
                    'Guardians.id',
                    // ★ 追加: ID列
                    'Guardians.user_id',
                    'Guardians.resident_id',
                    'Users.user_name as from_name',
                    'Residents.resident_name as to_name',
                    'Guardians.relationship',
                    DB::raw('NULL as room_name'),
                    'Guardians.assigned_from as created_at',
                ]);
            $out = $out->concat($g);
        }

        // resident-home
        if ($types->isEmpty() || $types->contains('resident-home')) {
            $rh = DB::table('Resident_Homes')
                ->join('Residents','Residents.resident_id','=','Resident_Homes.resident_id')
                ->join('Homes','Homes.home_id','=','Resident_Homes.home_id')
                ->orderBy('Resident_Homes.id','desc')
                ->get([
                    DB::raw("'resident-home' as type"),
                    'Resident_Homes.id',
                    // ★ 追加: ID列
                    'Resident_Homes.resident_id',
                    'Resident_Homes.home_id',
                    'Residents.resident_name as from_name',
                    'Homes.home_name as to_name',
                    DB::raw('NULL as relationship'),
                    DB::raw('NULL as room_name'),
                    'Resident_Homes.assigned_from as created_at',
                    // ★ あるなら返す
                    'Resident_Homes.assigned_to',
                ]);
            $out = $out->concat($rh);
        }

        // home-sensor（“設置済み”だけ返す想定）
        if ($types->isEmpty() || $types->contains('home-sensor')) {
            $hs = DB::table('Sensors')
                ->join('Homes','Homes.home_id','=','Sensors.home_id')
                ->whereNotNull('Sensors.home_id')
                ->orderBy('Sensors.sensor_id','desc') // created_at が無ければ sensor_id などに変更
                ->get([
                    DB::raw("'home-sensor' as type"),
                    'Sensors.sensor_id as id',
                    // ★ 追加: ID列（from=home, to=sensor）
                    'Homes.home_id',
                    'Sensors.sensor_id',
                    'Homes.home_name as from_name',
                    'Sensors.sensor_name as to_name',
                    DB::raw("JSON_UNQUOTE(JSON_EXTRACT(Sensors.calibration_meta, '$.room_name')) as room_name"),
                    DB::raw('NULL as relationship'),
                    // created_at が無い場合は last_seen / updated_at 等に差し替え
                    DB::raw('COALESCE(Sensors.updated_at, Sensors.created_at) as created_at'),
                ]);
            $out = $out->concat($hs);
        }

        return response()->json(['relationships' => $out->values()]);
    }

    public function store(Request $request)
    {
        $type = $request->input('type');

        if ($type === 'user-resident') {
            $v = $request->validate([
                'userId'     => ['required','string','exists:Users,user_id'],
                'residentId' => ['required','string','exists:Residents,resident_id'],
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
                'residentId' => ['required','string','exists:Residents,resident_id'],
                'homeId'     => ['required','string','exists:Homes,home_id'],
            ]);
            ResidentHome::create([
                'resident_id' => $v['residentId'],
                'home_id'     => $v['homeId'],
            ]);
            return response()->json(['success'=>true]);
        }

        if ($type === 'home-sensor') {
            $v = $request->validate([
                'sensorId' => ['required','string','exists:Sensors,sensor_id'],
                'homeId'   => ['required','string','exists:Homes,home_id'],
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
