<?php

namespace App\Dtos;

class UpdateOrderStatusData
{
    public function __construct(
        public string $status,
    ) {}
}
