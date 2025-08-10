<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">

    <title>laravelView側タイトル</title>
    @viteReactRefresh
    @vite(['resources/js/main.tsx', 'resources/css/global.css'])
</head>
<body>
    <div id="root"></div>
</body>
</html>

