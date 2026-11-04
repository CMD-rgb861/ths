<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GjorRequestFor extends Model
{
    use HasFactory;

    protected $table = 'gjor_request_for';

    protected $fillable = ['name'];

    public function jobOrders(): HasMany
    {
        return $this->hasMany(GjorJobOrder::class, 'request_for_id');
    }
}