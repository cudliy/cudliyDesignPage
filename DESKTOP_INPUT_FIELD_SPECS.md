# Desktop Input Field Specifications

## ✅ Updated to Match Mobile Chat Style

### **Container Specifications:**
```css
background: #515151 (dark gray)
height: 100px
border-radius: 25px
width: 100% (full width)
position: relative
```

### **Input Field:**
```css
placeholder: "Ask Cudliy"
padding-top: 12px (pt-3)
padding-bottom: 40px (pb-10)
padding-left: 24px (pl-6)
padding-right: 80px (pr-20)
background: transparent
text-color: white
placeholder-color: #9CA3AF (gray-400)
border: none
font-size: 14px (text-sm)
border-radius: 25px
```

### **Up Arrow Button (Top Right):**
```css
position: absolute
right: 16px (right-4)
top: 16px (top-4)
width: 40px (w-10)
height: 40px (h-10)
border-radius: 50% (rounded-full)

States:
- Empty/Disabled: background: white, icon: gray-400
- Active: background: #313131, icon: white
```

### **Bottom Icons Row:**
```css
position: absolute
bottom: 16px (bottom-4)
left: 0
right: 0
padding: 0 16px (px-4)
display: flex
justify-content: space-between
```

#### **Plus Button (Left):**
```css
width: 28px (w-7)
height: 28px (h-7)
color: #D1D5DB (gray-300)
hover: white
```

#### **Right Icons:**
```css
display: flex
gap: 4px (gap-1)

Icons:
1. Model Dropdown (3D cube icon)
2. Advanced Settings (sliders icon)

Each icon:
- width: 28px (w-7)
- height: 28px (h-7)
- color: gray-300 (default)
- color: white (when active)
```

## **Desktop Specifications:**

| Property | Value |
|----------|-------|
| Background | #515151 (dark gray) |
| Height | 100px |
| Border Radius | 25px |
| Placeholder | "Ask Cudliy" |
| Text Color | White |
| Icon Color | Gray-300 (default), White (active) |
| Up Arrow Position | Top Right |
| Bottom Icons | Inside Field |
| Icon Layout | Plus (left), 3D Box + Settings (right) |

## **Model Dropdown - Professional & Elegant:**

| Property | Value |
|----------|-------|
| Width | 220px |
| Background | #2A2A2A (dark) |
| Border Radius | 12px |
| Shadow | Multi-layer with border glow |
| Header | "Model Quality" with border |
| Options | Fast, Medium, High with descriptions |
| Selected State | Pink accent (#E70D57) |
| Hover State | Subtle white overlay |
| Footer | Current selection indicator |
| Icon | 3D Box (cube with perspective) |

## **File Location:**
`src/pages/DesignPage.tsx` (lines ~923-995)

## **Key Features:**
1. ✅ Light gray background (#E5E5EA) - not dark
2. ✅ 118px height - not 100px
3. ✅ 32px border radius - not 25px
4. ✅ Icons positioned inside the field at the bottom
5. ✅ Up arrow button changes color based on input state
6. ✅ Clean, minimal design matching mobile exactly

## **Notes:**
- Background color: #515151 (dark gray) ✅
- Height: 100px ✅
- Border radius: 25px ✅
- Text color: White (for dark background)
- Icon colors: Gray-300/White (for dark background)
- 3D Box icon for model selector ✅
- Professional dropdown with header, descriptions, and footer ✅
- Smooth animations and elegant hover states ✅
- All styling is inline or via Tailwind classes
- No conflicting CSS found