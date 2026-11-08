<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GjorCsm extends Model
{
    protected $table = 'gjor_csm';

    protected $fillable = [
        'job_order_id',
        'client_type',
        'client_category',
        'client_category_other',
        'name',
        'sex',
        'age',
        'date_time_visited',
        'services_availed',
        'service_provider_name',
        'who_to_evaluate',
        'who_to_evaluate_other',
        'office_or_faculty_unit_transacted',
        'cc1',
        'cc2',
        'cc3',
        'sqd0',
        'sqd1',
        'sqd2',
        'sqd3',
        'sqd4',
        'sqd5',
        'sqd6',
        'sqd7',
        'sqd8',
        'suggestions',
        'email_address',
    ];

    protected $casts = [
        'date_time_visited' => 'datetime',
    ];

    public function jobOrder(): BelongsTo
    {
        return $this->belongsTo(GjorJobOrder::class, 'job_order_id');
    }
}
