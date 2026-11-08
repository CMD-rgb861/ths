<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gjor_csm', function (Blueprint $table) {
            $table->id();

            $table->foreignId('job_order_id')
                ->nullable()
                ->unique()
                ->constrained('gjor_job_orders')
                ->nullOnDelete();

            $table->string('client_type');
            $table->string('client_category');
            $table->string('client_category_other')->nullable();
            $table->string('name')->nullable();
            $table->string('sex');
            $table->integer('age');
            $table->dateTime('date_time_visited');
            $table->text('services_availed');
            $table->string('service_provider_name')->nullable();
            $table->string('who_to_evaluate');
            $table->string('who_to_evaluate_other')->nullable();
            $table->string('office_or_faculty_unit_transacted')->nullable();

            $table->integer('cc1');
            $table->integer('cc2');
            $table->integer('cc3');

            $table->integer('sqd0');
            $table->integer('sqd1');
            $table->integer('sqd2');
            $table->integer('sqd3');
            $table->integer('sqd4');
            $table->integer('sqd5');
            $table->integer('sqd6');
            $table->integer('sqd7');
            $table->integer('sqd8');

            $table->text('suggestions')->nullable();
            $table->string('email_address')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gjor_csm');
    }
};
