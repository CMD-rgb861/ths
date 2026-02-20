<?php

// app/Models/Category.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function jobOrders()
    {
        return $this->belongsToMany(JobOrder::class, 'job_order_category')
            ->withPivot('other_description');
    }
}
