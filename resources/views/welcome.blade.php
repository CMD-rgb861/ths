<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="api-token" content="{{ auth()->user()?->api_token }}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
    <title>Laravel + React</title>
    @viteReactRefresh
    @vite('resources/js/app.jsx')
</head>
<body>
    <div id="app"></div>
</body>
</html>
