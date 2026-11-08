<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WipurStep extends Model
{
    use HasFactory;

    protected $table = 'wipur_steps';

    protected $fillable = [
        'wipur_request_id',
        'step',
        'step_order',
        'status',
        'is_declined',
        'assigned_to_user_id',
        'approved_by',
        'approved_at',
        'declined_by',
        'declined_at',
        'decline_reason',
        'remarks',
        'notified_at',
    ];

    protected $casts = [
        'step_order' => 'integer',
        'is_declined' => 'boolean',
        'approved_at' => 'datetime',
        'declined_at' => 'datetime',
        'notified_at' => 'datetime',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(WipurRequest::class, 'wipur_request_id');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function declinedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'declined_by');
    }
}
