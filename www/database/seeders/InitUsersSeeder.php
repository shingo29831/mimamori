<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class InitUsersSeeder extends Seeder
{
    public function run(): void
    {
        // すでにあれば更新、なければ作成
        User::updateOrCreate(
            ['user_id' => 'u-0002'],
            [
                'user_name'     => 'umeda',
                'email'         => 'umeda@example.com',
                'password_hash' => Hash::make('pass'),
                'role'          => 'staff',
                'is_active'     => true,
            ]
        );
    }
}