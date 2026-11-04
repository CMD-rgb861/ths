<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GjorJobOrderRequestFor extends Model
{
    use HasFactory;

    protected $table = 'gjor_job_order_request_for';

    protected $fillable = [
        'gjor_job_order_id',
        'request_for_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function jobOrder(): BelongsTo
    {
        return $this->belongsTo(GjorJobOrder::class, 'gjor_job_order_id');
    }

    public function requestFor(): BelongsTo
    {
        return $this->belongsTo(GjorRequestFor::class, 'request_for_id');
    }
}