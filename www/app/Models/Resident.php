<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resident extends Model
{
    protected $table = 'Residents';
    protected $primaryKey = 'resident_id';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['resident_id','resident_name','date_of_birth'];
    public $timestamps = true;
    const UPDATED_AT = null;   
}
