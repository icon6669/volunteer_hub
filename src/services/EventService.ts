import { BaseService } from './BaseService';
import { Event } from '../types';
import { Database } from '../types/supabase';

export class EventService extends BaseService {
  private readonly TABLE = 'events';

  async getEvents(): Promise<Event[]> {
    // Try cache first
    const cachedEvents = this.cache.getActiveEvents();
    if (cachedEvents.length > 0) {
      return cachedEvents;
    }

    // If not in cache, fetch from Supabase
    const events = await this.handleQuery<Database['public']['Tables']['events']['Row'][]>(
      () => this.supabase.from(this.TABLE).select('*'),
      'getEvents'
    );

    // Transform and cache the results
    const transformedEvents = events.map(this.transformEvent);
    this.cache.setActiveEvents(transformedEvents);

    return transformedEvents;
  }

  async getEvent(id: string): Promise<Event> {
    // Try cache first
    const cachedEvent = this.cache.getEvent(id);
    if (cachedEvent) {
      return cachedEvent;
    }

    // If not in cache, fetch from Supabase
    const event = await this.handleQuery<Database['public']['Tables']['events']['Row']>(
      () => this.supabase.from(this.TABLE).select('*').eq('id', id).single(),
      'getEvent'
    );

    // Transform and cache the result
    const transformedEvent = this.transformEvent(event);
    this.cache.setEvent(transformedEvent);

    return transformedEvent;
  }

  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const newEvent = await this.handleQuery<Database['public']['Tables']['events']['Row']>(
      () => this.supabase.from(this.TABLE).insert([event]).select().single(),
      'createEvent'
    );

    const transformedEvent = this.transformEvent(newEvent);
    
    // Update cache
    const cachedEvents = this.cache.getActiveEvents();
    this.cache.setActiveEvents([...cachedEvents, transformedEvent]);
    this.cache.setEvent(transformedEvent);

    return transformedEvent;
  }

  async updateEvent(id: string, event: Partial<Event>): Promise<Event> {
    const updatedEvent = await this.handleQuery<Database['public']['Tables']['events']['Row']>(
      () => this.supabase.from(this.TABLE).update(event).eq('id', id).select().single(),
      'updateEvent'
    );

    const transformedEvent = this.transformEvent(updatedEvent);
    
    // Update cache
    this.cache.setEvent(transformedEvent);
    const cachedEvents = this.cache.getActiveEvents();
    const updatedEvents = cachedEvents.map(e => e.id === id ? transformedEvent : e);
    this.cache.setActiveEvents(updatedEvents);

    return transformedEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    await this.handleQuery<null>(
      () => this.supabase.from(this.TABLE).delete().eq('id', id),
      'deleteEvent'
    );

    // Update cache
    const cachedEvents = this.cache.getActiveEvents();
    this.cache.setActiveEvents(cachedEvents.filter(e => e.id !== id));
    this.cache.clearCache('eventCache');
  }

  private transformEvent(event: Database['public']['Tables']['events']['Row']): Event {
    return {
      id: event.id,
      name: event.name,
      date: event.date,
      location: event.location,
      description: event.description,
      landingPageEnabled: event.landing_page_enabled,
      landingPageTitle: event.landing_page_title,
      landingPageDescription: event.landing_page_description,
      landingPageImage: event.landing_page_image,
      landingPageTheme: event.landing_page_theme,
      customUrl: event.custom_url,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    };
  }
}
