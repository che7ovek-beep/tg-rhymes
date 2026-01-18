FROM php:8.2-fpm

RUN apt-get update && apt-get install -y git unzip libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

WORKDIR /var/www/html

COPY composer.json composer.lock* ./
COPY . .

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && composer install --no-interaction --no-scripts || true

CMD ["php-fpm"]
