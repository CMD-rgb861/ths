<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wipur_request_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wipur_request_id')
                ->constrained('wipur_requests')
                ->cascadeOnDelete();
            $table->foreignId('actor_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('event_type', 50);
            $table->string('from_status', 80)->nullable();
            $table->string('to_status', 80)->nullable();
            $table->longText('request_desc')->nullable();
            $table->text('remarks')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['wipur_request_id', 'created_at'], 'wipur_events_request_created_index');
            $table->index(['actor_user_id', 'event_type'], 'wipur_events_actor_type_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wipur_request_events');
    }
};
