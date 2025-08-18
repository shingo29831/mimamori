<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\ResidentController;
use App\Http\Controllers\Admin\HomeController;
use App\Http\Controllers\Admin\SensorController;
use App\Http\Controllers\Admin\RelationshipController;
use App\Http\Controllers\Admin\SensorReadingController;


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

    Route::get('guardians', [RelationshipController::class,'guardians']);

    Route::get('sensor-readings',  [SensorReadingController::class,'index']);

    Route::get('sensors/{sensorId}/metrics/{metric}/first', [SensorReadingController::class, 'earliest']);
});

if (app()->environment('local')) {
    Route::post('/admin/users/open-store', [UserController::class, 'store'])
        ->withoutMiddleware('auth:sanctum')
        ->middleware('throttle:5,1'); // 1分に5回まで
}

// 一時的にトークン無しで叩きたい時（終わったら必ず消してください）
Route::get('admin/sensors/{sensorId}/metrics/{metric}/first-open', [SensorReadingController::class, 'earliestOpen']);