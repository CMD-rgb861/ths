<?php

// app/Models/Department.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Department extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'name',
        'shorten',
        'parent_office_id',
        'icon',
        'updated_by',
        'created_at',
        'update_at',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_departments');
    }

    public function jobOrders()
    {
        return $this->hasMany(JobOrder::class);
    }
}
