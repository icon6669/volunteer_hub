import { Event, SystemSettings } from '../types';
import { services } from '../services';
import { supabase } from '../lib/supabase';
import { handleDbError } from '../lib/supabase';

// This adapter connects the existing service implementations with the API functions
// that are expected by the context components

/**
 * Fetch events using the EventService
 */
export const fetchEvents = async (): Promise<Event[]> => {
  try {
    return await services.events.getEvents();
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

/**
 * Save an event using the EventService
 */
export const saveEvent = async (event: Event): Promise<Event> => {
  try {
    // For new events (create)
    if (!event.id) {
      return await services.events.createEvent(event);
    }
    // For existing events (update)
    return await services.events.updateEvent(event.id, event);
  } catch (error) {
    console.error('Error saving event:', error);
    throw error;
  }
};

/**
 * Update an event using the EventService
 */
export const updateEvent = async (event: Event): Promise<boolean> => {
  try {
    await services.events.updateEvent(event.id, event);
    return true;
  } catch (error) {
    console.error('Error updating event:', error);
    return false;
  }
};

/**
 * Delete an event using the EventService
 */
export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    await services.events.deleteEvent(eventId);
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
};

/**
 * Fetch system settings from the database
 */
export const fetchSettings = async (): Promise<SystemSettings> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();
    
    if (error) throw error;
    
    return {
      googleAuthEnabled: data.google_auth_enabled,
      googleClientId: data.google_client_id || '',
      googleClientSecret: data.google_client_secret || '',
      facebookAuthEnabled: data.facebook_auth_enabled,
      facebookAppId: data.facebook_app_id || '',
      facebookAppSecret: data.facebook_app_secret || '',
      organizationName: data.organization_name,
      organizationLogo: data.organization_logo || '',
      primaryColor: data.primary_color,
      allowPublicEventViewing: data.allow_public_event_viewing,
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};

/**
 * Save system settings to the database
 */
export const saveSettings = async (settings: SystemSettings): Promise<boolean> => {
  try {
    const { data: existingSettings } = await supabase
      .from('system_settings')
      .select('id')
      .single();
    
    const dbSettings = {
      google_auth_enabled: settings.googleAuthEnabled,
      google_client_id: settings.googleClientId,
      google_client_secret: settings.googleClientSecret,
      facebook_auth_enabled: settings.facebookAuthEnabled,
      facebook_app_id: settings.facebookAppId,
      facebook_app_secret: settings.facebookAppSecret,
      organization_name: settings.organizationName,
      organization_logo: settings.organizationLogo,
      primary_color: settings.primaryColor,
      allow_public_event_viewing: settings.allowPublicEventViewing,
    };

    const { error } = existingSettings
      ? await supabase
          .from('system_settings')
          .update(dbSettings)
          .eq('id', existingSettings.id)
      : await supabase
          .from('system_settings')
          .insert([dbSettings]);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};
