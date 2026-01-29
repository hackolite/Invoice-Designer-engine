# Drag and Drop & Component Selection Fix

## Problem Statement (French)
> "le drag and drop ne fonctionne pas bien ni la selection des composants"
> 
> Translation: "drag and drop doesn't work well nor the selection of components"

## Root Causes Identified

### 1. Triple Nested Event Handlers (Canvas.tsx)
**Problem:** The original code had THREE nested `onMouseDown` handlers:
- Line 231: On the `<Rnd>` component
- Line 239: On the inner `<div>` wrapper
- Line 251: On the overlay `<div>`

**Why this was bad:**
- Created race conditions where multiple handlers competed
- Event bubbling was inconsistent
- Made it unclear which handler should handle selection vs. dragging

### 2. Inconsistent Event Handling
**Problem:** Inconsistent use of `stopPropagation()` and `preventDefault()`
- `Rnd` component had both `stopPropagation()` and `preventDefault()`
- Inner div had only `stopPropagation()`
- Overlay div had only `stopPropagation()`

**Why this was bad:**
- The `preventDefault()` on line 233 could interfere with the drag library's native behavior
- Inconsistent stopping of propagation led to unpredictable selection behavior

### 3. Competing Overlay
**Problem:** The overlay div (lines 246-256) had pointer events enabled with its own mouse handler
```typescript
<div 
  className="absolute inset-0 z-30 cursor-move border-2"
  onMouseDown={(e) => {
    e.stopPropagation();
    onElementSelect(el.id);
  }}
/>
```

**Why this was bad:**
- The overlay was positioned above the actual element content (z-30)
- It captured all mouse events, preventing the react-rnd library from properly handling drags
- The overlay's mouse handler competed with the Rnd component's drag handler

### 4. Canvas Background Click Handler
**Problem:** The canvas used `onClick` instead of `onMouseDown` for deselection
```typescript
onClick={() => onElementSelect(null)} // Deselect when clicking background
```

**Why this was bad:**
- `onClick` fires after the full click cycle (mousedown + mouseup)
- This timing issue could interfere with element selection
- Clicking on canvas might deselect even when clicking on an element

### 5. Interfering Parent Handler (Editor.tsx)
**Problem:** The canvas wrapper div had a stopPropagation handler
```typescript
<div 
  className="shadow-2xl"
  onMouseDown={(e) => {
    e.stopPropagation();
  }}
>
```

**Why this was bad:**
- This prevented events from properly bubbling up or down
- Created an additional layer of event interference

## Solutions Implemented

### Fix 1: Single Event Handler Pattern
**Changed:** Removed all nested `onMouseDown` handlers, kept only ONE on the `<Rnd>` component

**New code:**
```typescript
<Rnd
  onMouseDown={(e) => {
    if (!isPreviewMode) {
      e.stopPropagation();
      onElementSelect(el.id);
    }
  }}
>
  <div className="w-full h-full relative pointer-events-none">
    {/* Content here - no mouse handlers */}
  </div>
</Rnd>
```

**Benefits:**
- Clear, single source of truth for element selection
- No competing handlers
- Drag and selection work together harmoniously

### Fix 2: Pointer Events None on Content
**Changed:** Made the inner div and overlay use `pointer-events-none`

**Reasoning:**
- Let the react-rnd library handle ALL mouse interactions
- Content doesn't need to capture events
- Overlay is purely visual feedback

### Fix 3: Removed preventDefault
**Changed:** Removed `preventDefault()` call that was interfering with drag behavior

**Reasoning:**
- The react-rnd library needs default browser behavior for dragging
- Preventing defaults can break the drag calculations

### Fix 4: Improved Canvas Background Deselection
**Changed:** Canvas background now uses `onMouseDown` with target check

**New code:**
```typescript
<div
  onMouseDown={(e) => {
    // Only deselect if clicking directly on the canvas background
    if (e.target === e.currentTarget) {
      onElementSelect(null);
    }
  }}
>
```

**Benefits:**
- More reliable: mousedown happens before drag starts
- Target check ensures we're really clicking on the background
- Won't accidentally deselect when clicking on child elements

### Fix 5: Removed Wrapper stopPropagation (Editor.tsx)
**Changed:** Removed the interfering handler from canvas wrapper

**Benefits:**
- Cleaner event flow
- No unnecessary event blocking

### Fix 6: Added cursor-move Class
**Changed:** Added `cursor-move` class to Rnd component

**Benefits:**
- Better UX: users see the move cursor when hovering
- Visual feedback that element is draggable

## Technical Details

### Event Flow (After Fix)
1. User clicks on element → `Rnd.onMouseDown` fires
2. Handler checks if not in preview mode
3. Calls `stopPropagation()` to prevent canvas background handler from firing
4. Calls `onElementSelect(el.id)` to select the element
5. react-rnd library handles drag start if user moves mouse

### Selection Flow (After Fix)
1. User clicks on canvas background → canvas `onMouseDown` fires
2. Handler checks `e.target === e.currentTarget` (true for background)
3. Calls `onElementSelect(null)` to deselect
4. No stopPropagation needed because there's nothing to bubble to

### Why This Works
- **Single Responsibility**: Each handler has ONE job
- **Clear Hierarchy**: Rnd handles element interaction, canvas handles background
- **No Competition**: Content and overlay don't capture events
- **Library Friendly**: Doesn't interfere with react-rnd's internal drag handling

## Testing Checklist

To verify the fixes work:

1. **Drag and Drop**
   - [ ] Can drag elements around the canvas
   - [ ] Elements snap to grid during drag
   - [ ] Can drag elements without them jumping or glitching
   - [ ] Drag handles (resize) work correctly

2. **Element Selection**
   - [ ] Clicking an element selects it (shows blue border)
   - [ ] Clicking canvas background deselects
   - [ ] Clicking between elements on canvas background deselects
   - [ ] Can click from one element to another to change selection

3. **Resize**
   - [ ] Can resize elements using corner/edge handles
   - [ ] Resize respects grid snapping
   - [ ] Selection persists during resize

4. **Preview Mode**
   - [ ] In preview mode, elements are not draggable
   - [ ] In preview mode, elements are not selectable
   - [ ] Switching between edit and preview mode works

5. **Multi-Element**
   - [ ] Can select different elements without issues
   - [ ] Selection state is correctly maintained
   - [ ] No phantom selections or stuck states

## Code Quality Improvements

### Before (Lines of Event Handling Code)
- 3 nested onMouseDown handlers
- ~15 lines of redundant event handling code
- Difficult to understand flow

### After
- 1 clean onMouseDown handler on Rnd
- 1 clean onMouseDown handler on canvas
- ~8 lines of clear event handling code
- Easy to understand and maintain

## Additional Notes

### CSS Classes Used
- `element-selected`: Applied when element is selected (defined in index.css)
- `element-hovered`: Applied on hover when not selected
- `cursor-move`: Shows move cursor on hover
- `pointer-events-none`: Prevents element from capturing mouse events

### react-rnd Props Used
- `onDragStop`: Callback when drag ends
- `onResizeStop`: Callback when resize ends
- `disableDragging`: Disable dragging in preview mode
- `enableResizing`: Disable resizing in preview mode
- `dragGrid` & `resizeGrid`: Grid snapping

### Why react-rnd Works Now
The library uses its own internal mouse event handlers. By removing competing handlers and letting content be `pointer-events-none`, we allow react-rnd to have full control of the drag interaction while still capturing selection clicks at the Rnd component level (before drag starts).
