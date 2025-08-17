<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Home extends Model
{
    protected $table = 'Homes';
    protected $primaryKey = 'home_id';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['home_id','home_name','address'];
    public $timestamps = true;
}
