<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestStatus extends Model
{
    protected $fillable = ['name'];

    public function jobOrders()
    {
        return $this->hasMany(\App\Models\JobOrder::class, 'status');
    }
}
