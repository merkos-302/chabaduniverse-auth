# Valu Authentication UI Components

This document provides comprehensive documentation for the three essential Valu authentication UI components created for the Chabad Universe Portal.

## Overview

The Valu authentication components integrate with the `useValuAuth` hook to provide a complete authentication experience for Valu Social integration. These components follow Apple-inspired design principles with clean, minimal aesthetics and are built using shadcn/ui components.

## Components

### 1. ValuAuthGuard

**File:** `/components/valu/ValuAuthGuard.jsx`

A route protection component that restricts access to authenticated users with optional role-based access control.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | - | Child components to render when authenticated |
| `requiredRoles` | string[] | `[]` | Required roles for access (optional) |
| `fallback` | ReactNode | - | Custom fallback component for unauthenticated users |
| `loadingComponent` | ReactNode | - | Custom loading component |
| `className` | string | - | Additional CSS classes |
| `showDetails` | boolean | `false` | Show detailed authentication status |
| `redirectTo` | string | - | Redirect path for unauthenticated users |

#### Features

- **Loading States**: Shows skeleton loading animation while checking authentication
- **Role-Based Access**: Supports granular role requirements
- **Error Handling**: Graceful error display with user-friendly messages
- **Customizable Fallbacks**: Support for custom unauthenticated and loading states
- **Responsive Design**: Mobile-first responsive layout

#### Usage Examples

```jsx
// Basic route protection
<ValuAuthGuard>
  <ProtectedDashboard />
</ValuAuthGuard>

// Admin-only content
<ValuAuthGuard requiredRoles={['admin']}>
  <AdminPanel />
</ValuAuthGuard>

// With custom fallback
<ValuAuthGuard 
  showDetails={true}
  fallback={<CustomLoginForm />}
>
  <UserContent />
</ValuAuthGuard>
```

### 2. ValuUserProfile

**File:** `/components/valu/ValuUserProfile.jsx`

Displays authenticated user information with customizable display variants.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | 'compact' \| 'expanded' | `'compact'` | Display variant |
| `showLogout` | boolean | `true` | Show logout button |
| `onLogout` | function | - | Custom logout handler |
| `className` | string | - | Additional CSS classes |
| `showMetadata` | boolean | `false` | Show user metadata |
| `showNetwork` | boolean | `true` | Show network information |
| `collapsible` | boolean | `false` | Enable collapsible mode in compact variant |

#### Features

- **Dual Variants**: Compact for headers/navigation, expanded for full profiles
- **User Information**: Avatar, name, email, roles, network details
- **Role Badges**: Color-coded role indicators with icons
- **Collapsible Mode**: Dropdown functionality for compact variant
- **Logout Integration**: Built-in logout handling
- **Loading States**: Skeleton animation while loading

#### Usage Examples

```jsx
// Header profile with dropdown
<ValuUserProfile 
  variant="compact"
  collapsible={true}
  showLogout={true}
/>

// Full profile page
<ValuUserProfile 
  variant="expanded"
  showMetadata={true}
  showNetwork={true}
/>

// Custom logout handler
<ValuUserProfile 
  onLogout={handleCustomLogout}
  showLogout={true}
/>
```

### 3. ValuAuthStatus

**File:** `/components/valu/ValuAuthStatus.jsx`

Visual indicator of Valu authentication and connection status.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showDetails` | boolean | `false` | Show detailed status information |
| `position` | 'inline' \| 'fixed' | `'inline'` | Position of the status indicator |
| `className` | string | - | Additional CSS classes |
| `showRefresh` | boolean | `false` | Show refresh button |
| `compact` | boolean | `false` | Compact display mode |
| `showConnection` | boolean | `true` | Show connection status |
| `onClick` | function | - | Custom click handler |

#### Features

- **Status Indicators**: Real-time authentication and connection status
- **Multiple Modes**: Compact badges or detailed alerts
- **Connection Monitoring**: Valu API connection health
- **Error Display**: User-friendly error messages
- **Refresh Capability**: Manual status refresh functionality
- **Development Mode**: Special handling for development environment

#### Status States

- **Connecting**: Loading state with spinner
- **Authenticated**: Green checkmark with user info
- **Not Authenticated**: Warning indicator
- **Authentication Error**: Error state with details
- **Not Connected**: Offline/disconnected state

#### Usage Examples

```jsx
// Simple status badge
<ValuAuthStatus compact={true} />

// Detailed status panel
<ValuAuthStatus 
  showDetails={true}
  showRefresh={true}
  showConnection={true}
/>

// Fixed position indicator
<ValuAuthStatus 
  position="fixed"
  className="top-4 right-4"
  compact={true}
/>
```

## Design System Integration

### Styling

- **shadcn/ui Components**: Built on Card, Badge, Button, Avatar, Alert primitives
- **Tailwind CSS**: Utility-first styling with consistent spacing and colors
- **Apple-inspired Design**: Clean, minimal aesthetic with smooth transitions
- **Responsive Layout**: Mobile-first design with adaptive breakpoints

### Color Scheme

- **Authentication States**: Green (authenticated), Orange (not authenticated), Red (error), Gray (disconnected)
- **Role Badges**: Red (admin), Secondary (moderator), Default (user)
- **Status Indicators**: Color-coded badges and alerts for clear visual feedback

### Typography

- **Font Stack**: System fonts with clean, readable typography
- **Hierarchy**: Consistent heading and body text sizing
- **Truncation**: Text overflow handling for long names and emails

## Integration Guide

### Prerequisites

1. **useValuAuth Hook**: Components depend on this hook for authentication state
2. **useValuApi Hook**: Required for connection status monitoring  
3. **shadcn/ui Components**: Card, Badge, Button, Avatar, Alert, Skeleton components
4. **Tailwind CSS**: For styling and responsive design

### Setup

```jsx
// Import components
import { 
  ValuAuthGuard, 
  ValuUserProfile, 
  ValuAuthStatus 
} from '@/components/valu';

// Use in your application
function App() {
  return (
    <div>
      {/* Status indicator in header */}
      <header>
        <ValuAuthStatus compact={true} />
        <ValuUserProfile variant="compact" collapsible={true} />
      </header>
      
      {/* Protected content */}
      <main>
        <ValuAuthGuard>
          <Dashboard />
        </ValuAuthGuard>
      </main>
    </div>
  );
}
```

## Testing

The components include comprehensive test coverage with:

- **Unit Tests**: Individual component functionality
- **Integration Tests**: Component interaction scenarios  
- **Mock Support**: Proper mocking of authentication hooks
- **Edge Cases**: Loading states, error conditions, role restrictions

**Test File:** `/components/valu/__tests__/ValuAuthComponents.test.jsx`

## Demo Page

A comprehensive demo showcasing all components is available at:
- **URL**: `/valu-auth-demo`
- **Features**: Interactive examples, code snippets, component variants
- **Documentation**: Usage patterns and integration examples

## Best Practices

### Performance

1. **Conditional Rendering**: Components only render when necessary
2. **Memoization**: Avoid unnecessary re-renders
3. **Loading States**: Provide immediate feedback during authentication

### Accessibility

1. **ARIA Labels**: Proper screen reader support
2. **Keyboard Navigation**: Full keyboard accessibility
3. **Color Contrast**: WCAG AA compliant colors
4. **Focus Management**: Clear focus indicators

### Error Handling

1. **Graceful Degradation**: Components handle missing data gracefully
2. **User Feedback**: Clear error messages and recovery suggestions
3. **Fallback States**: Default behaviors when hooks fail

### Security

1. **Role Validation**: Proper role-based access control
2. **Token Handling**: Secure authentication token management
3. **Error Messages**: No sensitive information in error displays

## Future Enhancements

### Planned Features

1. **Multi-Factor Authentication**: Support for MFA workflows
2. **Session Management**: Advanced session handling
3. **Audit Logging**: Authentication event tracking
4. **Theming**: Dark mode and custom theme support

### Integration Roadmap

1. **NextAuth Integration**: Compatibility with NextAuth.js
2. **SSO Support**: Additional single sign-on providers
3. **Mobile Apps**: React Native component variants
4. **Analytics**: Authentication analytics and metrics

## Support

For questions, issues, or contributions:

1. **Documentation**: Refer to this guide and inline JSDoc comments
2. **Demo Page**: Test components at `/valu-auth-demo`
3. **Test Suite**: Run tests with `npm test ValuAuthComponents`
4. **Code Examples**: Check the demo page source for implementation patterns

---

**Last Updated**: September 2025  
**Version**: 1.0.0  
**Status**: Production Ready