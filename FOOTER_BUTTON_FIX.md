# Price Table Footer Button Visibility Fix

## Problem

On price tables, the border and width controls were visible in the inline toolbar, but the footer add and remove buttons were not clickable/accessible.

## Root Cause

The issue was related to CSS `pointer-events` cascade behavior:

1. **Parent Container** (line 1921 in Canvas.tsx):
   ```jsx
   <div className="w-full h-full relative pointer-events-none">
   ```
   This container has `pointer-events-none` to prevent the table content from interfering with selection.

2. **Toolbar** (line 1934 in Canvas.tsx):
   ```jsx
   <div className="... pointer-events-auto z-40" ...>
   ```
   The toolbar has `pointer-events-auto` to restore pointer events.

3. **Footer Buttons** (lines 1977-2005 in Canvas.tsx):
   The footer add and remove buttons did NOT explicitly have `pointer-events-auto`.

### Why This Mattered

While `pointer-events-auto` on a parent should restore pointer events for all descendants, there can be edge cases in browser implementations or CSS cascade behavior where child elements might not properly inherit the restored pointer events, especially when:
- Multiple nested levels exist
- The grandparent has `pointer-events-none`
- Complex flex layouts are involved

The border color input, width input, and Clone button were working because:
- They were direct children of the toolbar with `pointer-events-auto`
- Input elements and some button variants might handle pointer events differently

## Solution

Added explicit `pointer-events-auto` class to both footer buttons:

1. **Add Footer Button** (line 1980):
   ```jsx
   className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10 pointer-events-auto"
   ```

2. **Remove Footer Button** (line 1994):
   ```jsx
   className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 pointer-events-auto"
   ```

## Technical Details

### CSS `pointer-events` Behavior

- `pointer-events: none` - Element cannot be the target of pointer events
- `pointer-events: auto` - Element can receive pointer events (default behavior)

### Cascade Rules

When you have:
```
grandparent: pointer-events-none
  parent: pointer-events-auto
    child: (no pointer-events specified)
```

The child SHOULD inherit `auto` from its parent, but explicitly setting it ensures consistent behavior across:
- Different browsers
- Different CSS frameworks (Tailwind in this case)
- Complex nested structures

## Files Changed

- `client/src/components/Canvas.tsx`:
  - Line 1980: Added `pointer-events-auto` to "Add Footer" button className
  - Line 1994: Added `pointer-events-auto` to "Remove Footer" button className

## Testing

1. Build succeeded without errors
2. The buttons should now be:
   - Visible in the inline toolbar when a price table is selected
   - Clickable and functional
   - Positioned correctly after the "px" text in the width control

## Related Code

The footer button functionality was already implemented:
- `handleAddFooter()` function (line 443)
- `handleRemoveLastFooter()` function (line 458)
- Buttons conditionally rendered for `tableType === 'price'` (line 1975)

The issue was purely CSS-related pointer-events accessibility, not a logic or visibility bug.
