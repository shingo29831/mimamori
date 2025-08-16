<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{
    public function index(Request $request)
    {
        // ここで職員限定にするなら:
        if ($request->user()->role !== 'staff') {
            abort(403, 'Forbidden');
        }

        $users = User::query()
            ->select(['user_id','user_name','email','role','created_at'])
            ->orderBy('created_at','desc')
            ->get();

        return response()->json([
            'users' => $users,
        ]);
    }
}
