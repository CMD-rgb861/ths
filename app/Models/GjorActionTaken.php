<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GjorActionTaken extends Model
{
    use HasFactory;

    protected $table = 'gjor_action_taken';

    protected $fillable = [
        'gjor_job_order_id',
        'action_taken',
        'reason',
        'remarks',
        'signatory',
    ];

    public function jobOrder(): BelongsTo
    {
        return $this->belongsTo(GjorJobOrder::class, 'gjor_job_order_id');
    }
}