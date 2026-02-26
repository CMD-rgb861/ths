<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class JobOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_order_no',
        'date',
        'department_id',
        'requested_by',
        'created_by',
        'request_description',
        'contact_no',
        'signature_name',
        'approved_by',
        'approval_date',
        'conformed_by',
        'conformance_date',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
        'attachments' => 'array',
        'approval_date' => 'datetime',
        'conformance_date' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(Signatory::class, 'approved_by');
    }

    public function conformer()
    {
        return $this->belongsTo(User::class, 'conformed_by');
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class, 'job_order_category')
            ->withPivot('other_description');
    }

    public function actionReport()
    {
        return $this->hasOne(ActionReport::class);
    }

    public function attachments()
    {
        return $this->hasMany(JobOrderAttachment::class);
    }


}
