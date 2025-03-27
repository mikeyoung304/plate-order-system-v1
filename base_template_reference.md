# Base Template Reference

This document contains the reference HTML for the base template that will be used in the `create_base_templates` task for the Plate Order System.

## Base Template (base.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{% block meta_description %}Plate Order System - Voice-enabled ordering for restaurants{% endblock %}">
    <title>{% block title %}Plate Order System{% endblock %}</title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="{{ url_for('static', filename='img/favicon.png') }}">
    
    <!-- Tailwind CSS -->
    <link rel="stylesheet" href="{{ url_for('static', filename='css/tailwind.css') }}">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
    
    {% block head_extra %}{% endblock %}
</head>
<body class="bg-gray-100 min-h-screen flex flex-col">
    <!-- Navigation -->
    <nav class="bg-primary-600 text-white shadow-md">
        <div class="container mx-auto px-4 py-3 flex justify-between items-center">
            <a href="/" class="text-xl font-bold">Plate Order System</a>
            <div class="hidden md:flex space-x-4">
                <a href="/" class="hover:text-primary-200">Home</a>
                <a href="/floor-plan" class="hover:text-primary-200">Floor Plan</a>
                <a href="/kds" class="hover:text-primary-200">Kitchen Display</a>
                <a href="/orders" class="hover:text-primary-200">Orders</a>
                <a href="/residents" class="hover:text-primary-200">Residents</a>
            </div>
            <button class="md:hidden focus:outline-none" id="menu-toggle">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>
        </div>
        <!-- Mobile menu -->
        <div class="md:hidden hidden bg-primary-700" id="mobile-menu">
            <div class="container mx-auto px-4 py-2 flex flex-col space-y-2">
                <a href="/" class="block py-1 hover:text-primary-200">Home</a>
                <a href="/floor-plan" class="block py-1 hover:text-primary-200">Floor Plan</a>
                <a href="/kds" class="block py-1 hover:text-primary-200">Kitchen Display</a>
                <a href="/orders" class="block py-1 hover:text-primary-200">Orders</a>
                <a href="/residents" class="block py-1 hover:text-primary-200">Residents</a>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-grow container mx-auto px-4 py-6">
        {% block content %}
        <div class="bg-white shadow-md rounded-lg p-6">
            <h1 class="text-2xl font-bold mb-4">Welcome to Plate Order System</h1>
            <p>This is the default content. Override this block in child templates.</p>
        </div>
        {% endblock %}
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-6">
        <div class="container mx-auto px-4">
            <div class="flex flex-col md:flex-row justify-between items-center">
                <div class="mb-4 md:mb-0">
                    <h3 class="text-lg font-semibold">Plate Order System</h3>
                    <p class="text-gray-400">Voice-enabled ordering for restaurants</p>
                </div>
                <div class="flex space-x-4">
                    <a href="#" class="text-gray-400 hover:text-white">Privacy Policy</a>
                    <a href="#" class="text-gray-400 hover:text-white">Terms of Service</a>
                    <a href="#" class="text-gray-400 hover:text-white">Contact</a>
                </div>
            </div>
            <div class="mt-4 text-center text-gray-400 text-sm">
                &copy; {{ now.year }} Plate Order System. All rights reserved.
            </div>
        </div>
    </footer>

    <!-- JavaScript -->
    <script src="{{ url_for('static', filename='js/main.js') }}"></script>
    <script>
        // Mobile menu toggle
        document.getElementById('menu-toggle').addEventListener('click', function() {
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.toggle('hidden');
        });
    </script>
    {% block scripts %}{% endblock %}
</body>
</html>
```

## Component Templates

### Card Component (components/card.html)

```html
<div class="card p-4">
    <h3 class="text-lg font-semibold mb-2">{{ title }}</h3>
    <div class="card-content">
        {{ content|safe }}
    </div>
    {% if footer %}
    <div class="mt-4 pt-3 border-t">
        {{ footer|safe }}
    </div>
    {% endif %}
</div>
```

### Button Component (components/button.html)

```html
<button 
    class="btn {% if variant == 'primary' %}btn-primary{% elif variant == 'secondary' %}btn-secondary{% else %}{{ variant }}{% endif %}"
    {% if disabled %}disabled{% endif %}
    {% if id %}id="{{ id }}"{% endif %}
    {% if type %}type="{{ type }}"{% endif %}
    {% if onclick %}onclick="{{ onclick }}"{% endif %}
>
    {{ label }}
</button>
```

### Form Input Component (components/form_input.html)

```html
<div class="mb-4">
    <label for="{{ id }}" class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
    <input 
        type="{{ type|default('text') }}" 
        id="{{ id }}" 
        name="{{ name|default(id) }}" 
        class="form-input"
        {% if placeholder %}placeholder="{{ placeholder }}"{% endif %}
        {% if value %}value="{{ value }}"{% endif %}
        {% if required %}required{% endif %}
        {% if disabled %}disabled{% endif %}
        {% if pattern %}pattern="{{ pattern }}"{% endif %}
    >
    {% if help_text %}
    <p class="mt-1 text-sm text-gray-500">{{ help_text }}</p>
    {% endif %}
</div>
```

### Alert Component (components/alert.html)

```html
<div class="rounded-md p-4 mb-4 {% if type == 'success' %}bg-green-50 text-green-800 border border-green-200{% elif type == 'error' %}bg-red-50 text-red-800 border border-red-200{% elif type == 'warning' %}bg-yellow-50 text-yellow-800 border border-yellow-200{% else %}bg-blue-50 text-blue-800 border border-blue-200{% endif %}">
    <div class="flex">
        <div class="flex-shrink-0">
            {% if type == 'success' %}
            <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            {% elif type == 'error' %}
            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            {% elif type == 'warning' %}
            <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            {% else %}
            <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
            {% endif %}
        </div>
        <div class="ml-3">
            {% if title %}<h3 class="text-sm font-medium">{{ title }}</h3>{% endif %}
            <div class="text-sm">{{ message }}</div>
        </div>
    </div>
</div>
```

## Page Templates

### Home Page Template (index.html)

```html
{% extends "base.html" %}

{% block title %}Home - Plate Order System{% endblock %}

{% block meta_description %}Plate Order System - Voice-enabled ordering system for restaurants{% endblock %}

{% block content %}
<div class="bg-white shadow-md rounded-lg p-6">
    <h1 class="text-3xl font-bold mb-6">Welcome to Plate Order System</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div class="card p-6">
            <h2 class="text-xl font-semibold mb-3">Server View</h2>
            <p class="mb-4">Manage tables, take orders, and track customer information.</p>
            <a href="/floor-plan" class="btn btn-primary inline-block">Go to Floor Plan</a>
        </div>
        
        <div class="card p-6">
            <h2 class="text-xl font-semibold mb-3">Kitchen Display</h2>
            <p class="mb-4">View and manage incoming orders in real-time.</p>
            <a href="/kds" class="btn btn-primary inline-block">Go to Kitchen Display</a>
        </div>
        
        <div class="card p-6">
            <h2 class="text-xl font-semibold mb-3">Order Management</h2>
            <p class="mb-4">Track and manage all orders in the system.</p>
            <a href="/orders" class="btn btn-primary inline-block">Manage Orders</a>
        </div>
    </div>
    
    <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h2 class="text-xl font-semibold mb-3">System Status</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white p-4 rounded shadow">
                <h3 class="font-medium text-gray-700">Active Orders</h3>
                <p class="text-2xl font-bold">{{ active_orders|default('0') }}</p>
            </div>
            <div class="bg-white p-4 rounded shadow">
                <h3 class="font-medium text-gray-700">Tables Occupied</h3>
                <p class="text-2xl font-bold">{{ tables_occupied|default('0') }}/{{ total_tables|default('0') }}</p>
            </div>
            <div class="bg-white p-4 rounded shadow">
                <h3 class="font-medium text-gray-700">Server Status</h3>
                <p class="text-2xl font-bold text-green-600">Online</p>
            </div>
        </div>
    </div>
</div>
{% endblock %}
```

## Usage

To implement these templates:

1. Create the base template at `app/templates/base.html`
2. Create a components directory at `app/templates/components/`
3. Create the component templates in the components directory
4. Update the existing page templates to extend the base template

## Notes

- These templates use Tailwind CSS classes for styling
- The base template includes responsive design for mobile and desktop
- Component templates are designed to be reusable across different views
- Page templates extend the base template and override specific blocks