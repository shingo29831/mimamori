<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SensorReading extends Model
{
    protected $table = 'Sensor_Readings'; // 大文字&アンダースコア注意
    public $timestamps = false;           // created_at/updated_at が無い

    protected $casts = [
        'timestamp'   => 'datetime',
        'received_at' => 'datetime',
        'value'       => 'array',        // JSON を配列として扱う
    ];
}
