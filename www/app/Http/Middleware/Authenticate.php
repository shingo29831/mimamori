<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    protected function redirectTo($request)
    {
        // API か JSON 期待時はリダイレクトさせず 401 を返す
        if ($request->expectsJson() || $request->is('api/*')) {
            return null;
        }
        return route('login'); // Web だけリダイレクト
    }
}