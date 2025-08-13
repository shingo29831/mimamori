<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Redis;
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});
Route::get('/redis-test', function () {
    Redis::set('test-key', 'Hello Redis!');
    $value = Redis::get('test-key');
    return "Redisから取得した値: " . $value;
});
Route::get('/login', function () {
    return view('react');
});

Route::get('/dashboard/staff', function () {
    return view('react');
});

Route::get('/dashboard/family', function () {
    return view('react');
});

Route::get('/management/family-links', function () {
    return view('react');
});

Route::get('/management/system-management', function () {
    return view('react');
});