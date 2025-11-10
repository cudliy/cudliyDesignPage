# Dark Mode Testing Guide

## Quick Test Steps

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Navigate to Dashboard**
   - Go to `/dashboard` in your browser
   - You should see the dashboard interface

3. **Open the Mobile Menu**
   - Click the hamburger menu (☰) in the top-left corner
   - The drawer should slide out from the left

4. **Find the Dark Mode Toggle**
   - At the very top of the drawer menu
   - You should see: "🌙 Dark Mode [○──]"

5. **Toggle Dark Mode**
   - Click the toggle switch
   - The entire interface should smoothly transition to dark colors
   - The toggle should now show: "☀️ Light Mode [──○]"

## What Should Change

### When Dark Mode is ON:
- **Background**: White → Dark Slate Blue (#0f172a)
- **Menu Drawer**: White → Slate Gray (#1e293b)
- **Text**: Black → Light Gray (#f1f5f9)
- **Borders**: Light Gray → Dark Slate (#334155)
- **Buttons**: Inverted colors

### Visual Indicators:
- Toggle switch moves from left to right
- Switch background changes to pink (#FF9CB5)
- Icon changes from moon to sun
- All text becomes light colored
- All backgrounds become dark

## Troubleshooting

### Toggle not visible?
1. Make sure you're on the Dashboard page (`/dashboard`)
2. Click the hamburger menu (☰)
3. Scroll to the very top of the drawer

### Theme not changing?
1. Open browser console (F12)
2. Check for any errors
3. Verify `localStorage` is enabled
4. Try clearing browser cache

### Colors not applying?
1. Check if Tailwind CSS is loaded
2. Verify the `dark` class is being added to `<html>` element
3. Inspect element to see if dark mode classes are present

## Browser Console Test

Open browser console and run:
```javascript
// Check if theme context is working
console.log('HTML classes:', document.documentElement.classList);

// Manually toggle theme
document.documentElement.classList.toggle('dark');

// Check localStorage
console.log('Stored theme:', localStorage.getItem('theme'));
```

## Expected Console Output

When you toggle dark mode, you should see:
- HTML element gets `class="dark"` added
- localStorage gets updated with `theme: "dark"`
- No errors in console

## Manual Testing Checklist

- [ ] Toggle appears in drawer menu
- [ ] Toggle switches smoothly
- [ ] Background colors change
- [ ] Text colors change
- [ ] Border colors change
- [ ] Button colors invert
- [ ] Theme persists on page refresh
- [ ] Theme persists across tabs
- [ ] Smooth transitions (300ms)
- [ ] No console errors

## Known Issues

If dark mode isn't working:

1. **Tailwind v4 Configuration**: Make sure `darkMode: ["class"]` is in `tailwind.config.js`
2. **CSS Import**: Verify `@import "tailwindcss"` is in `src/index.css`
3. **Theme Provider**: Check that `<ThemeProvider>` wraps the app in `src/App.tsx`
4. **HTML Class**: The `dark` class must be added to the `<html>` element, not `<body>`

## Success Criteria

✅ Dark mode toggle is visible in drawer
✅ Clicking toggle changes theme instantly
✅ All UI elements adapt to dark theme
✅ Theme choice persists after refresh
✅ Smooth color transitions
✅ No console errors
✅ Works across all dashboard views

---

**If all tests pass, dark mode is working correctly! 🎉**
