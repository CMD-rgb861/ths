<?php

// app/Notifications/DiagnosisConfirmedNotification.php

namespace App\Notifications;

use App\Models\JobOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DiagnosisConfirmedNotification extends Notification
{
    use Queueable;

    public $job;

    public function __construct(JobOrder $job)
    {
        $this->job = $job;
    }

    public function via($notifiable)
    {
        return ['database'];  // Store the notification in the database
    }

    public function toDatabase($notifiable)
    {
        return [
            'job_order_id' => $this->job->id,
            'message' => 'The diagnosis has been confirmed by the requester.',
            'action_url' => route('job-orders.show', ['jobOrder' => $this->job->id]),
        ];
    }
}


