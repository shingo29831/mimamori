<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Resident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ResidentController extends Controller
{
    public function index()
    {
        $residents = Resident::select([
                'resident_id','resident_name','date_of_birth','created_at',
                DB::raw('TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) as age_calc'),
            ])
            ->orderBy('created_at','desc')
            ->get();

        return response()->json(['residents' => $residents]);
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'residentName' => ['required','string','max:255'],
            'birthDate'    => ['nullable','date'],
        ], [], ['residentName'=>'氏名','birthDate'=>'生年月日']);

        Resident::create([
            'resident_id'   => (string) Str::uuid(),
            'resident_name' => $v['residentName'],
            'date_of_birth' => $v['birthDate'] ?? null,
        ]);

        return response()->json(['success'=>true]);
    }
}
