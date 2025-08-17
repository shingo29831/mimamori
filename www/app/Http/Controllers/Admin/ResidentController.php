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
        $rows = DB::table('Residents')
            ->select([
                'Residents.resident_id',
                'Residents.resident_name',
                'Residents.date_of_birth',
                'Residents.created_at',
                DB::raw('CASE WHEN date_of_birth IS NULL THEN NULL ELSE TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) END AS age_calc'),
            ])
            ->orderByDesc('Residents.created_at')
            ->get();

        return response()->json(['residents' => $rows]);
    }


    public function store(Request $request)
    {
        $data = $request->validate([
            'residentName' => ['required','string','max:255'],
            'birthDate'    => ['nullable','date'],
        ]);

        Resident::create([
            'resident_id'   => (string) Str::uuid(),
            'resident_name' => $data['residentName'],
            'date_of_birth' => $data['birthDate'] ?? null,
        ]);

        return response()->json(['success' => true]);
    }


    public function destroy(string $residentId)
    {
        $deleted = \App\Models\Resident::where('resident_id', $residentId)->delete();
        return response()->json(['success' => (bool) $deleted]);
    }

}
