<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GjorAttachment extends Model
{
    use HasFactory;

    protected $table = 'gjor_attachments';

    protected $fillable = [
        'gjor_job_order_id',
        'original_name',
        'file_path',
        'type',
    ];

    public function jobOrder(): BelongsTo
    {
        return $this->belongsTo(GjorJobOrder::class, 'gjor_job_order_id');
    }
}