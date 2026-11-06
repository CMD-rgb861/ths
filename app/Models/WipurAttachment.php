<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WipurAttachment extends Model
{
    use HasFactory;

    protected $table = 'wipur_attachments';

    protected $fillable = [
        'wipur_request_id',
        'original_name',
        'file_path',
        'type',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(WipurRequest::class, 'wipur_request_id');
    }
}
