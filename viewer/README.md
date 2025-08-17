# Pensieve Viewer

A JavaScript-based viewer for Pensieve notes that can be dropped into any HTML page.

## Features

- **Schema-aware rendering**: Automatically loads and applies schema-defined styling
- **YAML frontmatter parsing**: Extracts metadata from note headers with deterministic CSS classes
- **Vanilla markdown conversion**: Converts markdown to clean HTML without extra classes
- **Type-specific frontmatter**: Different frontmatter fields for different note types (recipes, etc.)
- **Responsive design**: Works on desktop and mobile
- **Dark mode support**: Automatically adapts to system preferences
- **Development mode**: Local schema loading for development

## HTML Structure

The viewer generates predictable HTML structure:

### Frontmatter Structure
```html
<div class="pensieve-note pensieve-recipe">
  <header class="pensieve-frontmatter">
    <h1 class="pensieve-title">Recipe Title</h1>
    <div class="pensieve-date">2025-08-16</div>
    <ul class="pensieve-tags">
      <li class="pensieve-tag">dessert</li>
      <li class="pensieve-tag">cake</li>
    </ul>
    <!-- Recipe-specific fields -->
    <div class="pensieve-recipe-servings">12 servings</div>
    <div class="pensieve-recipe-prep_time">15 min</div>
    <div class="pensieve-recipe-cook_time">30 min</div>
    <div class="pensieve-recipe-source">https://example.com</div>
  </header>
  
  <main class="pensieve-content">
    <!-- Vanilla HTML from markdown -->
    <h2>Ingredients</h2>
    <ul>
      <li>3 large eggs</li>
      <li>200 g sugar</li>
    </ul>
    <h2>Directions</h2>
    <ol>
      <li>Preheat oven to 170°C</li>
      <li>Mix ingredients</li>
    </ol>
  </main>
</div>
```

### CSS Classes

**Container Classes:**
- `.pensieve-note` - Main container
- `.pensieve-{type}` - Type-specific class (e.g., `.pensieve-recipe`)

**Frontmatter Classes:**
- `.pensieve-frontmatter` - Frontmatter container
- `.pensieve-title` - Note title
- `.pensieve-date` - Date field
- `.pensieve-tags` - Tags container (ul)
- `.pensieve-tag` - Individual tag (li)
- `.pensieve-{type}-{field}` - Type-specific fields (e.g., `.pensieve-recipe-servings`)

**Content Classes:**
- `.pensieve-content` - Main content container
- Markdown generates vanilla HTML (`<h2>`, `<p>`, `<ul>`, `<li>`, etc.) without extra classes

## Usage

1. Include the CSS and JS files in your HTML:
```html
<link rel="stylesheet" href="pensieve-styles.css">
<script src="pensieve.js"></script>
```

2. Add your Pensieve note content in a div with id="pensieve":
```html
<div id="pensieve">
---
type: recipe
pensive_schema: https://raw.githubusercontent.com/YourOrg/pensieve/main/schema/recipe/0.1.0
title: My Recipe
date: 2025-08-16
tags: [dessert, cake]
servings: 12
prep_time: 15 min
---

## Ingredients
- Item 1
- Item 2

## Directions
1. Step 1
2. Step 2
</div>
```

3. The viewer will automatically initialize when the page loads.

## Development Mode

For local development, the viewer automatically replaces GitHub URLs with local ones:
- `https://raw.githubusercontent.com/LobsterMan/pensieve/main/schema/recipe/0.1.0` 
- becomes `http://localhost:8080/schema/recipe/0.1.0`

This allows you to modify schemas locally and test immediately.

## Current Limitations

- Simple YAML parser (doesn't handle all YAML features)
- Basic markdown parsing (no complex formatting like bold, italic, code blocks)
- CORS restrictions may prevent loading external schemas in production

## Development

Run a local server to test:
```bash
python3 -m http.server 8080
```

Then open http://localhost:8080 in your browser.

## Supported Note Types

### Recipe Type
Recipe notes have special frontmatter fields that get rendered with type-specific classes:
- `servings` → `.pensieve-recipe-servings`
- `prep_time` → `.pensieve-recipe-prep_time` 
- `cook_time` → `.pensieve-recipe-cook_time`
- `total_time` → `.pensieve-recipe-total_time`
- `source` → `.pensieve-recipe-source`
