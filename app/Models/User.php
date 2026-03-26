<?php

// app/Models/User.php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'id_number',
        'name',
        'email',
        'password',
        'role', // Make sure role is in the fillable fields
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /*
    |---------------------------------------------------------------------------
    | Role Helper Methods
    |---------------------------------------------------------------------------
    */
    public function isAdmin()
    {
        return $this->hasRole('admin');
    }

    public function isTechnician()
    {
        return $this->hasRole('technician');
    }

    public function isUser()
    {
        return $this->hasRole('user');
    }

    /*
    |---------------------------------------------------------------------------
    | Relationships
    |---------------------------------------------------------------------------
    */
    public function departments()
    {
        return $this->belongsToMany(Department::class, 'user_departments');
    }

    public function requestedJobOrders()
    {
        return $this->hasMany(JobOrder::class, 'requested_by');
    }

    public function createdJobOrders()
    {
        return $this->hasMany(JobOrder::class, 'created_by');
    }


    public function conformedJobOrders()
    {
        return $this->hasMany(JobOrder::class, 'conformed_by');
    }

    public function servicedActionReports()
    {
        return $this->hasMany(ActionReport::class, 'serviced_by');
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    public function hasRole($roleName)
    {
        return $this->roles->contains('name', $roleName);
    }
}

