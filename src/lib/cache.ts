import { Event, User, SystemSettings } from '../types';

class Cache {
  private static instance: Cache;
  private storage: Storage;
  private cacheKeys = {
    currentUser: 'vh_current_user',
    systemSettings: 'vh_system_settings',
    activeEvents: 'vh_active_events',
    eventCache: 'vh_event_',  // Prefix for individual events
    userCache: 'vh_user_'     // Prefix for individual users
  };
  private cacheTTL = {
    systemSettings: 1000 * 60 * 60,     // 1 hour
    activeEvents: 1000 * 60 * 5,        // 5 minutes
    eventDetails: 1000 * 60 * 15,       // 15 minutes
    userDetails: 1000 * 60 * 30         // 30 minutes
  };

  private constructor() {
    this.storage = window.localStorage;
  }

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  private getCacheItem<T>(key: string): { data: T | null; expired: boolean } {
    const item = this.storage.getItem(key);
    if (!item) return { data: null, expired: true };

    const { data, timestamp, ttl } = JSON.parse(item);
    const expired = Date.now() - timestamp > ttl;

    return { data: expired ? null : data, expired };
  }

  private setCacheItem<T>(key: string, data: T, ttl: number): void {
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl
    };
    this.storage.setItem(key, JSON.stringify(cacheData));
  }

  // System Settings
  getSystemSettings(): SystemSettings | null {
    const { data } = this.getCacheItem<SystemSettings>(this.cacheKeys.systemSettings);
    return data;
  }

  setSystemSettings(settings: SystemSettings): void {
    this.setCacheItem(this.cacheKeys.systemSettings, settings, this.cacheTTL.systemSettings);
  }

  // Active Events
  getActiveEvents(): Event[] {
    const { data } = this.getCacheItem<Event[]>(this.cacheKeys.activeEvents);
    return data || [];
  }

  setActiveEvents(events: Event[]): void {
    this.setCacheItem(this.cacheKeys.activeEvents, events, this.cacheTTL.activeEvents);
  }

  // Individual Event
  getEvent(eventId: string): Event | null {
    const { data } = this.getCacheItem<Event>(`${this.cacheKeys.eventCache}${eventId}`);
    return data;
  }

  setEvent(event: Event): void {
    this.setCacheItem(
      `${this.cacheKeys.eventCache}${event.id}`,
      event,
      this.cacheTTL.eventDetails
    );
  }

  // User Details
  getUser(userId: string): User | null {
    const { data } = this.getCacheItem<User>(`${this.cacheKeys.userCache}${userId}`);
    return data;
  }

  setUser(user: User): void {
    this.setCacheItem(
      `${this.cacheKeys.userCache}${user.id}`,
      user,
      this.cacheTTL.userDetails
    );
  }

  // Clear specific cache
  clearCache(type: keyof typeof Cache.prototype.cacheKeys): void {
    const prefix = this.cacheKeys[type];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(prefix)) {
        this.storage.removeItem(key);
      }
    }
  }

  // Clear all cache
  clearAllCache(): void {
    Object.values(this.cacheKeys).forEach(prefix => {
      this.clearCache(prefix as keyof typeof Cache.prototype.cacheKeys);
    });
  }
}

export const cache = Cache.getInstance();
