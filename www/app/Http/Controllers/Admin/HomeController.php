<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Home;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HomeController extends Controller
{
    
    public function index()
    {
        $sensorCounts = DB::table('sensors')
            ->select('home_id', DB::raw('COUNT(*) AS sensor_count'))
            ->groupBy('home_id');

        $rows = DB::table('homes')
            ->leftJoinSub($sensorCounts, 'sc', function ($join) {
                $join->on('sc.home_id', '=', 'homes.home_id');
            })
            ->select([
                'homes.home_id',
                'homes.home_name',
                'homes.address',
                'homes.created_at',
                DB::raw('COALESCE(sc.sensor_count, 0) AS sensor_count'),
            ])
            ->orderByDesc('homes.created_at')
            ->get();

        return response()->json(['homes' => $rows]);
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'homeName' => ['required','string','max:255'],
            'address'  => ['nullable','string','max:512'],
        ], [], ['homeName'=>'宅名','address'=>'住所']);

        Home::create([
            'home_id'   => (string) Str::uuid(),
            'home_name' => $v['homeName'],
            'address'   => $v['address'] ?? null,
        ]);

        return response()->json(['success'=>true]);
    }

    public function destroy(string $homeId)
    {
        $deleted = \App\Models\Home::where('home_id', $homeId)->delete();
        return response()->json(['success' => (bool) $deleted]);
    }

}
