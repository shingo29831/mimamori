<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * ログイン（メール or ユーザー名 と パスワード）
     * POST /api/login
     * body: { "login": "email or user_name", "password": "plain" }
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => ['required','string','max:255'],
            'password' => ['required','string','max:255'],
            'role'     => ['required','in:family,staff'],
        ]);

        $email = $validated['email'];
        $password = $validated['password'];
        $requiredRole = $validated['role'];

        // email または user_name で検索
        $user = User::where('email', $email)->first();

        if (!$user || !$user->is_active) {
            return response()->json(['message' => 'ユーザーが存在しないか、利用できません。'], 422);
        }

        // password_hash（bcrypt想定）を照合
        if (!Hash::check($password, $user->password_hash)) {
            return response()->json(['message' => 'パスワードが正しくありません。'], 422);
        }

        if ($requiredRole !== $user->role) {
            return response()->json(['message' => '権限が違います'], 403);
        }

        // 既存トークンを無効化したい場合はコメント解除
        // $user->tokens()->delete();

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'message' => 'ログインに成功しました。',
            'token'   => $token,
            'user'    => [
                'user_id'   => $user->user_id,
                'user_name' => $user->user_name,
                'email'     => $user->email,
                'role'      => $user->role,
            ],
        ]);
    }

    /**
     * ログアウト（現在のトークンのみ無効化）
     * POST /api/logout
     * header: Authorization: Bearer <token>
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'ログアウトしました。'
        ]);
    }

    /**
     * 自分情報
     * GET /api/me
     * header: Authorization: Bearer <token>
     */
    public function me(Request $request)
    {
        $u = $request->user();
        return response()->json([
            'user_id'   => $u->user_id,
            'user_name' => $u->user_name,
            'email'     => $u->email,
            'role'      => $u->role,
            'is_active' => (bool)$u->is_active,
        ]);
    }
}
