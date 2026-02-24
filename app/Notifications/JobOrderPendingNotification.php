<?php

namespace App\Notifications;

use App\Models\JobOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class JobOrderPendingNotification extends Notification
{
    use Queueable;

    public $jobOrder;

    public function __construct(JobOrder $jobOrder)
    {
        $this->jobOrder = $jobOrder;
    }

    public function via($notifiable)
    {
        return ['database'];  // Store the notification in the database
    }

    public function toDatabase($notifiable)
    {
        return [
            'job_order_id' => $this->jobOrder->id,
            'message' => 'New Job Order pending. Please review.',
            'action_url' => route('job-orders.show', ['jobOrder' => $this->jobOrder->id]),
        ];
    }
}