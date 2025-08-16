<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\UserController;

Route::post('/login',  [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me',     [AuthController::class, 'me']);
    Route::post('/logout',[AuthController::class, 'logout']);
});

Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/residents', fn() => response()->json(['residents' => []]));
    Route::get('/homes', fn() => response()->json(['homes' => []]));
    Route::get('/sensors', fn() => response()->json(['sensors' => []]));
    Route::get('/relationships', fn() => response()->json(['relationships' => []]));
});