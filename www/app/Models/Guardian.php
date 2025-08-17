<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Guardian extends Model
{
    protected $table = 'guardians';
    protected $fillable = ['user_id','resident_id','relationship','assigned_from','assigned_to'];
    public $timestamps = true; // created_at/updated_at を使うなら

    public function user()     { return $this->belongsTo(User::class, 'user_id', 'user_id'); }
    public function resident() { return $this->belongsTo(Resident::class, 'resident_id', 'resident_id'); }
}
