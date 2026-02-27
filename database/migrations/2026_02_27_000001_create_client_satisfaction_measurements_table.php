<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('client_satisfaction_measurements', function (Blueprint $table) {
            $table->id();

            // General Information
            $table->string('client_type');
            $table->string('client_category');
            $table->string('name')->nullable();
            $table->string('sex');
            $table->integer('age');
            $table->dateTime('date_time_visited');
            $table->string('region_of_residence');
            $table->text('services_availed');
            $table->string('service_provider_name')->nullable();
            $table->string('who_to_evaluate');

            // Conditional Fields
            $table->string('office_or_faculty_unit_transacted')->nullable();
            $table->string('student_program')->nullable();

            // Rating Fields
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

            // Additional Information
            $table->text('suggestions')->nullable();
            $table->string('email_address')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('client_satisfaction_measurements');
    }
};
