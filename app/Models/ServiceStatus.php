<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceStatus extends Model
{
    protected $fillable = ['name'];

    public function actionReports()
    {
        return $this->hasMany(\App\Models\ActionReport::class, 'action_taken', 'name');
    }
}
