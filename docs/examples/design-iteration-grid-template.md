# Design Iteration Comparison Template

This template demonstrates how to use the grid layout classes for comparing design iterations.

## Basic Side-by-Side Comparison (Before/After)

<div className="iterations-comparison">
  <h3 className="comparison-heading">Component Redesign Comparison</h3>
  
  <div className="before-after-grid">
    <!-- Before Image -->
    <div className="iteration-image-container">
      <div className="iteration-label before-label">Before</div>
      <img className="iteration-image" src="/jods/path/to/before-image.png" alt="Before design" />
    </div>
    
    <!-- After Image -->
    <div className="iteration-image-container">
      <div className="iteration-label after-label">After</div>
      <img className="iteration-image" src="/jods/path/to/after-image.png" alt="After design" />
    </div>
  </div>
</div>

## 2x2 Grid with Light/Dark Variants

<div className="iterations-comparison">
  <h3 className="comparison-heading">Light and Dark Mode Comparison</h3>
  
  <div className="iterations-grid">
    <!-- Light Mode Before -->
    <div className="iteration-image-container">
      <div className="iteration-label light-theme-label">Light Mode (Before)</div>
      <img className="iteration-image" src="/jods/path/to/light-before.png" alt="Light mode before" />
    </div>
    
    <!-- Light Mode After -->
    <div className="iteration-image-container">
      <div className="iteration-label light-theme-label">Light Mode (After)</div>
      <img className="iteration-image" src="/jods/path/to/light-after.png" alt="Light mode after" />
    </div>
    
    <!-- Dark Mode Before -->
    <div className="iteration-image-container">
      <div className="iteration-label dark-theme-label">Dark Mode (Before)</div>
      <img className="iteration-image" src="/jods/path/to/dark-before.png" alt="Dark mode before" />
    </div>
    
    <!-- Dark Mode After -->
    <div className="iteration-image-container">
      <div className="iteration-label dark-theme-label">Dark Mode (After)</div>
      <img className="iteration-image" src="/jods/path/to/dark-after.png" alt="Dark mode after" />
    </div>
  </div>
</div>

## Custom Label Examples

<div className="iterations-comparison">
  <h3 className="comparison-heading">Design Evolution Stages</h3>
  
  <div className="iterations-grid">
    <!-- Iteration 1 -->
    <div className="iteration-image-container">
      <div className="iteration-label">Iteration 1</div>
      <img className="iteration-image" src="/jods/path/to/iteration1.png" alt="Iteration 1" />
    </div>
    
    <!-- Iteration 2 -->
    <div className="iteration-image-container">
      <div className="iteration-label">Iteration 2</div>
      <img className="iteration-image" src="/jods/path/to/iteration2.png" alt="Iteration 2" />
    </div>
    
    <!-- Iteration 3 -->
    <div className="iteration-image-container">
      <div className="iteration-label">Iteration 3</div>
      <img className="iteration-image" src="/jods/path/to/iteration3.png" alt="Iteration 3" />
    </div>
    
    <!-- Final Design -->
    <div className="iteration-image-container">
      <div className="iteration-label">Final Design</div>
      <img className="iteration-image" src="/jods/path/to/final.png" alt="Final design" />
    </div>
  </div>
</div>

## Tips for Using This Template

1. Replace the `src` paths with your actual image paths.
2. Make sure all paths begin with `/jods/` to work correctly with your GitHub Pages setup.
3. You can use any combination of grid layouts:
   - `before-after-grid` for a simple 2-column layout
   - `iterations-grid` for a responsive grid layout (2x2 on large screens, single column on mobile)
4. Customize labels with provided classes:
   - `before-label` / `after-label` - For before/after comparisons
   - `light-theme-label` / `dark-theme-label` - For theme-specific styling
   - Default styling for iteration numbers or other custom labels

The grid will automatically adjust to a single column layout on smaller screens for better mobile viewing.
