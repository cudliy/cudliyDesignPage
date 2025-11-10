# Dark Mode Implementation Guide

## Overview
A beautiful dark mode has been implemented across the Cudliy application with smooth transitions and a toggle in the dashboard drawer.

## Features
- 🌓 System preference detection (auto-detects user's OS theme preference)
- 💾 Persistent theme selection (saved in localStorage)
- 🎨 Beautiful color palette optimized for both light and dark modes
- ⚡ Smooth transitions between themes
- 🎯 Toggle conveniently located in the dashboard mobile menu drawer

## Theme Colors

### Light Mode
- Primary Background: `#ffffff`
- Secondary Background: `#f9fafb`
- Tertiary Background: `#f3f4f6`
- Primary Text: `#212121`
- Secondary Text: `#6b7280`
- Tertiary Text: `#9ca3af`
- Primary Border: `#e5e7eb`
- Secondary Border: `#d1d5db`

### Dark Mode
- Primary Background: `#0f172a` (slate-900)
- Secondary Background: `#1e293b` (slate-800)
- Tertiary Background: `#334155` (slate-700)
- Primary Text: `#f1f5f9` (slate-100)
- Secondary Text: `#cbd5e1` (slate-300)
- Tertiary Text: `#94a3b8` (slate-400)
- Primary Border: `#334155` (slate-700)
- Secondary Border: `#475569` (slate-600)

### Accent Colors (Same for both modes)
- Primary Accent: `#FF9CB5`
- Secondary Accent: `#FA7072`

## Usage

### Using the Theme Hook
```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### Applying Dark Mode Classes
Use Tailwind's `dark:` prefix for dark mode styles:

```tsx
<div className="bg-white dark:bg-dark-bg-primary text-black dark:text-dark-text-primary">
  Content
</div>
```

### Common Patterns

#### Background Colors
```tsx
// Primary background
className="bg-white dark:bg-dark-bg-primary"

// Secondary background (cards, panels)
className="bg-gray-50 dark:bg-dark-bg-secondary"

// Tertiary background (hover states, subtle elements)
className="bg-gray-100 dark:bg-dark-bg-tertiary"
```

#### Text Colors
```tsx
// Primary text
className="text-[#212121] dark:text-dark-text-primary"

// Secondary text (less emphasis)
className="text-gray-600 dark:text-dark-text-secondary"

// Tertiary text (muted)
className="text-gray-400 dark:text-dark-text-tertiary"
```

#### Borders
```tsx
// Primary borders
className="border-gray-200 dark:border-dark-border-primary"

// Secondary borders
className="border-gray-300 dark:border-dark-border-secondary"
```

#### Buttons
```tsx
// Primary button
className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"

// Secondary button
className="bg-gray-100 dark:bg-dark-bg-tertiary text-black dark:text-dark-text-primary hover:bg-gray-200 dark:hover:bg-dark-bg-primary"
```

## Toggle Location
The dark mode toggle is located in the **Dashboard mobile menu drawer**:
1. Open the dashboard
2. Click the hamburger menu (☰) in the top-left
3. The toggle is at the top of the drawer menu
4. Click to switch between light and dark modes

## Transition Effects
All theme transitions use:
```css
transition-colors duration-300
```

This provides smooth 300ms color transitions when switching themes.

## Files Modified
1. `src/contexts/ThemeContext.tsx` - Theme context and provider
2. `src/App.tsx` - Wrapped app with ThemeProvider
3. `src/pages/Dashboard.tsx` - Added toggle and dark mode classes
4. `src/index.css` - Added CSS variables for dark mode
5. `tailwind.config.js` - Added dark mode colors

## Browser Support
- Modern browsers with CSS custom properties support
- Fallback to light mode for older browsers
- System preference detection via `prefers-color-scheme`

## Future Enhancements
- Add dark mode to all pages (DesignPage, PricingPage, etc.)
- Add dark mode to all components
- Consider adding more theme options (auto, light, dark, custom)
- Add theme transition animations
- Add per-page theme preferences
