<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GjorJobOrder extends Model
{
    use HasFactory;

    protected $table = 'gjor_job_orders';

    protected $fillable = [
        'request_no',
        'request_for_id',
        'user_id',
        'department_id',
        'requested_by',
        'contact_no',
        'purpose',
        'location',
        'others_desc',
        'status_id',
        'is_cancelled',
        'cancelled_by',
        'is_conformed',
        'confirmed_by',
        'notified',
    ];

    protected $casts = [
        'is_cancelled' => 'boolean',
        'is_conformed' => 'boolean',
        'notified'     => 'boolean',
    ];

    // ------------------------------------------------------------
    // Relationships
    // ------------------------------------------------------------
    public function requestFor(): BelongsTo
    {
        return $this->belongsTo(GjorRequestFor::class, 'request_for_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(RequestStatus::class, 'status_id');
    }

    public function actionTaken(): HasOne
    {
        return $this->hasOne(GjorActionTaken::class, 'gjor_job_order_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(GjorAttachment::class, 'gjor_job_order_id');
    }

    public function requestForItems(): HasMany
    {
        return $this->hasMany(GjorJobOrderRequestFor::class, 'gjor_job_order_id')
            ->with('requestFor');
    }

    // ------------------------------------------------------------
    // Scopes
    // ------------------------------------------------------------
    public function scopeActive($query)
    {
        return $query->where('is_cancelled', false);
    }

    public function scopePending($query)
    {
        return $query->where('is_conformed', false)
                     ->where('is_cancelled', false);
    }

    // ------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------
    public static function generateRequestNo(): string
    {
        $period = now()->format('Ym');

        $last = static::where('request_no', 'like', $period . '%')
            ->lockForUpdate()
            ->orderByDesc('request_no')
            ->first();

        $nextSequence = $last
            ? ((int) substr($last->request_no, -4)) + 1
            : 1;

        return $period . str_pad((string) $nextSequence, 4, '0', STR_PAD_LEFT);
    }

    public function getRequestForSummaryAttribute(): string
    {
        return $this->requestForItems
            ->filter(fn ($row) => $row->quantity > 0)
            ->map(fn ($row) => "{$row->quantity} × {$row->requestFor->name}")
            ->implode(', ');
    }
}