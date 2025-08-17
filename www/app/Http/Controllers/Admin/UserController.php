<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

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

    public function store(Request $request)
    {
        $v = $request->validate([
            'userName' => ['required','string','max:255'],
            'email'    => ['required','email','unique:users,email'],
            'role'     => ['required','in:staff,family'],
            'password' => ['required','string','min:8'], // ← 追加
        ]);

        $user = new User();
        $user->user_id       = (string) Str::uuid(); // 既存仕様に合わせて
        $user->user_name     = $v['userName'];
        $user->email         = $v['email'];
        $user->role          = $v['role'];
        $user->password_hash = Hash::make($v['password']); // ← ここがポイント
        $user->save();

        return response()->json([
            'success' => true,
            'user' => [
                'user_id'   => $user->user_id,
                'user_name' => $user->user_name,
                'email'     => $user->email,
                'role'      => $user->role,
                'created_at'=> $user->created_at,
            ],
        ], 201);
    }
}
