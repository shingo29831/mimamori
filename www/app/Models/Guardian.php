<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Guardian extends Model
{
    protected $table = 'Guardians';
    protected $fillable = ['user_id','resident_id','relationship','created_at','assigned_to'];
    public $timestamps = false;

    public function user()     { return $this->belongsTo(User::class, 'user_id', 'user_id'); }
    public function resident() { return $this->belongsTo(Resident::class, 'resident_id', 'resident_id'); }
}
