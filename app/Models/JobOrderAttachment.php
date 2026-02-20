<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class JobOrderAttachment extends Model
{
    protected $fillable = [
        'job_order_id',
        'original_name',
        'file_path',
        'type',
    ];

    // 🔥 Automatically append file_url to JSON
    protected $appends = ['file_url'];

    /*
    |--------------------------------------------------------------------------
    | ACCESSOR
    |--------------------------------------------------------------------------
    */
    public function getFileUrlAttribute()
    {
        return Storage::url($this->file_path);
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP
    |--------------------------------------------------------------------------
    */
    public function jobOrder()
    {
        return $this->belongsTo(JobOrder::class);
    }
}
