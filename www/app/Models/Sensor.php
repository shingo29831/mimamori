<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sensor extends Model
{
    protected $table = 'Sensors';
    protected $primaryKey = 'sensor_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'calibration_meta' => 'array',
        'last_seen' => 'datetime',
    ];

    protected $fillable = [
        'sensor_id','sensor_name','sensor_type','home_id',
        'status','last_seen','calibration_meta',
    ];
    public $timestamps = false;
}
