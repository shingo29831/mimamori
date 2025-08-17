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

        $users = User::select('user_id','user_name','email','role','created_at')
            ->orderBy('created_at','desc')
            ->get();

        return response()->json(['users' => $users]);
    }

    public function store(Request $request)
    {
        // バリデーション（フロントと同じ最低8文字）
        $validated = $request->validate([
            'userName' => ['required','string','max:255'],
            'email'    => ['required','string','email','max:255','unique:Users,email'],
            'role'     => ['required','in:family,staff'],
            'password' => ['required','string','min:8'],
        ], [], [
            'userName' => '氏名',
            'email'    => 'メールアドレス',
            'role'     => '権限',
            'password' => 'パスワード',
        ]);

        $user = new User();
        $user->user_id       = (string) Str::uuid(); // VARCHAR(64) なので UUID でOK
        $user->user_name     = $validated['userName'];
        $user->email         = $validated['email'];
        $user->role          = $validated['role'];
        $user->password_hash = Hash::make($validated['password']); // ← カラムは password_hash
        // $user->password_hash = $validated['password'];
        $user->is_active     = true;

        $user->save();

        return response()->json(['success' => true]);
    }

    public function destroy(string $id)
    {
        // user_id で削除（guardians は FK の ON DELETE CASCADE が効きます）
        $user = User::where('user_id', $id)->firstOrFail();
        $user->delete();

        return response()->json(['success' => true]);
    }
    
}
