<?php

// app/Models/Department.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Department extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_departments');
    }

    public function jobOrders()
    {
        return $this->hasMany(JobOrder::class);
    }
}
