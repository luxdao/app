# Tenant Theming System

This directory contains tenant-specific theme overrides for the Pars DAO platform.

## How It Works

1. Each tenant gets a CSS file named `{tenant}.css`
2. The file contains CSS variable overrides only
3. Tenants can customize colors but NOT component structure
4. Runtime selects the tenant file based on environment or hostname

## Creating a New Tenant Theme

1. Copy `lux.css` as a template
2. Name it `{tenant}.css`
3. Override only the CSS variables you need
4. Add tenant logo as `{tenant}-logo.svg` if needed

## Available Variables

```css
/* Core colors */
--background
--foreground

/* Surface colors */
--card
--card-foreground
--popover
--popover-foreground

/* Action colors */
--primary
--primary-foreground
--secondary
--secondary-foreground

/* State colors */
--muted
--muted-foreground
--accent
--accent-foreground

/* Semantic colors */
--destructive
--destructive-foreground
--success
--success-foreground
--warning
--warning-foreground

/* UI elements */
--border
--input
--ring
--radius
```

## Rules

- **DO**: Override CSS variables
- **DO**: Use grayscale or near-monochrome colors
- **DO**: Provide logo.svg and favicon if needed
- **DON'T**: Change component structure
- **DON'T**: Add custom CSS classes
- **DON'T**: Use non-token colors
