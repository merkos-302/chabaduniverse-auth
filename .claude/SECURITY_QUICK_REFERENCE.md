# Security Quick Reference Card

**For Phase 5B Authentication Methods Implementation**

## DO's ✅

### Credential Handling
```typescript
// ✅ Validate inputs
if (!token || typeof token !== 'string') {
  throw new AuthError('Invalid token', AuthErrorCode.TOKEN_INVALID);
}

// ✅ Call setToken AFTER successful API response
const response = await this.v2Request(...);
if (response.token) {
  this.setToken(response.token);
}

// ✅ Generic error messages
throw new AuthError(
  'Invalid username or password',  // Don't reveal which is wrong
  AuthErrorCode.INVALID_CREDENTIALS
);
```

### Logging (When Fixed)
```typescript
// ✅ Safe logging (no sensitive data)
logger.info('[Auth] Login attempt initiated');
logger.info('[Auth] Login successful', { method: 'credentials' });
```

### Testing
```typescript
// ✅ Security tests
it('should not log credentials', async () => {
  const spy = jest.spyOn(console, 'log');
  await adapter.loginWithCredentials('user', 'pass').catch(() => {});
  expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('pass'));
});
```

## DON'Ts ❌

### Credential Handling
```typescript
// ❌ Never log credentials
console.log('Login with', username, password);
console.log('Token:', token);
console.log('Token preview:', token.substring(0, 10));

// ❌ Don't reveal which credential is wrong
throw new Error('Username not found');
throw new Error('Password incorrect');

// ❌ Don't call setToken before validation
this.setToken(token);  // Wrong order!
await this.v2Request(...);
```

### Error Messages
```typescript
// ❌ Don't expose sensitive data in errors
throw new Error(`Failed to login user ${email}`);
throw new Error(`Invalid token: ${token}`);

// ❌ Don't include credentials in error details
throw new AuthError('Login failed', code, { username, password });
```

### Testing
```typescript
// ❌ Don't use real credentials
const realApiKey = 'sk_live_abc123...';  // NEVER!

// ❌ Don't commit sensitive data
password: process.env.MY_PASSWORD  // Use fake data in tests
```

## Security Checklist Per Method

### loginWithBearerToken
- [ ] Validate token is non-empty string
- [ ] Never log token (no previews, no lengths)
- [ ] Validate siteId format if provided
- [ ] setToken() only after successful response
- [ ] Generic error messages
- [ ] Security tests added

### loginWithCredentials
- [ ] Validate username and password exist
- [ ] Never log credentials
- [ ] Validate siteId format if provided
- [ ] Generic error (don't reveal valid usernames)
- [ ] setToken() only after successful response
- [ ] Security tests added

### loginWithGoogle
- [ ] Validate OAuth code format
- [ ] Never log OAuth code
- [ ] Validate host is HTTPS
- [ ] Validate siteId format if provided
- [ ] setToken() only after successful response
- [ ] Security tests added

### loginWithChabadOrg
- [ ] Validate SSO key exists
- [ ] Never log SSO key
- [ ] Validate siteId format if provided
- [ ] setToken() only after successful response
- [ ] Security tests added

## Common Patterns

### Input Validation
```typescript
// Required string parameter
if (!param || typeof param !== 'string') {
  throw new AuthError('Invalid parameter', AuthErrorCode.INVALID_CREDENTIALS);
}

// Optional parameter (siteId, host)
if (param !== null && param !== undefined) {
  if (typeof param !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(param)) {
    throw new AuthError('Invalid format', AuthErrorCode.UNKNOWN_ERROR);
  }
}
```

### API Call Pattern
```typescript
try {
  const response = await this.v2Request<AuthResponse>(
    'auth',
    'auth:service:method',
    { ...params }
  );
  
  if (response.token) {
    this.setToken(response.token);  // Only after success!
  }
  
  return response;
} catch (error) {
  throw new AuthError(
    'Generic error message',  // Don't expose details
    AuthErrorCode.INVALID_CREDENTIALS,
    error  // Original error for debugging
  );
}
```

### Security Test Pattern
```typescript
describe('Security', () => {
  it('should not log sensitive data', async () => {
    const logSpy = jest.spyOn(console, 'log');
    const infoSpy = jest.spyOn(console, 'info');
    
    await adapter.methodName('sensitive-value').catch(() => {});
    
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('sensitive-value')
    );
  });
  
  it('should not expose credentials in error messages', async () => {
    try {
      await adapter.methodName('credential');
    } catch (error) {
      expect(error.message).not.toContain('credential');
    }
  });
});
```

## Pre-Commit Checklist

Before committing Phase 5B code:

- [ ] No console.log/info/debug with sensitive data
- [ ] All parameters validated
- [ ] Generic error messages (no credential exposure)
- [ ] setToken() only after successful API response
- [ ] Security tests added for each method
- [ ] Run: `npm test` (all tests pass)
- [ ] Run: `npm run lint` (no errors)
- [ ] Run: `npm audit` (no vulnerabilities)

## Quick Security Scan

```bash
# Check for console.log statements
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx"

# Check for exposed passwords
grep -r "password" src/ --include="*.ts" --include="*.tsx" | grep -v "\/\/"

# Check for hardcoded tokens
grep -r "Bearer [A-Za-z0-9_-]\{20,\}" src/

# Run security audit
npm audit
```

## Critical Reminders

1. **NEVER log credentials** - Not even previews or lengths
2. **Validate BEFORE using** - Don't trust input parameters
3. **setToken AFTER success** - Never set token before API validates
4. **Generic error messages** - Don't reveal what's wrong specifically
5. **Add security tests** - Test that credentials aren't logged

## Resources

- Full Report: `SECURITY_REVIEW_PHASE_5B.md`
- Summary: `SECURITY_REVIEW_SUMMARY.md`
- Implementation Guide: See Section 3 in full report
- Test Examples: See Section 4.2 in full report

---

**When in doubt: Don't log it, validate it, and keep errors generic.**
