<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prompt extends Model
{
    public $incrementing = false;
    protected $primaryKey = 'date';
    protected $keyType = 'string';

    protected $fillable = [
        'date',
        'theme',
        'emotion',
        'form',
        'constraint'
    ];
}
