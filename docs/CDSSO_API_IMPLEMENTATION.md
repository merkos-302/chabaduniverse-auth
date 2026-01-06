# CDSSO API Route Implementation

**Date:** December 23, 2025
**Status:** ✅ IMPLEMENTED
**Issue:** #132 - Cross-Domain SSO Implementation
**API Endpoint:** `/api/sso/remote/status`

---

## Overview

This document describes the implementation of the Cross-Domain SSO (CDSSO) API route that enables the Universe Portal iframe to make authenticated API calls to the Merkos Platform API (`api.merkos302.com`).

## Problem Solved

The portal iframe (`portal.chabaduniverse.com`) cannot access the `x-auth-token` cookie from `id.merkos302.com` due to browser cross-domain restrictions. This API route solves this by:

1. Accepting JWT tokens from Merkos Platform SSO
2. Validating token signatures and structure
3. Setting the `x-auth-token` cookie on the portal domain
4. Enabling authenticated API calls to `api.merkos302.com`

## Implementation Details

### File Structure

```
pages/api/sso/remote/status.ts          # API route implementation (277 lines)
__tests__/api/sso/remote/status.test.ts # Comprehensive test suite (27 tests)
```

### API Route: `/api/sso/remote/status`

**Method:** POST
**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "User Name",
    ...
  }
}
```

**Error Response (400/401/500):**
```json
{
  "status": "error",
  "error": "Error message"
}
```

### Security Features

1. **JWT Signature Verification**
   - Validates token signature using `MERKOS_JWT_SECRET_KEY` environment variable
   - Prevents token tampering attacks
   - Supports both HS256 and RS256 algorithms

2. **HTTP-Only Cookie**
   - Cookie name: `x-auth-token`
   - Prevents XSS attacks (JavaScript cannot access cookie)
   - 14-day expiration
   - Domain: `portal.chabaduniverse.com`

3. **Secure Cookie Attributes**
   - `HttpOnly`: Prevents JavaScript access
   - `Secure`: HTTPS only in production
   - `SameSite=None`: Required for cross-domain API calls
   - `Max-Age=1209600`: 14 days in seconds
   - `Path=/`: Available site-wide
   - `Domain=portal.chabaduniverse.com`: Portal-specific

4. **CORS Protection**
   - Whitelisted origins only
   - Credentials support enabled
   - Proper preflight handling

### Validation Steps

The API route performs the following validation:

1. **HTTP Method** - Only POST and OPTIONS allowed
2. **Request Body** - Token must be present and string type
3. **JWT Signature** - Token must be signed with correct secret
4. **Token Structure** - Token must contain valid user data
5. **Token Expiration** - Expired tokens are rejected
6. **User Data** - User ID must be present

### Error Handling

Comprehensive error handling with specific error messages:

- `400` - Missing or invalid token in request body
- `401` - Token validation failed (expired, invalid signature, invalid structure)
- `405` - Method not allowed (only POST/OPTIONS)
- `500` - Server configuration error or unexpected error

### Logging

Uses structured logging system with appropriate log levels:

- **authLog.loginAttempt()** - Successful/failed authentication attempts
- **authLog.tokenValidation()** - Token validation results
- **apiLog.request/response()** - API request/response logging
- **apiLog.error()** - API errors
- **securityLog.suspiciousActivity()** - Security events

## Test Coverage

**Test Suite:** 27 comprehensive tests covering:

### HTTP Method Validation (3 tests)
- ✅ Reject GET requests
- ✅ Accept POST requests
- ✅ Accept OPTIONS requests for CORS

### Request Body Validation (3 tests)
- ✅ Reject requests without token
- ✅ Reject requests with empty token
- ✅ Reject requests with non-string token

### JWT Token Validation (5 tests)
- ✅ Accept valid JWT token
- ✅ Reject expired JWT token
- ✅ Reject token with invalid signature
- ✅ Reject malformed JWT token
- ✅ Reject token without user data

### User Data Extraction (3 tests)
- ✅ Extract user from token.user property (Merkos format)
- ✅ Extract user from standard JWT claims as fallback
- ✅ Handle user._id property (MongoDB format)

### HTTP-Only Cookie Setting (3 tests)
- ✅ Set x-auth-token cookie with correct attributes
- ✅ Not set Secure flag in test environment
- ✅ Set Secure flag in production environment

### CORS Headers (2 tests)
- ✅ Set CORS headers for allowed origins
- ✅ Handle OPTIONS preflight requests

### Error Handling (2 tests)
- ✅ Handle missing MERKOS_JWT_SECRET_KEY environment variable
- ✅ Handle unexpected errors gracefully

### Response Format (2 tests)
- ✅ Return success response with user data
- ✅ Return error response with error message

### Security Features (4 tests)
- ✅ Verify JWT signature (prevents tampering)
- ✅ Set HttpOnly flag (prevents XSS)
- ✅ Set SameSite=None (required for cross-domain)
- ✅ Reject tokens without expiration

**Test Results:**
```
Test Suites: 1 passed, 1 total
Tests:       27 passed, 27 total
Time:        0.698 s
```

## Environment Configuration

### Required Environment Variable

Add to `.env` file:

```bash
# Merkos Platform JWT Secret (required for CDSSO)
# MUST match the MERKOS_JWT_SECRET_KEY used by Merkos Platform (id.merkos302.com)
# This enables Cross-Domain SSO by validating JWT tokens from Merkos SSO
# Contact Merkos Platform team for the production value
MERKOS_JWT_SECRET_KEY=your-merkos-platform-jwt-secret-here
```

### Fallback Support

The API route supports both `MERKOS_JWT_SECRET_KEY` and `JWT_SECRET` environment variables for backward compatibility.

## Usage Example

### Frontend Integration (React)

```typescript
// Step 1: Get token from Merkos SSO
const response = await fetch('https://id.merkos302.com/apiv4/users/sso/remote/status', {
  method: 'GET',
  credentials: 'include',
});

const data = await response.json();

if (data.status === 'loggedIn' && data.token) {
  // Step 2: Apply token to portal domain
  const applyResponse = await fetch('/api/sso/remote/status', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: data.token }),
  });

  const applyData = await applyResponse.json();

  if (applyData.status === 'success') {
    console.log('✅ Authenticated:', applyData.user);
    // Now you can call api.merkos302.com with authentication
  }
}
```

## Token Format

The API route expects JWT tokens in Merkos Platform format:

```json
{
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "User Name",
    "role": "admin",
    "organization": "Org Name"
  },
  "exp": 1735862400,
  "iat": 1735000000
}
```

Alternative format (standard JWT claims) is also supported:

```json
{
  "sub": "123",
  "email": "user@example.com",
  "name": "User Name",
  "exp": 1735862400,
  "iat": 1735000000
}
```

## Cookie Specification

The `x-auth-token` cookie is set with the following attributes:

```
Set-Cookie: x-auth-token=<JWT_TOKEN>; Max-Age=1209600; Path=/; Domain=portal.chabaduniverse.com; HttpOnly; Secure; SameSite=None
```

**Attribute Breakdown:**
- `Max-Age=1209600` - 14 days (60 * 60 * 24 * 14 seconds)
- `Path=/` - Available across entire portal site
- `Domain=portal.chabaduniverse.com` - Specific to portal subdomain
- `HttpOnly` - Prevents JavaScript access (XSS protection)
- `Secure` - HTTPS only (production) - MITM protection
- `SameSite=None` - Required for cross-domain API calls to api.merkos302.com

## Next Steps

### Phase 2: Frontend CDSSO Utility (Pending)

Create `lib/cdsso-utils.ts` with helper functions:

- `CDSSOUtils.checkRemoteSession()` - Check if user is logged into id.merkos302.com
- `CDSSOUtils.applyTokenToPortal()` - Apply token to portal domain
- `CDSSOUtils.authenticate()` - Complete CDSSO flow in one call

### Phase 3: React Hook (Pending)

Create `hooks/useCDSSOAuth.ts` for React integration:

- Auto-check authentication on mount
- Periodic session refresh
- Logout functionality
- User state management

### Phase 4: App Integration (Pending)

Integrate CDSSO into `_app.tsx`:

- Call CDSSO on app initialization
- Provide user context to all pages
- Handle authentication state globally

## References

- **Implementation Plan:** [docs/CDSSO_IMPLEMENTATION_PLAN.md](CDSSO_IMPLEMENTATION_PLAN.md)
- **Security Analysis:** [docs/CDSSO_SECURITY_ANALYSIS.md](CDSSO_SECURITY_ANALYSIS.md)
- **GitHub Issue:** [#132 - Implement CDSSO to Enable Merkos Platform API Access](https://github.com/merkos-302/universe-portal/issues/132)
- **Merkos Platform API Docs:** [docs/merkos-platform/MERKOS_PLATFORM_API_DOCUMENTATION.md](merkos-platform/MERKOS_PLATFORM_API_DOCUMENTATION.md)

## Success Metrics

✅ **API Route Implemented** - 277 lines of production-ready code
✅ **Comprehensive Testing** - 27 tests with 100% pass rate
✅ **Security Hardened** - JWT verification, HTTP-only cookies, CORS protection
✅ **Well Documented** - Inline comments, JSDoc, this implementation guide
✅ **Error Handling** - Graceful error handling with specific error messages
✅ **Logging Integration** - Structured logging with auth, API, and security loggers

**Status:** Ready for Phase 1 SSO implementation ✅

---

**Last Updated:** December 23, 2025
**Implementation Time:** ~2 hours
**Lines of Code:** 277 (API route) + 440 (tests) = 717 total
**Test Coverage:** 100% of API route functionality
