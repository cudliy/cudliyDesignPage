# Dark Mode Quick Reference

## 🎨 Using Dark Mode in Your Components

### Basic Pattern
```tsx
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
  Your content
</div>
```

### Common Color Combinations

#### Backgrounds
```tsx
// Main backgrounds
bg-white dark:bg-slate-900

// Secondary backgrounds
bg-gray-50 dark:bg-slate-800
bg-gray-100 dark:bg-slate-700

// Card backgrounds
bg-white dark:bg-slate-800
```

#### Text
```tsx
// Primary text
text-black dark:text-white
text-gray-900 dark:text-slate-100

// Secondary text
text-gray-700 dark:text-slate-300
text-gray-600 dark:text-slate-400

// Tertiary text
text-gray-500 dark:text-slate-500
```

#### Borders
```tsx
// Standard borders
border-gray-200 dark:border-slate-700
border-gray-300 dark:border-slate-600

// Subtle borders
border-gray-100 dark:border-slate-800
```

#### Accent Colors
```tsx
// Brand colors
text-[#E70A55] dark:text-[#FA7072]
bg-[#E70A55] dark:bg-[#FA7072]
```

### Interactive Elements

#### Buttons
```tsx
<button className="
  bg-black dark:bg-slate-800 
  text-white 
  hover:bg-gray-800 dark:hover:bg-slate-700
  transition-colors duration-300
">
  Click me
</button>
```

#### Input Fields
```tsx
<input className="
  bg-white dark:bg-slate-800 
  text-black dark:text-white 
  border-gray-300 dark:border-slate-600
  focus:border-black dark:focus:border-slate-400
  placeholder-gray-400 dark:placeholder-slate-500
  transition-colors duration-300
" />
```

#### Links
```tsx
<a className="
  text-[#E70A55] dark:text-[#FA7072] 
  hover:underline 
  transition-colors duration-300
">
  Link text
</a>
```

## 🔧 Adding Dark Mode Toggle

### Import
```tsx
import DarkModeToggle from '@/components/DarkModeToggle';
```

### Usage
```tsx
// Small (mobile)
<DarkModeToggle size="sm" />

// Medium (default)
<DarkModeToggle size="md" />

// Large
<DarkModeToggle size="lg" />
```

## 🎯 Using Theme Context

### Import
```tsx
import { useTheme } from '@/contexts/ThemeContext';
```

### Usage
```tsx
function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle</button>
      <button onClick={() => setTheme('dark')}>Force Dark</button>
      <button onClick={() => setTheme('light')}>Force Light</button>
    </div>
  );
}
```

## ⚡ Best Practices

### Always Add Transitions
```tsx
className="... transition-colors duration-300"
```

### Group Related Classes
```tsx
// Good
className="bg-white dark:bg-slate-900 text-black dark:text-white transition-colors"

// Avoid
className="bg-white text-black dark:bg-slate-900 dark:text-white transition-colors"
```

### Use Consistent Color Palette
Stick to the defined color scheme:
- Light backgrounds: `white`, `gray-50`, `gray-100`
- Dark backgrounds: `slate-900`, `slate-800`, `slate-700`
- Light text: `black`, `gray-700`, `gray-600`
- Dark text: `white`, `slate-200`, `slate-400`

### Test Both Modes
Always test your component in both light and dark modes to ensure:
- Text is readable
- Borders are visible
- Hover states work
- Focus states are clear

## 🐛 Troubleshooting

### Theme Not Persisting
- Check localStorage in DevTools
- Verify ThemeProvider wraps your app
- Check for conflicting CSS

### Flash of Wrong Theme
- Ensure script in `index.html` is present
- Check script runs before React loads

### Colors Not Changing
- Verify `dark:` prefix is used
- Check Tailwind config has `darkMode: "class"`
- Ensure HTML element has `dark` class

### Transitions Too Slow/Fast
Adjust duration:
```tsx
transition-colors duration-150  // Fast
transition-colors duration-300  // Default
transition-colors duration-500  // Slow
```

## 📱 Mobile Considerations

- Use `DarkModeToggle size="sm"` for mobile headers
- Ensure toggle is easily accessible
- Test on actual devices
- Check meta theme-color updates correctly

## 🎨 Custom Colors

If you need custom colors for dark mode:

```tsx
// Define in Tailwind config or use arbitrary values
className="bg-[#custom] dark:bg-[#custom-dark]"
```

## ✅ Checklist for New Components

- [ ] Add dark mode classes to all backgrounds
- [ ] Add dark mode classes to all text
- [ ] Add dark mode classes to all borders
- [ ] Add transition-colors duration-300
- [ ] Test in both light and dark modes
- [ ] Check hover states
- [ ] Check focus states
- [ ] Verify on mobile
