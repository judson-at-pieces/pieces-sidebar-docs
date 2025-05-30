# CSS Architecture Guide

## Overview

Our CSS architecture is built on a solid foundation of design tokens, utility classes, and component-specific styles. This approach ensures consistency, maintainability, and scalability across the entire documentation system.

## Architecture Layers

### 1. Design Tokens (`design-tokens.css`)
The foundation of our design system. All visual decisions flow from these tokens.

```css
/* Example usage */
.custom-component {
  padding: var(--space-4);
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  border-radius: var(--radius-lg);
  transition-duration: var(--duration-300);
}
```

### 2. Utility Classes (`utilities.css`)
Pre-built classes for common patterns. Use these for rapid prototyping and consistent spacing.

```html
<!-- Example usage -->
<div class="flex items-center gap-4 p-6 rounded-lg shadow-md">
  <h2 class="text-2xl font-bold text-primary">Title</h2>
  <p class="text-sm text-muted">Description</p>
</div>
```

### 3. Component Styles
Three approaches for component styling:

#### a) CSS Modules (Recommended for complex components)
```css
/* Card.module.css */
.card {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background-color: var(--color-card);
}
```

```tsx
import styles from './Card.module.css';

export function Card() {
  return <div className={styles.card}>...</div>;
}
```

#### b) Tailwind Classes (For simple components)
```tsx
export function SimpleCard() {
  return (
    <div className="p-6 rounded-lg bg-card border border-border">
      ...
    </div>
  );
}
```

#### c) Inline Styles with Design Tokens
```tsx
export function DynamicComponent({ spacing }) {
  return (
    <div style={{ 
      padding: `var(--space-${spacing})`,
      color: 'var(--color-foreground)'
    }}>
      ...
    </div>
  );
}
```

## Design Token Categories

### Colors
- **Brand Colors**: Primary palette from 50-950
- **Semantic Colors**: success, warning, error, info
- **Theme Colors**: Automatically adjust for light/dark mode

### Typography
- **Font Sizes**: Perfect Fourth scale (1.333 ratio)
- **Font Weights**: thin to extrabold
- **Line Heights**: tight to loose
- **Letter Spacing**: tighter to widest

### Spacing
- **Scale**: 0 to 32 (0rem to 8rem)
- **Consistent**: All spacing follows the same scale

### Animation
- **Durations**: 75ms to 1000ms
- **Easing**: Standard easing functions
- **Transitions**: Pre-defined for common properties

## Best Practices

### 1. Use Design Tokens First
```css
/* ✅ Good */
.component {
  margin: var(--space-4);
  color: var(--color-primary);
}

/* ❌ Avoid */
.component {
  margin: 16px;
  color: #222;
}
```

### 2. Leverage Utility Classes
```html
<!-- ✅ Good: Use utilities for common patterns -->
<div class="flex items-center gap-4">

<!-- ❌ Avoid: Writing custom CSS for common layouts -->
<div style="display: flex; align-items: center; gap: 1rem;">
```

### 3. Component Isolation
```css
/* ✅ Good: Scoped styles */
.card-module_title__x7j2 {
  /* CSS Module auto-generated class */
}

/* ❌ Avoid: Global unscoped classes */
.title {
  /* Can conflict with other components */
}
```

### 4. Responsive Design
```html
<!-- ✅ Good: Mobile-first responsive -->
<h1 class="text-2xl md:text-3xl lg:text-4xl">

<!-- ❌ Avoid: Desktop-only sizing -->
<h1 class="text-4xl">
```

### 5. Theme Awareness
```css
/* ✅ Good: Automatically adapts to theme */
.component {
  background: var(--color-background);
  color: var(--color-foreground);
}

/* ❌ Avoid: Hard-coded colors */
.component {
  background: white;
  color: black;
}
```

## Migration Guide

### Converting existing styles to use design tokens:

1. **Colors**
   ```css
   /* Before */
   color: #1a1a1a;
   
   /* After */
   color: var(--color-foreground);
   ```

2. **Spacing**
   ```css
   /* Before */
   padding: 24px;
   margin-bottom: 16px;
   
   /* After */
   padding: var(--space-6);
   margin-bottom: var(--space-4);
   ```

3. **Typography**
   ```css
   /* Before */
   font-size: 18px;
   line-height: 1.5;
   
   /* After */
   font-size: var(--font-size-lg);
   line-height: var(--line-height-normal);
   ```

## Benefits

1. **Consistency**: All components use the same visual language
2. **Maintainability**: Change tokens in one place, update everywhere
3. **Theme Support**: Automatic dark/light mode switching
4. **Performance**: Utility classes reduce CSS bundle size
5. **Developer Experience**: Predictable patterns and clear naming
6. **Accessibility**: Consistent focus states and color contrasts

## Tools & Extensions

- **VS Code**: Install CSS Variable Autocomplete for token suggestions
- **Browser DevTools**: Use CSS custom property inspector
- **PostCSS**: Automatically process and optimize CSS

## Future Enhancements

1. **CSS-in-JS Migration**: Consider emotion or styled-components for dynamic styling
2. **Design Token API**: Programmatic access to tokens in JavaScript
3. **Component Library**: Pre-built components using the design system
4. **Visual Regression Testing**: Ensure styles don't break across updates