<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ActionReport extends Model
{
    use HasFactory;

        protected $fillable = [
        'job_order_id',
        'diagnosis',
        'action_taken',
        'status',
        'serviced_by',
        'date_started',
        'date_finished',

        // Approval / Cancellation tracking
        'accepted_by',
        'accepted_at',
        'cancelled_by',
        'cancelled_at',

        'conformed',
        'confirmed_at',
        'confirmed_by',
        'remarks',

        // ADD THESE FIELDS
        'item',               // Item field
        'findings',           // Findings field
        'noted_by_its',       // Noted by ITS field
        'noted_by_pc',        // Noted by Property Custodian field
        'unserviceable_date', // Date field for unserviceable status
    ];


    protected $casts = [
        'accepted_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'date_started' => 'datetime',
        'date_finished' => 'datetime',
        'confirmed_at' => 'datetime',
        'conformed' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function jobOrder()
    {
        return $this->belongsTo(JobOrder::class);
    }

    public function servicedBy()
    {
        return $this->belongsTo(User::class, 'serviced_by');
    }

    public function acceptedBy()
    {
        return $this->belongsTo(User::class, 'accepted_by');
    }

    public function cancelledBy()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }
}
