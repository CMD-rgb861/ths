<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class WipurRequest extends Model
{
    use HasFactory;

    protected $table = 'wipur_requests';

    protected $fillable = [
        'control_number',
        'user_id',
        'department_id',
        'requested_by',
        'request_desc',
        'status_id',
        'is_cancelled',
        'cancelled_by',
        'is_conformed',
        'confirmed_by',
        'approved_by',
        'approved_date',
        'processed_by',
        'processed_date',
        'acknowledged_by',
        'acknowledged_date',
        'notified',
        'date_requested',
        'signature',
    ];

    protected $casts = [
        'is_cancelled' => 'boolean',
        'is_conformed' => 'boolean',
        'notified' => 'boolean',
        'approved_date' => 'datetime',
        'processed_date' => 'datetime',
        'acknowledged_date' => 'datetime',
        'date_requested' => 'datetime',
    ];

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

    public function attachments(): HasMany
    {
        return $this->hasMany(WipurAttachment::class, 'wipur_request_id');
    }

    public function steps(): HasMany
    {
        return $this->hasMany(WipurStep::class, 'wipur_request_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(WipurRequestEvent::class, 'wipur_request_id');
    }

    public function latestStep(): HasOne
    {
        return $this->hasOne(WipurStep::class, 'wipur_request_id')
            ->orderByDesc('updated_at')
            ->orderByDesc('id');
    }

    public function currentWorkflowStatus(): ?string
    {
        return $this->latestStep?->status;
    }

    public function latestRemarks(): ?string
    {
        $remarks = $this->latestStep?->remarks;

        if (is_string($remarks) && trim($remarks) !== '') {
            return trim($remarks);
        }

        return is_string($this->request_desc) && trim($this->request_desc) !== ''
            ? trim($this->request_desc)
            : null;
    }

    public static function generateControlNumber(): string
    {
        $period = now()->format('Ym');

        $last = static::where('control_number', 'like', $period . '%')
            ->lockForUpdate()
            ->orderByDesc('control_number')
            ->first();

        $nextSequence = $last
            ? ((int) substr($last->control_number, -4)) + 1
            : 1;

        return $period . str_pad((string) $nextSequence, 4, '0', STR_PAD_LEFT);
    }
}
