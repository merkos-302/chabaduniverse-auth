# CDSSO Security Analysis: Do We Need MERKOS_JWT_SECRET_KEY?

**Date:** December 23, 2025
**Question:** Does the portal backend need MERKOS_JWT_SECRET_KEY to validate tokens?

---

## 🔍 The Short Answer

**YES, we need JWT signature verification** - but let me explain why and show you both options.

---

## 📊 What I Found in Merkos Platform Code

### Merkos Platform DOES Verify Signatures

```typescript
// UserRoutesUtils.ts
static decodeJwtToken(token: string) {
    try {
        let decoded = jwt.verify(token, process.env.MERKOS_JWT_SECRET_KEY);
        return decoded;
    } catch (e) {
        console.error('error decoding token', e)
        return null;
    }
}
```

Merkos Platform uses `jwt.verify()` not `jwt.decode()`, which means they:
- ✅ Validate JWT signature with secret key
- ✅ Check token hasn't been tampered with
- ✅ Verify token expiration

### POST `/sso/remote/status` Endpoint

```typescript
router.post('/sso/remote/status', async (req, res) => {
    if (req.body && req.body.token) {
        let decoded = UserRoutesUtils.decodeJwtToken(token); // Calls jwt.verify!

        if (decoded?.user) {
            res.cookie('x-auth-token', token, ...);
            return res.json({ status: 'success', token: token });
        }
    }
})
```

**Key Point:** Merkos Platform verifies the token BEFORE setting the cookie.

---

## 🔐 Security Attack Vectors

### Attack Scenario: Token Tampering (Without Verification)

```
┌──────────────────────────────────────────────────────────────┐
│  WITHOUT JWT VERIFICATION                                     │
└──────────────────────────────────────────────────────────────┘

1. Attacker gets valid token for their account:
   GET id.merkos302.com/sso/remote/status
   Response: { token: "eyJhbGc...valid_token_for_attacker" }

2. Attacker decodes JWT (just base64 decode):
   {
     "user": {
       "id": "attacker-id",
       "email": "attacker@example.com",
       "role": "user"
     },
     "exp": 1234567890
   }

3. Attacker modifies payload:
   {
     "user": {
       "id": "admin-id",              ← Changed!
       "email": "admin@merkos302.com", ← Changed!
       "role": "admin"                 ← Changed!
     },
     "exp": 1234567890
   }

4. Attacker re-encodes JWT (signature is now invalid):
   "eyJhbGc...MODIFIED_BUT_INVALID_SIGNATURE"

5. Attacker sends to portal backend:
   POST portal.chabaduniverse.com/api/sso/remote/status
   Body: { token: "MODIFIED_TOKEN" }

6. Portal backend WITHOUT verification:
   ❌ const decoded = jwt.decode(token);  // Just decodes, no validation!
   ❌ if (decoded?.user) {
   ❌    setUser(decoded.user);  // ACCEPTS FAKE DATA!
   ❌ }

7. Attacker now authenticated as admin! 🚨
```

### With JWT Verification (Secure)

```
┌──────────────────────────────────────────────────────────────┐
│  WITH JWT VERIFICATION                                        │
└──────────────────────────────────────────────────────────────┘

1-4. [Same as above - attacker modifies token]

5. Attacker sends MODIFIED token to portal backend

6. Portal backend WITH verification:
   ✅ const decoded = jwt.verify(token, MERKOS_JWT_SECRET_KEY);
   ✅ // Signature validation FAILS
   ✅ throw new Error('Invalid signature');

7. Attack prevented! ✅
```

---

## 💡 Two Implementation Options

### Option 1: Full JWT Verification (RECOMMENDED)

**Security Level:** 🔒 High
**Implementation Complexity:** Low
**Requires:** MERKOS_JWT_SECRET_KEY

```typescript
// pages/api/sso/remote/status.ts
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const { token } = req.body;

  try {
    // ✅ SECURE: Verifies signature and expiration
    const decoded = jwt.verify(token, process.env.MERKOS_JWT_SECRET_KEY);

    if (!decoded || !decoded.user) {
      return res.status(401).json({ error: 'Invalid token structure' });
    }

    // Set cookie
    res.setHeader('Set-Cookie', [
      `x-auth-token=${token}; ` +
      `Domain=.chabaduniverse.com; ` +
      `HttpOnly; Secure; SameSite=Lax; ` +
      `Max-Age=${60 * 60 * 24 * 14}`
    ]);

    return res.json({
      status: 'success',
      user: decoded.user
    });

  } catch (error) {
    // Signature invalid, token expired, or malformed
    return res.status(401).json({
      error: 'Token validation failed',
      details: error.message
    });
  }
}
```

**Pros:**
- ✅ Prevents token tampering
- ✅ Prevents token forgery
- ✅ Matches Merkos Platform's security model
- ✅ Industry standard approach
- ✅ Defense in depth

**Cons:**
- ⚠️ Requires sharing MERKOS_JWT_SECRET_KEY with portal
- ⚠️ Key management overhead

---

### Option 2: Trust-Based Approach (NOT RECOMMENDED)

**Security Level:** ⚠️ Lower
**Implementation Complexity:** Slightly Lower
**Requires:** Nothing (no secret key)

```typescript
// pages/api/sso/remote/status.ts
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const { token } = req.body;

  try {
    // ⚠️ LESS SECURE: Decodes without verification
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.user) {
      return res.status(401).json({ error: 'Invalid token structure' });
    }

    // Check expiration manually
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ error: 'Token expired' });
    }

    // Set cookie (accepting unverified token)
    res.setHeader('Set-Cookie', [
      `x-auth-token=${token}; ` +
      `Domain=.chabaduniverse.com; ` +
      `HttpOnly; Secure; SameSite=Lax; ` +
      `Max-Age=${60 * 60 * 24 * 14}`
    ]);

    return res.json({
      status: 'success',
      user: decoded.user
    });

  } catch (error) {
    return res.status(401).json({
      error: 'Token processing failed'
    });
  }
}
```

**Pros:**
- ✅ Simpler - no secret key needed
- ✅ Relies on HTTPS preventing token tampering
- ✅ Trusts id.merkos302.com as authority

**Cons:**
- ❌ Vulnerable to token tampering
- ❌ Vulnerable to token forgery
- ❌ Attacker can modify user ID, roles, permissions
- ❌ Inconsistent with Merkos Platform's security model
- ❌ Not industry standard

---

## 🤔 Could We Use Alternative Validation?

### Option 3: Delegate Validation to Merkos Platform

Instead of verifying locally, call back to Merkos Platform to validate:

```typescript
// Portal backend receives token
// Call Merkos API to validate it
const response = await fetch('https://id.merkos302.com/api/validate-token', {
  method: 'POST',
  body: JSON.stringify({ token }),
});

const { valid, user } = await response.json();
```

**Problem:** This endpoint doesn't exist in Merkos Platform (I checked).

---

## 📋 What Merkos Platform Does

Looking at the actual implementation:

```typescript
// In Merkos Platform
router.post('/sso/remote/status', async (req, res) => {
    let decoded = UserRoutesUtils.decodeJwtToken(token);
    // ↑ This calls jwt.verify with MERKOS_JWT_SECRET_KEY

    if (decoded?.user) {
        res.cookie('x-auth-token', token, ...);
    }
})
```

**Merkos Platform's Security Model:**
1. ✅ Receives token from client
2. ✅ Verifies JWT signature with secret key
3. ✅ Only sets cookie if verification passes
4. ✅ Returns error if signature invalid

**We should follow the same pattern.**

---

## 🎯 Recommendation

### Use Option 1: Full JWT Verification

**Rationale:**

1. **Security Best Practice**
   - Industry standard for JWT validation
   - Prevents common JWT attacks
   - Defense in depth principle

2. **Consistency with Merkos Platform**
   - Merkos Platform verifies signatures
   - We should match their security model
   - Reduces confusion and security gaps

3. **You Have the Key!**
   - You already found MERKOS_JWT_SECRET_KEY
   - No additional infrastructure needed
   - Just add to environment variables

4. **Low Implementation Cost**
   - Same complexity as Option 2
   - Just use `jwt.verify` instead of `jwt.decode`
   - One line of code difference

5. **Protects Against Real Attacks**
   - Token tampering (attacker modifies user data)
   - Token forgery (attacker creates fake tokens)
   - Privilege escalation (attacker grants themselves admin)

---

## 🔧 Implementation Guide

### Step 1: Add MERKOS_JWT_SECRET_KEY to Environment

```bash
# .env.local
MERKOS_JWT_SECRET_KEY="your-secret-key-from-merkos-platform"
```

### Step 2: Install jsonwebtoken

```bash
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

### Step 3: Implement Verified Endpoint

```typescript
// pages/api/sso/remote/status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  user: {
    id: string;
    email: string;
    name: string;
    [key: string]: any;
  };
  exp: number;
  iat: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      status: 'error',
      error: 'token is required'
    });
  }

  try {
    // Verify JWT signature and expiration
    const decoded = jwt.verify(
      token,
      process.env.MERKOS_JWT_SECRET_KEY!
    ) as JWTPayload;

    if (!decoded.user) {
      return res.status(401).json({
        status: 'error',
        error: 'Invalid token structure'
      });
    }

    // Set HTTP-only cookie on .chabaduniverse.com domain
    res.setHeader('Set-Cookie', [
      `x-auth-token=${token}; ` +
      `Max-Age=${60 * 60 * 24 * 14}; ` +  // 14 days
      `Path=/; ` +
      `Domain=.chabaduniverse.com; ` +
      `HttpOnly; ` +
      `Secure; ` +
      `SameSite=Lax`
    ]);

    return res.status(200).json({
      status: 'success',
      user: decoded.user
    });

  } catch (error) {
    console.error('JWT verification failed:', error);

    return res.status(401).json({
      status: 'error',
      error: 'Token validation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

---

## 🧪 Testing Verification

### Test 1: Valid Token (Should Succeed)

```bash
# Get token from Merkos
TOKEN=$(curl -X GET 'https://id.merkos302.com/apiv4/users/sso/remote/status' \
  --cookie 'x-auth-token=YOUR_TOKEN' | jq -r '.token')

# Send to portal
curl -X POST 'http://localhost:3000/api/sso/remote/status' \
  -H 'Content-Type: application/json' \
  -d "{\"token\": \"$TOKEN\"}"

# Expected: 200 OK with Set-Cookie header
```

### Test 2: Tampered Token (Should Fail)

```bash
# Create fake token with modified payload
FAKE_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiYWRtaW4ifX0.FAKE_SIGNATURE"

curl -X POST 'http://localhost:3000/api/sso/remote/status' \
  -H 'Content-Type: application/json' \
  -d "{\"token\": \"$FAKE_TOKEN\"}"

# Expected: 401 Unauthorized with "Token validation failed"
```

### Test 3: Expired Token (Should Fail)

```bash
# Create token with past expiration
# (Use jwt.io to create one with exp in the past)

curl -X POST 'http://localhost:3000/api/sso/remote/status' \
  -H 'Content-Type: application/json' \
  -d "{\"token\": \"EXPIRED_TOKEN\"}"

# Expected: 401 Unauthorized with "jwt expired"
```

---

## 📊 Security Comparison

| Aspect | With Verification | Without Verification |
|--------|------------------|----------------------|
| Token Tampering | ✅ Protected | ❌ Vulnerable |
| Token Forgery | ✅ Protected | ❌ Vulnerable |
| Privilege Escalation | ✅ Protected | ❌ Vulnerable |
| Expiration Check | ✅ Automatic | ⚠️ Manual |
| HTTPS Requirement | ✅ Yes | ✅ Yes |
| Implementation | ✅ Simple | ✅ Simple |
| Key Management | ⚠️ Required | ✅ Not needed |
| Merkos Consistency | ✅ Matches | ❌ Differs |
| Industry Standard | ✅ Yes | ❌ No |

---

## 🎯 Final Recommendation

**Use JWT verification with MERKOS_JWT_SECRET_KEY**

**Why:**
1. ✅ You already have the key
2. ✅ Implementation is simple (just use `jwt.verify`)
3. ✅ Prevents real security vulnerabilities
4. ✅ Matches Merkos Platform's approach
5. ✅ Industry best practice

**When you might skip verification:**
- Never in production
- Only if this is a proof-of-concept
- Only if you absolutely trust all clients
- Only if tokens contain no sensitive data

**In your case:** Since users have roles, permissions, and personal data in the JWT, **you MUST verify signatures**.

---

## 🚀 Next Steps

1. ✅ You found MERKOS_JWT_SECRET_KEY
2. Add it to `.env.local`
3. Implement Option 1 (Full JWT Verification)
4. Test with valid, tampered, and expired tokens
5. Deploy to production

---

**Document Version:** 1.0.0
**Last Updated:** December 23, 2025
**Recommendation:** ✅ USE MERKOS_JWT_SECRET_KEY FOR VERIFICATION
