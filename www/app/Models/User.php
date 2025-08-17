<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    // 既存テーブル定義に合わせる
    protected $table = 'users';          // 大文字テーブル名に変える
    protected $primaryKey = 'user_id';   // 文字列PK
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true;           // created_at / updated_at を使用

    // Laravelのデフォルト 'password' ではないので注意
    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected $fillable = [
        'user_id', 'user_name', 'email', 'password_hash', 'role',
        'is_active', 'webex_account', 'line_account',
    ];

    // 認証で使う「パスワードの列名」を差し替える（必要なら）
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

}