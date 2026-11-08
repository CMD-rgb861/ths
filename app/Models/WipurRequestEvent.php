<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WipurRequestEvent extends Model
{
    protected $table = 'wipur_request_events';

    public $timestamps = false;

    protected $fillable = [
        'wipur_request_id',
        'actor_user_id',
        'event_type',
        'from_status',
        'to_status',
        'request_desc',
        'remarks',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public static function record(array $attributes): self
    {
        return static::create($attributes + ['created_at' => now()]);
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(WipurRequest::class, 'wipur_request_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}