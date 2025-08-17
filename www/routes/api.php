<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\ResidentController;
use App\Http\Controllers\Admin\HomeController;
use App\Http\Controllers\Admin\SensorController;
use App\Http\Controllers\Admin\RelationshipController;

Route::post('/login',  [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me',     [AuthController::class, 'me']);
    Route::post('/logout',[AuthController::class, 'logout']);
});

Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::delete('users/{id}', [UserController::class, 'destroy']);
    // residents
    Route::get('residents',  [ResidentController::class,'index']);
    Route::post('residents', [ResidentController::class,'store']);
    Route::delete('residents/{residentId}', [ResidentController::class,'destroy']);

    // homes
    Route::get('homes',  [HomeController::class,'index']);
    Route::post('homes', [HomeController::class,'store']);
    Route::delete('homes/{homeId}',       [HomeController::class,'destroy']);

    // sensors
    Route::get('sensors',  [SensorController::class,'index']);
    Route::post('sensors', [SensorController::class,'store']);
    Route::delete('sensors/{sensorId}',   [SensorController::class,'destroy']);

    // relationships (3種をまとめて)
    Route::get('relationships',    [RelationshipController::class,'index']);
    Route::post('relationships',   [RelationshipController::class,'store']);
    Route::delete('relationships', [RelationshipController::class,'destroy']);
});