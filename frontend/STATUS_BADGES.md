# Status Badge System

This document describes the new status badge system implemented in the CampusTrack application.

## Overview

The status badge system provides consistent, visually appealing badges for displaying status information throughout the application. All badges feature:

- Pill-shaped design with rounded corners
- Smooth hover transitions with subtle animations
- Consistent padding and typography
- Dark mode support
- Reusable CSS classes

## Available Badge Types

### User/Item Activation Status
- **Active** (`status-badge active`): Blue gradient background with white text
- **Inactive** (`status-badge inactive`): Gray background with light gray text

### Item Status
- **Lost** (`status-badge lost`): Red gradient background
- **Found** (`status-badge found`): Green gradient background  
- **Claimed** (`status-badge claimed`): Orange gradient background
- **Returned** (`status-badge returned`): Purple gradient background

## Usage

### Basic Usage
```jsx
<span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
  {isActive ? "Active" : "Inactive"}
</span>
```

### Item Status Usage
```jsx
<span className={`status-badge ${item.status?.toLowerCase()}`}>
  {item.status}
</span>
```

## CSS Classes

### Base Class
- `.status-badge`: Base styling for all status badges

### Modifier Classes
- `.status-badge.active`: For active status
- `.status-badge.inactive`: For inactive status
- `.status-badge.lost`: For lost items
- `.status-badge.found`: For found items
- `.status-badge.claimed`: For claimed items
- `.status-badge.returned`: For returned items

## Features

### Hover Effects
All badges have smooth hover transitions that:
- Slightly lift the badge (translateY(-1px))
- Enhance the shadow effect
- Darken the background color

### Dark Mode Support
All badges automatically adapt to dark mode with appropriate color adjustments.

### Accessibility
- Proper contrast ratios for text readability
- Cursor styling for interactive elements
- User-select disabled to prevent text selection

## Implementation Locations

The status badge system is currently implemented in:

1. **AdminDashboard.jsx**
   - User status badges (Active/Inactive)
   - Item status badges (Active/Inactive)
   - Category status badges (Active/Inactive)

2. **ItemDetails.jsx**
   - Item status display

3. **ItemCard.jsx**
   - Item status in card view

4. **UserDashboard.jsx**
   - Item status in user's item list

## Customization

To add new status badge types:

1. Add new CSS classes in `src/index.css`
2. Follow the naming convention: `.status-badge.{status-name}`
3. Include both light and dark mode variants
4. Add hover effects for consistency

Example:
```css
.status-badge.pending {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(251, 191, 36, 0.3);
}

.status-badge.pending:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.dark .status-badge.pending {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  box-shadow: 0 2px 4px rgba(251, 191, 36, 0.3);
}

.dark .status-badge.pending:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}
``` 