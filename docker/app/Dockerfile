FROM php:8.2-fpm
RUN apt-get update \
    && apt-get install -y \
    git \
    zip \
    unzip \
    vim \
    curl \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libmcrypt-dev \
    libpng-dev \
    libfontconfig1 \
    libxrender1

RUN docker-php-ext-configure gd --with-freetype --with-jpeg
RUN docker-php-ext-install gd
RUN docker-php-ext-install bcmath
RUN docker-php-ext-install pdo_mysql mysqli exif
RUN cd /usr/bin && curl -s http://getcomposer.org/installer | php && ln -s /usr/bin/composer.phar /usr/bin/composer

RUN pecl install redis \
    && docker-php-ext-enable redis

WORKDIR /src/www
ADD . /src/storage
RUN chown -R www-data:www-data /src/storage
