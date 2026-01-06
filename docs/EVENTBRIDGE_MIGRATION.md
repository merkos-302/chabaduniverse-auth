# EventBridge Migration Plan

## Executive Summary

This document outlines the migration path from the current **polling-based synchronization** system to a future **event-driven architecture** using Amazon EventBridge (or similar event bus systems).

**Status:** FUTURE ENHANCEMENT - Not blocking for v0.1.0 release
**Target Version:** v0.2.0 or later
**Estimated Effort:** 3-4 weeks (full migration)

---

## Current Architecture (v0.1.0)

### Polling-Based Synchronization

The current implementation uses **AdaptivePoller** to periodically sync data:

```typescript
// Current: AdaptivePoller with intelligent intervals
const poller = new AdaptivePoller({
  defaultInterval: 30000, // 30 seconds
  activeInterval: 10000,  // 10 seconds (when user is active)
  idleInterval: 60000,    // 60 seconds (when user is idle)
  idleTimeout: 300000,    // 5 minutes before switching to idle
  onPoll: async () => {
    // Execute sync strategies
    await profileSync();
    await preferencesSync();
    await activityFlush();
  }
});
```

**Characteristics:**
- ✅ **Simple:** Easy to understand and implement
- ✅ **Predictable:** Fixed intervals with adaptive behavior
- ✅ **Reliable:** No external dependencies beyond HTTP
- ❌ **Inefficient:** Polls even when no changes occur
- ❌ **Delayed:** Updates only detected at next poll cycle
- ❌ **Resource-intensive:** Constant polling load on servers

---

## Target Architecture (EventBridge)

### Event-Driven Synchronization

Future implementation will use **event streams** to trigger real-time sync:

```typescript
// Future: EventBridge subscription model
const eventBridge = new EventBridgeClient({
  events: {
    'profile.updated': handleProfileUpdate,
    'preferences.changed': handlePreferencesUpdate,
    'activity.threshold': handleActivityFlush
  },
  fallbackPoller: {
    // Fallback to polling if EventBridge unavailable
    interval: 300000, // 5 minutes (much less frequent)
  }
});
```

**Characteristics:**
- ✅ **Real-time:** Instant updates via push notifications
- ✅ **Efficient:** Only syncs when actual changes occur
- ✅ **Scalable:** Reduces server load dramatically
- ✅ **Flexible:** Can handle complex event patterns
- ❌ **Complex:** Requires event infrastructure
- ❌ **Dependency:** Adds external service requirement

---

## Migration Strategy

### Phase 1: Preparation (v0.1.5)

**Goal:** Add event system foundation without breaking changes

#### 1.1 Create Event Type Definitions

```typescript
// src/events/types.ts

/**
 * Base event interface
 */
export interface ChabadUniverseAuthEvent {
  /** Event type */
  type: string;
  /** Event payload */
  payload: any;
  /** Event timestamp */
  timestamp: Date;
  /** User ID (if applicable) */
  userId?: string;
  /** App ID (if applicable) */
  appId?: string;
}

/**
 * Profile events
 */
export type ProfileEvent =
  | { type: 'profile.created'; payload: Profile }
  | { type: 'profile.updated'; payload: Partial<Profile> }
  | { type: 'profile.deleted'; payload: { userId: string } };

/**
 * Preferences events
 */
export type PreferencesEvent =
  | { type: 'preferences.updated'; payload: Partial<Preferences> }
  | { type: 'preferences.widget.moved'; payload: { widgetId: string; position: WidgetPosition } }
  | { type: 'preferences.theme.changed'; payload: { theme: Theme } };

/**
 * Activity events
 */
export type ActivityEvent =
  | { type: 'activity.batch.ready'; payload: ActivityBatch }
  | { type: 'activity.threshold.reached'; payload: { count: number } };

/**
 * All auth events
 */
export type AuthEvent = ProfileEvent | PreferencesEvent | ActivityEvent;
```

#### 1.2 Create Event Emitter Abstraction

```typescript
// src/events/EventEmitter.ts

export interface EventEmitterConfig {
  /** Whether to use EventBridge (when available) */
  useEventBridge: boolean;
  /** EventBridge configuration */
  eventBridgeConfig?: EventBridgeConfig;
  /** Fallback to in-memory events */
  fallbackToMemory: boolean;
}

export class EventEmitter {
  private listeners: Map<string, Set<Function>>;
  private eventBridgeClient?: EventBridgeClient;

  constructor(config: EventEmitterConfig) {
    this.listeners = new Map();

    if (config.useEventBridge && config.eventBridgeConfig) {
      this.eventBridgeClient = new EventBridgeClient(config.eventBridgeConfig);
    }
  }

  /**
   * Emit an event (dual-mode: local + EventBridge)
   */
  async emit(event: AuthEvent): Promise<void> {
    // Emit locally
    this.emitLocal(event);

    // Emit to EventBridge if configured
    if (this.eventBridgeClient) {
      await this.eventBridgeClient.publish(event);
    }
  }

  /**
   * Subscribe to events
   */
  on(eventType: string, handler: Function): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(handler);
    };
  }

  private emitLocal(event: AuthEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(handler => handler(event));
    }
  }
}
```

#### 1.3 Update Contexts to Emit Events

```typescript
// Example: ProfileContext with event emission

export function ProfileProvider({ children, userId, config }: ProfileProviderProps) {
  const [state, setState] = useState<ProfileState>(/* ... */);
  const eventEmitter = useContext(EventEmitterContext); // New context

  const updateProfile = useCallback(async (updates: ProfileUpdatePayload) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiBaseUrl}/api/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates }),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const { data } = await response.json();
      const profile = mapProfileFromApi(data);

      setState(prev => ({
        ...prev,
        profile,
        isLoading: false,
      }));

      // ✨ NEW: Emit profile.updated event
      await eventEmitter.emit({
        type: 'profile.updated',
        payload: updates,
        timestamp: new Date(),
        userId,
      });

      // Update cache
      if (config.enableCache) {
        cacheProfile(userId, profile);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }, [userId, apiBaseUrl, config.enableCache, eventEmitter]);

  return (
    <ProfileContext.Provider value={{ /* ... */ }}>
      {children}
    </ProfileContext.Provider>
  );
}
```

**Deliverables:**
- [ ] Event type definitions (`src/events/types.ts`)
- [ ] EventEmitter abstraction (`src/events/EventEmitter.ts`)
- [ ] EventEmitterContext provider
- [ ] Update all contexts to emit events on mutations
- [ ] Backward compatibility maintained (events optional)

---

### Phase 2: Hybrid Mode (v0.2.0)

**Goal:** Run polling AND events simultaneously for validation

#### 2.1 Dual-Mode SyncManager

```typescript
// src/sync/SyncManager.ts (updated)

export class SyncManager {
  private poller: AdaptivePoller;
  private eventEmitter: EventEmitter;
  private mode: 'polling-only' | 'hybrid' | 'events-only';

  constructor(options: SyncManagerOptions) {
    this.mode = options.mode ?? 'polling-only'; // Default to current behavior

    // Always create poller (for fallback)
    this.poller = new AdaptivePoller({
      defaultInterval: this.mode === 'events-only' ? 300000 : options.defaultInterval,
      activeInterval: options.activeInterval,
      idleInterval: options.idleInterval,
      idleTimeout: options.idleTimeout,
      onPoll: () => this.executeSyncStrategies(),
      onError: options.onError,
    });

    // Create event emitter if not polling-only
    if (this.mode !== 'polling-only') {
      this.eventEmitter = new EventEmitter({
        useEventBridge: true,
        eventBridgeConfig: options.eventBridgeConfig,
        fallbackToMemory: true,
      });

      this.subscribeToEvents();
    }
  }

  private subscribeToEvents(): void {
    // Profile events
    this.eventEmitter.on('profile.updated', (event: ProfileEvent) => {
      this.executeStrategy('profile');
    });

    // Preferences events
    this.eventEmitter.on('preferences.updated', (event: PreferencesEvent) => {
      this.executeStrategy('preferences');
    });

    // Activity events
    this.eventEmitter.on('activity.batch.ready', (event: ActivityEvent) => {
      this.executeStrategy('activity');
    });
  }

  start(): void {
    if (this.mode === 'events-only') {
      // Don't start poller, rely on events only
      console.log('[SyncManager] Starting in events-only mode');
    } else {
      // Start poller (polling-only or hybrid)
      this.poller.start();
      console.log(`[SyncManager] Starting in ${this.mode} mode`);
    }
  }
}
```

**Configuration:**

```typescript
// User can choose mode via config

const config = mergeConfig({
  sync: {
    enabled: true,
    mode: 'hybrid', // 'polling-only' | 'hybrid' | 'events-only'
    defaultInterval: 30000,
    // ... other options
  },
  eventBridge: {
    enabled: true,
    endpoint: 'wss://events.chabaduniverse.com',
    reconnect: true,
  }
});
```

**Deliverables:**
- [ ] Hybrid SyncManager implementation
- [ ] EventBridge client integration
- [ ] Validation logging (compare polling vs events)
- [ ] Configuration options for mode selection
- [ ] Monitoring and metrics for both modes

---

### Phase 3: Events-First (v0.3.0)

**Goal:** Default to events-only with polling as fallback

#### 3.1 Default Configuration Change

```typescript
export const defaultConfig: ChabadUniverseAuthConfig = {
  sync: {
    enabled: true,
    mode: 'events-only', // ✨ Changed from 'polling-only'
    defaultInterval: 300000, // ✨ Much less frequent (5 minutes)
    activeInterval: 60000,   // ✨ Less frequent
    idleInterval: 600000,    // ✨ Much less frequent (10 minutes)
    // ...
  },
  eventBridge: {
    enabled: true,
    endpoint: process.env.EVENTBRIDGE_ENDPOINT,
    reconnect: true,
    heartbeatInterval: 30000, // 30 seconds
  },
  // ...
};
```

#### 3.2 Automatic Fallback

```typescript
export class SyncManager {
  private eventBridgeHealthy: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  start(): void {
    if (this.mode === 'events-only') {
      // Start event listener
      this.startEventListener();

      // Start health check
      this.startHealthCheck();
    } else {
      this.poller.start();
    }
  }

  private async startHealthCheck(): Promise<void> {
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.eventEmitter.healthCheck();

      if (!isHealthy && this.eventBridgeHealthy) {
        // EventBridge just became unhealthy - start fallback polling
        console.warn('[SyncManager] EventBridge unhealthy, starting fallback polling');
        this.poller.start();
      } else if (isHealthy && !this.eventBridgeHealthy) {
        // EventBridge recovered - stop fallback polling
        console.log('[SyncManager] EventBridge recovered, stopping fallback polling');
        this.poller.stop();
      }

      this.eventBridgeHealthy = isHealthy;
    }, 30000); // Check every 30 seconds
  }
}
```

**Deliverables:**
- [ ] EventBridge as default mode
- [ ] Automatic fallback to polling on EventBridge failure
- [ ] Health check system
- [ ] Alerting for EventBridge issues
- [ ] Gradual rollout with feature flags

---

### Phase 4: Deprecation (v0.4.0+)

**Goal:** Remove polling-only mode entirely

#### 4.1 Configuration Migration

```typescript
// Old config (deprecated)
const config = {
  sync: {
    mode: 'polling-only', // ❌ No longer supported
  }
};

// New config (required)
const config = {
  sync: {
    // No mode option - events-only with automatic fallback
  },
  eventBridge: {
    enabled: true, // Required
    endpoint: '...', // Required
  }
};
```

#### 4.2 Remove AdaptivePoller

- Move AdaptivePoller to `src/sync/legacy/` (for reference)
- Remove from main export
- Update all documentation
- Provide migration guide

**Deliverables:**
- [ ] Deprecation notices in v0.3.x
- [ ] Migration guide for users on polling-only
- [ ] Remove polling code in v0.4.0
- [ ] Simplify SyncManager (no mode selection)

---

## Benefits Analysis

### Performance Improvements

| Metric | Polling (Current) | EventBridge (Future) | Improvement |
|--------|------------------|---------------------|-------------|
| **Avg Sync Delay** | 15 seconds | < 1 second | **15x faster** |
| **Server Requests** | 120/hour | ~2/hour | **60x reduction** |
| **Bandwidth Usage** | High | Low | **90% reduction** |
| **Battery Impact** | Moderate | Low | **50% improvement** |
| **Real-time Feel** | No | Yes | **UX enhancement** |

### Cost Analysis

**Current (Polling):**
- 1000 users × 120 requests/hour × 24 hours = **2,880,000 requests/day**
- Server load: **High** (constant polling)
- Cost: **$X/month** (API gateway + compute)

**Future (EventBridge):**
- 1000 users × 10 events/hour × 24 hours = **240,000 events/day**
- Server load: **Low** (event-driven)
- Cost: **$Y/month** (EventBridge + compute)
- **Savings: ~75%** (estimated)

---

## Technical Considerations

### EventBridge Options

#### Option 1: Amazon EventBridge
**Pros:**
- Fully managed service
- Built-in retry and DLQ
- Extensive AWS integrations
- High scalability

**Cons:**
- AWS vendor lock-in
- Additional cost
- Learning curve

#### Option 2: Self-Hosted (RabbitMQ / Kafka)
**Pros:**
- Full control
- No vendor lock-in
- Lower cost at scale

**Cons:**
- Operational overhead
- Requires infrastructure expertise
- More complex deployment

#### Option 3: Hybrid (Pusher / Ably)
**Pros:**
- Managed service
- WebSocket support
- Good DX

**Cons:**
- Cost at scale
- Less flexible than EventBridge

**Recommendation:** Start with **Amazon EventBridge** for Phase 1-2, evaluate alternatives in Phase 3 based on scale and cost.

---

## Migration Checklist

### Phase 1: Preparation
- [ ] Define all event types
- [ ] Create EventEmitter abstraction
- [ ] Update contexts to emit events
- [ ] Add EventEmitterContext provider
- [ ] Write event emission tests
- [ ] Document event schema

### Phase 2: Hybrid Mode
- [ ] Implement dual-mode SyncManager
- [ ] Integrate EventBridge client
- [ ] Add configuration options
- [ ] Implement validation logging
- [ ] Run A/B test (10% events, 90% polling)
- [ ] Monitor and compare metrics

### Phase 3: Events-First
- [ ] Change default mode to events-only
- [ ] Implement automatic fallback
- [ ] Add health check system
- [ ] Create alerting for EventBridge issues
- [ ] Gradual rollout (25% → 50% → 75% → 100%)
- [ ] Monitor error rates and latency

### Phase 4: Deprecation
- [ ] Add deprecation warnings for polling-only mode
- [ ] Create migration guide
- [ ] Notify users via changelog
- [ ] Remove polling code in v0.4.0
- [ ] Update all documentation
- [ ] Celebrate! 🎉

---

## Risk Mitigation

### Risk 1: EventBridge Downtime
**Mitigation:** Automatic fallback to polling (Phase 3)

### Risk 2: Event Loss
**Mitigation:**
- Implement retry logic with exponential backoff
- Use DLQ (Dead Letter Queue) for failed events
- Periodic polling as safety net

### Risk 3: Event Ordering
**Mitigation:**
- Add sequence numbers to events
- Use event sourcing patterns for critical data
- Implement conflict resolution

### Risk 4: Increased Complexity
**Mitigation:**
- Comprehensive documentation
- Example implementations
- Monitoring dashboards
- Rollback plan at each phase

---

## Testing Strategy

### Unit Tests
- Event emission from contexts
- EventEmitter local mode
- SyncManager mode switching
- Fallback behavior

### Integration Tests
- End-to-end event flow
- EventBridge connectivity
- Retry and error handling
- Polling fallback activation

### Performance Tests
- Event latency (p50, p95, p99)
- Throughput under load
- Memory usage (local vs events)
- Battery impact on mobile

### Chaos Engineering
- EventBridge failure scenarios
- Network partition tests
- Race condition testing
- Concurrent event handling

---

## Success Metrics

### Technical Metrics
- ✅ Event latency < 1 second (p95)
- ✅ Event success rate > 99.9%
- ✅ Server requests reduced by 90%+
- ✅ Zero data loss during migration

### Business Metrics
- ✅ Infrastructure cost reduced by 70%+
- ✅ User-perceived speed increased by 10x
- ✅ Battery life improved by 50%+
- ✅ Zero customer complaints about sync delays

---

## Conclusion

The migration from polling-based to event-driven synchronization is a **strategic investment** that will:

1. **Dramatically improve** real-time responsiveness
2. **Reduce** infrastructure costs by ~75%
3. **Enhance** user experience with instant updates
4. **Scale** efficiently as user base grows

**Recommended Timeline:**
- **v0.1.0** (Current): Polling-only ✅
- **v0.1.5** (Q2 2026): Add event foundation
- **v0.2.0** (Q3 2026): Hybrid mode with A/B testing
- **v0.3.0** (Q4 2026): Events-first with automatic fallback
- **v0.4.0** (Q1 2027): Full EventBridge, deprecate polling

**Status:** This document serves as the strategic roadmap. Implementation will begin in v0.1.5 with non-breaking changes.

---

## References

- [Amazon EventBridge Documentation](https://docs.aws.amazon.com/eventbridge/)
- [Event-Driven Architecture Patterns](https://martinfowler.com/articles/201701-event-driven.html)
- [Polling vs WebSockets vs Server-Sent Events](https://ably.com/topic/websockets-vs-http-polling)
- [Event Sourcing Pattern](https://microservices.io/patterns/data/event-sourcing.html)

---

**Document Version:** 1.0
**Last Updated:** January 4, 2026
**Author:** @chabaduniverse/auth team
**Status:** APPROVED for future implementation
