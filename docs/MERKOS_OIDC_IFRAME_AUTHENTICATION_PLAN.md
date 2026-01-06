# Merkos OIDC Direct Authentication from Iframe - Technical Analysis & Plan

**Date:** December 23, 2025
**Status:** 🔴 Architecture Evaluation
**Context:** Reverting from dual-token gateway to direct id.merkos302.com authentication

---

## 📋 Executive Summary

**Goal:** Authenticate users in the Universe Portal iframe app directly using id.merkos302.com OIDC, leveraging existing user authentication and tokens.

**Key Challenge:** The portal runs in an iframe on a different domain (portal.chabaduniverse.com) than the OIDC provider (id.merkos302.com), creating cross-domain security restrictions.

**Critical Question:** How can an iframe application access authentication tokens from a parent domain when browser security policies explicitly prevent this?

---

## 🎯 Current Situation

### What We Know

1. **User Authentication Flow:**
   - User authenticates through id.merkos302.com BEFORE entering the portal
   - Authentication token exists in browser on id.merkos302.com domain
   - User is already logged in when they access the iframe

2. **Portal Context:**
   - Portal runs as iframe on various parent domains
   - Portal domain: portal.chabaduniverse.com (or similar)
   - OIDC provider: id.merkos302.com

3. **Technical Stack:**
   - Backend: Go with go-oidc library
   - Frontend: Next.js React application
   - Authentication: OpenID Connect (OIDC)

4. **Why Reverting from Dual-Token Gateway:**
   - (User didn't specify - but likely complexity or RP library constraints)

---

## 🚧 Technical Challenges

### Challenge 1: Cross-Domain Cookie Access

**The Core Problem:**

```
┌─────────────────────────────────────────────────────────┐
│  Parent Domain: any-domain.com                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Iframe: portal.chabaduniverse.com                 │  │
│  │                                                   │  │
│  │ ❌ CANNOT ACCESS                                  │  │
│  │ Cookies on: id.merkos302.com                      │  │
│  │                                                   │  │
│  │ Browser Same-Origin Policy BLOCKS:                │  │
│  │ - Direct cookie access                            │  │
│  │ - localStorage/sessionStorage access              │  │
│  │ - Any storage on different domain                 │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Why This Matters:**
- Token is stored on id.merkos302.com
- Iframe runs on portal.chabaduniverse.com
- Browser security prevents cross-domain access
- **Result:** Iframe cannot see the existing token

### Challenge 2: OIDC Authorization Flow in Iframe

**Standard OIDC Flow Issues:**

```
1. User clicks "Login" in iframe
   ↓
2. Iframe redirects to: id.merkos302.com/oauth/authorize
   ↓
3. 🚨 PROBLEM: Redirect breaks iframe context
   Options:
   a) Redirect entire page (breaks iframe embedding)
   b) Redirect only iframe (confusing UX, may fail)
   c) Open popup (blocked by popup blockers)
```

**Specific go-oidc Concerns:**
- go-oidc expects server-side token handling
- Designed for traditional web apps, not iframes
- State parameter validation requires same session
- PKCE flow may be challenging in iframe context

### Challenge 3: Third-Party Cookie Blocking

**Browser Policies:**

```
Safari (Current):
❌ Blocks ALL third-party cookies by default

Chrome (2024+):
❌ Phasing out third-party cookies
❌ Strict SameSite requirements

Firefox:
⚠️  Enhanced Tracking Protection blocks many scenarios
```

**Impact on Iframe Authentication:**
- Even if cookies are set, browsers may block them
- `SameSite=None; Secure` required but often insufficient
- User must enable third-party cookies (bad UX)

### Challenge 4: Token Validation on Backend

**Backend Service Challenges:**

```
Go Backend (using go-oidc)
   ↓
Needs to validate token
   ↓
Token must be sent from iframe
   ↓
How does iframe GET the token?
   ↓
🚨 CIRCULAR PROBLEM
```

---

## 💡 Possible Solutions

### Option 1: PostMessage Token Bridge (RECOMMENDED)

**Concept:** Parent window passes token to iframe via PostMessage API

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│  Parent Window (has id.merkos302.com token)             │
│                                                         │
│  JavaScript reads token from:                           │
│  - Cookie (if same domain as id.merkos302.com)          │
│  - localStorage                                         │
│  - Hidden iframe on id.merkos302.com                    │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Iframe: portal.chabaduniverse.com                 │  │
│  │                                                   │  │
│  │ 1. Iframe sends: "REQUEST_TOKEN" via postMessage │  │
│  │    ↓                                              │  │
│  │ 2. Parent validates origin                        │  │
│  │    ↓                                              │  │
│  │ 3. Parent sends: { token: "eyJ..." }             │  │
│  │    ↓                                              │  │
│  │ 4. Iframe receives token                          │  │
│  │    ↓                                              │  │
│  │ 5. Iframe sends to backend for validation         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Implementation Steps:**

1. **Parent Window Integration:**
   ```javascript
   // Parent page (controlled by Merkos)
   window.addEventListener('message', (event) => {
     // Validate origin
     if (event.origin !== 'https://portal.chabaduniverse.com') return;

     if (event.data.type === 'REQUEST_TOKEN') {
       // Read token from id.merkos302.com cookie/storage
       const token = getIdMerkosToken();

       // Send to iframe
       event.source.postMessage({
         type: 'TOKEN_RESPONSE',
         token: token
       }, event.origin);
     }
   });
   ```

2. **Iframe Integration (Portal):**
   ```javascript
   // In portal iframe
   useEffect(() => {
     // Request token from parent
     window.parent.postMessage({
       type: 'REQUEST_TOKEN'
     }, '*');

     // Listen for response
     const handleMessage = (event) => {
       if (event.data.type === 'TOKEN_RESPONSE') {
         const token = event.data.token;
         // Send to backend for validation
         validateWithBackend(token);
       }
     };

     window.addEventListener('message', handleMessage);
     return () => window.removeEventListener('message', handleMessage);
   }, []);
   ```

3. **Backend Validation (Go):**
   ```go
   // Receive token from iframe frontend
   token := r.Header.Get("Authorization")

   // Validate with go-oidc
   idToken, err := verifier.Verify(ctx, token)
   if err != nil {
       // Handle invalid token
   }

   // Extract claims
   var claims struct {
       Email string `json:"email"`
       // ... other claims
   }
   idToken.Claims(&claims)
   ```

**Pros:**
- ✅ Works across all browsers
- ✅ No third-party cookie issues
- ✅ Parent controls token access
- ✅ Secure origin validation
- ✅ Existing token reused

**Cons:**
- ❌ Requires parent page modification
- ❌ Parent must have access to token
- ❌ More complex integration

**Requirements:**
- Parent page must be controlled/modifiable by Merkos
- Parent must have JavaScript access to id.merkos302.com token
- Iframe must trust parent domain

---

### Option 2: Hidden Iframe Token Bridge

**Concept:** Use hidden iframe on id.merkos302.com to access tokens

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│  Portal Iframe: portal.chabaduniverse.com               │
│                                                         │
│  ┌────────────────────────────────────────────┐         │
│  │ Hidden Iframe: id.merkos302.com/token-api  │         │
│  │                                            │         │
│  │ This iframe CAN access id.merkos302.com    │         │
│  │ cookies because same domain!               │         │
│  │                                            │         │
│  │ 1. Read token from cookie                  │         │
│  │ 2. Send to parent via postMessage          │         │
│  └────────────────────────────────────────────┘         │
│         ↓ postMessage                                   │
│  3. Portal receives token                               │
│  4. Send to backend for validation                      │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**

1. **Create Token Bridge Page on id.merkos302.com:**
   ```html
   <!-- https://id.merkos302.com/token-bridge.html -->
   <script>
     // This page can access id.merkos302.com cookies
     const token = document.cookie.split('; ')
       .find(row => row.startsWith('id_token='))
       ?.split('=')[1];

     // Send to parent (portal iframe)
     window.parent.postMessage({
       type: 'TOKEN_BRIDGE',
       token: token
     }, 'https://portal.chabaduniverse.com');
   </script>
   ```

2. **Portal Loads Hidden Iframe:**
   ```typescript
   // In portal
   useEffect(() => {
     // Create hidden iframe
     const iframe = document.createElement('iframe');
     iframe.src = 'https://id.merkos302.com/token-bridge.html';
     iframe.style.display = 'none';
     document.body.appendChild(iframe);

     // Listen for token
     const handleMessage = (event) => {
       if (event.origin === 'https://id.merkos302.com') {
         if (event.data.type === 'TOKEN_BRIDGE') {
           setToken(event.data.token);
         }
       }
     };

     window.addEventListener('message', handleMessage);
     return () => {
       window.removeEventListener('message', handleMessage);
       document.body.removeChild(iframe);
     };
   }, []);
   ```

**Pros:**
- ✅ Portal controls the flow
- ✅ No parent page modification needed
- ✅ Works with existing tokens

**Cons:**
- ❌ Requires new endpoint on id.merkos302.com
- ❌ May trigger third-party cookie blocks
- ❌ More complex than Option 1

---

### Option 3: Backend-to-Backend Token Exchange

**Concept:** Portal backend gets token from Merkos backend

**Architecture:**

```
┌────────────────────────────────────────────────────────┐
│  User Browser                                          │
│  ┌──────────────────────────────────┐                  │
│  │ Portal Iframe                    │                  │
│  │ 1. User visits portal            │                  │
│  │ 2. Portal sends session ID       │                  │
│  └──────────────────────────────────┘                  │
└────────────────────────────────────────────────────────┘
                    ↓ HTTP Request
┌────────────────────────────────────────────────────────┐
│  Portal Backend (Go)                                   │
│  3. Receives session ID                                │
│  4. Calls Merkos Backend API                           │
└────────────────────────────────────────────────────────┘
                    ↓ Backend API Call
┌────────────────────────────────────────────────────────┐
│  Merkos Backend                                        │
│  5. Validates session ID                               │
│  6. Returns ID token or user info                      │
└────────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────────┐
│  Portal Backend                                        │
│  7. Validates token with go-oidc                       │
│  8. Returns authenticated response to iframe           │
└────────────────────────────────────────────────────────┘
```

**Implementation:**

1. **Portal Backend Calls Merkos API:**
   ```go
   // Portal backend
   func getTokenFromMerkos(sessionID string) (string, error) {
       // Call Merkos backend API
       resp, err := http.Get(
           "https://api.merkos302.com/session/token?session=" + sessionID
       )

       // Merkos validates session, returns token
       var result struct {
           IDToken string `json:"id_token"`
       }
       json.NewDecoder(resp.Body).Decode(&result)

       return result.IDToken, nil
   }
   ```

2. **Validate with go-oidc:**
   ```go
   token, err := getTokenFromMerkos(sessionID)

   // Standard go-oidc validation
   idToken, err := verifier.Verify(ctx, token)
   ```

**Pros:**
- ✅ No iframe complications
- ✅ No client-side token exposure
- ✅ Standard go-oidc usage
- ✅ Server-side security

**Cons:**
- ❌ Requires new Merkos backend API
- ❌ Session management complexity
- ❌ Additional backend calls

**Requirements:**
- Merkos must provide backend API
- Secure session ID management
- API authentication between backends

---

### Option 4: Server-Side Session with Cookie Forwarding

**Concept:** Portal backend maintains its own session, synced with Merkos

**Architecture:**

```
1. User authenticates at id.merkos302.com
   ↓
2. Merkos redirects to portal with signed token/code
   ↓
3. Portal backend:
   - Validates token with go-oidc
   - Creates portal session
   - Sets cookie on portal.chabaduniverse.com
   ↓
4. Iframe uses portal session cookie
   ↓
5. Portal backend validates against stored OIDC token
```

**Implementation:**

1. **Initial Authentication Redirect:**
   ```go
   // After Merkos authentication
   // Merkos redirects to:
   // https://portal.chabaduniverse.com/auth/callback?code=xyz

   func handleCallback(w http.ResponseWriter, r *http.Request) {
       code := r.URL.Query().Get("code")

       // Exchange code for token
       oauth2Token, err := oauth2Config.Exchange(ctx, code)

       // Extract ID token
       rawIDToken, ok := oauth2Token.Extra("id_token").(string)

       // Verify with go-oidc
       idToken, err := verifier.Verify(ctx, rawIDToken)

       // Create portal session
       sessionID := createSession(idToken)

       // Set session cookie
       http.SetCookie(w, &http.Cookie{
           Name:     "portal_session",
           Value:    sessionID,
           Domain:   ".chabaduniverse.com",
           Secure:   true,
           HttpOnly: true,
           SameSite: http.SameSiteNoneMode,
       })

       // Redirect to portal
       http.Redirect(w, r, "/portal", http.StatusFound)
   }
   ```

2. **Iframe Uses Portal Session:**
   ```typescript
   // Iframe automatically sends portal_session cookie
   // Backend validates against stored OIDC token
   ```

**Pros:**
- ✅ Standard session management
- ✅ Works in iframe context
- ✅ No postMessage complexity

**Cons:**
- ❌ Requires initial redirect flow
- ❌ Cookie sync complexity
- ❌ May hit third-party cookie blocks

---

## 🎯 Recommended Approach

### Hybrid Solution: PostMessage + Backend Validation

**Best of Both Worlds:**

1. **Use PostMessage (Option 1) for token acquisition**
   - Parent page controlled by Merkos passes token
   - OR use hidden iframe bridge (Option 2) if parent not controllable

2. **Backend validation with go-oidc remains unchanged**
   - Portal backend validates token normally
   - Standard OIDC verification flow

3. **Fallback to redirect flow if postMessage fails**
   - If token not available via postMessage
   - Fall back to standard OIDC authorization flow

**Implementation Priority:**

```
Priority 1: PostMessage Token Bridge
├── Requires: Parent page integration
├── Timeline: 1-2 days
└── Impact: Solves 80% of use cases

Priority 2: Backend Session Management
├── Requires: Backend session infrastructure
├── Timeline: 3-5 days
└── Impact: Handles remaining edge cases

Priority 3: Hidden Iframe Fallback
├── Requires: Token bridge endpoint on id.merkos302.com
├── Timeline: 1-2 days
└── Impact: Fallback when parent not available
```

---

## ⚠️ Critical Considerations

### 1. Parent Domain Control

**Question:** Who controls the parent page where the iframe is embedded?

```
If Merkos controls parent:
  ✅ PostMessage solution is straightforward
  ✅ Can implement token passing logic
  ✅ Can handle OIDC flow before iframe loads

If Merkos does NOT control parent:
  ❌ PostMessage requires third-party cooperation
  ⚠️  Need alternative approach (hidden iframe or backend-to-backend)
```

### 2. Third-Party Cookie Reality

**Current Browser Landscape:**

```
Safari:     ❌ Blocks by default
Chrome:     ⚠️  Phasing out (2024-2025)
Firefox:    ⚠️  Strict mode blocks
Edge:       ⚠️  Following Chrome

Recommendation: Do NOT rely on third-party cookies
```

### 3. go-oidc Library Constraints

**What go-oidc Expects:**

```go
// go-oidc designed for:
1. Server-side token validation ✅
2. Standard redirect flow ✅
3. Session management ✅

// go-oidc NOT designed for:
1. Client-side iframe flows ❌
2. PostMessage token passing ❌
3. Cross-domain token access ❌

// Solution: Use go-oidc only for validation
// Handle token acquisition separately (postMessage)
```

### 4. Security Validation

**Required Security Measures:**

```javascript
// PostMessage origin validation
window.addEventListener('message', (event) => {
  // CRITICAL: Always validate origin
  const ALLOWED_ORIGINS = [
    'https://portal.chabaduniverse.com',
    'https://id.merkos302.com'
  ];

  if (!ALLOWED_ORIGINS.includes(event.origin)) {
    console.error('Untrusted origin:', event.origin);
    return;
  }

  // Process message
});
```

```go
// Backend token validation
func validateToken(tokenString string) error {
    // Always use go-oidc verifier
    idToken, err := verifier.Verify(ctx, tokenString)
    if err != nil {
        return fmt.Errorf("invalid token: %w", err)
    }

    // Validate custom claims
    var claims CustomClaims
    if err := idToken.Claims(&claims); err != nil {
        return err
    }

    // Additional business logic validation
    return validateBusinessRules(claims)
}
```

---

## 📋 Implementation Plan

### Phase 1: Token Acquisition (Week 1)

**Option A: If Parent Page Controlled**
- [ ] Implement postMessage token bridge in parent
- [ ] Add token request logic to portal iframe
- [ ] Add origin validation
- [ ] Test across browsers

**Option B: If Parent Page NOT Controlled**
- [ ] Create token bridge endpoint on id.merkos302.com
- [ ] Implement hidden iframe in portal
- [ ] Add postMessage handling
- [ ] Test across browsers

### Phase 2: Backend Integration (Week 1-2)

- [ ] Set up go-oidc verifier in portal backend
- [ ] Create token validation endpoint
- [ ] Implement session management
- [ ] Add error handling and logging

### Phase 3: Frontend Integration (Week 2)

- [ ] Create React hook: `useMerkosOidcAuth`
- [ ] Implement loading states
- [ ] Add error handling UI
- [ ] Create authentication guard components

### Phase 4: Testing & Refinement (Week 2-3)

- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Mobile browser testing
- [ ] Error scenario testing
- [ ] Performance optimization
- [ ] Security audit

### Phase 5: Fallback Flows (Week 3)

- [ ] Implement redirect flow fallback
- [ ] Add "Enable cookies" messaging
- [ ] Create troubleshooting documentation

---

## 🚨 Blockers & Risks

### High Priority Blockers

1. **Parent Domain Access**
   - Risk: Cannot implement postMessage if parent not controlled
   - Mitigation: Identify parent domain ownership NOW

2. **Third-Party Cookie Blocking**
   - Risk: May break in Safari/Chrome
   - Mitigation: Design without cookie dependency

3. **Merkos Backend API Availability**
   - Risk: No backend-to-backend token exchange available
   - Mitigation: Confirm API availability or build it

### Medium Priority Risks

1. **Token Expiration Handling**
   - Need refresh token flow
   - Need silent refresh mechanism

2. **Cross-Browser Compatibility**
   - PostMessage support varies
   - Need extensive testing

3. **Performance Impact**
   - Multiple postMessage calls
   - Backend validation latency

---

## 📊 Decision Matrix

| Approach | Complexity | Security | Browser Support | Parent Control Needed | Backend Changes |
|----------|-----------|----------|-----------------|----------------------|----------------|
| PostMessage Bridge | Low | High | Excellent | Yes | None |
| Hidden Iframe | Medium | High | Good | No | Minimal |
| Backend-to-Backend | Medium | Very High | Excellent | No | Significant |
| Session Cookie | High | High | Fair | No | Moderate |

**Recommendation:** Start with **PostMessage Bridge** if parent is controlled, otherwise use **Hidden Iframe Bridge**.

---

## ✅ Next Steps

### Immediate Actions (This Week)

1. **Clarify Parent Domain Control**
   - Who controls the page embedding the portal iframe?
   - Can we add JavaScript to that page?

2. **Verify Token Storage Location**
   - Where exactly is the id.merkos302.com token stored?
   - Cookie? localStorage? sessionStorage?

3. **Confirm Backend Architecture**
   - Is there a Go backend for the portal?
   - Is go-oidc already integrated?

4. **Choose Implementation Path**
   - Based on answers to above, select Option 1, 2, or 3

### Week 1 Deliverables

- [ ] Technical design document approved
- [ ] Parent page integration plan (if needed)
- [ ] Backend architecture finalized
- [ ] Development environment set up

### Week 2-3 Deliverables

- [ ] Working prototype in development
- [ ] Cross-browser testing complete
- [ ] Documentation complete
- [ ] Ready for staging deployment

---

## 📞 Questions to Answer

Before proceeding, we need clarity on:

1. **Who controls the parent page where the iframe is embedded?**
   - Merkos 302? Third party? Varies by deployment?

2. **Where is the id.merkos302.com token currently stored?**
   - HTTP-only cookie? JavaScript-accessible cookie? localStorage?

3. **Is there a Go backend for this portal?**
   - Yes/No? If yes, is go-oidc already integrated?

4. **What is the deployment model?**
   - Same parent always? Multiple different parents?

5. **Do we have API access to Merkos backend?**
   - Can we create new endpoints if needed?

---

## 📚 References

- [PostMessage API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [go-oidc Library](https://github.com/coreos/go-oidc)
- [Third-Party Cookie Phase-Out](https://developers.google.com/privacy-sandbox/3pcd)
- [SameSite Cookie Attribute](https://web.dev/samesite-cookies-explained/)
- [Existing Implementation: useIframeMessaging Hook](hooks/useIframeMessaging.ts)

---

**Document Version:** 1.0.0
**Last Updated:** December 23, 2025
**Next Review:** After answering critical questions above
**Status:** 🔴 AWAITING DECISION - Need answers to proceed
