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
        $homes = Home::query()
            ->leftJoin('sensors','sensors.home_id','=','homes.home_id')
            ->groupBy('homes.home_id')
            ->orderBy('homes.created_at','desc')
            ->get([
                'homes.home_id','homes.home_name','homes.address','homes.created_at',
                DB::raw('COUNT(sensors.sensor_id) as sensor_count')
            ]);

        return response()->json(['homes'=>$homes]);
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
}
