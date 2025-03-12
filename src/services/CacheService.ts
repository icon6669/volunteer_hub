import { Event, SystemSettings } from '../types';

/**
 * Service for caching application data to reduce database calls
 */
export class CacheService {
  private static instance: CacheService;
  private eventCache: Map<string, Event> = new Map();
  private activeEventsCache: Event[] = [];
  private settingsCache: SystemSettings | null = null;
  
  private constructor() {}
  
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }
  
  // Event caching methods
  getEvent(id: string): Event | undefined {
    return this.eventCache.get(id);
  }
  
  setEvent(event: Event): void {
    this.eventCache.set(event.id, event);
  }
  
  getActiveEvents(): Event[] {
    return this.activeEventsCache;
  }
  
  setActiveEvents(events: Event[]): void {
    this.activeEventsCache = events;
    // Also update individual event cache
    events.forEach(event => this.setEvent(event));
  }
  
  // Settings caching methods
  getSettings(): SystemSettings | null {
    return this.settingsCache;
  }
  
  setSettings(settings: SystemSettings): void {
    this.settingsCache = settings;
  }
  
  // Cache management
  clearCache(cacheType?: 'eventCache' | 'settingsCache'): void {
    if (!cacheType || cacheType === 'eventCache') {
      this.eventCache.clear();
      this.activeEventsCache = [];
    }
    
    if (!cacheType || cacheType === 'settingsCache') {
      this.settingsCache = null;
    }
  }
}

export const cacheService = CacheService.getInstance();
