<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResidentHome extends Model
{
    protected $table = 'Resident_Homes';
    public $timestamps = false;
    protected $fillable = ['resident_id','home_id','assigned_from','assigned_to'];
}
