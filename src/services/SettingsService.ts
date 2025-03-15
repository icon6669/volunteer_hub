import { BaseService } from './BaseService';
import { SystemSettings } from '../types';
import { Database } from '../types/supabase';

export class SettingsService extends BaseService {
  private readonly TABLE = 'system_settings';

  async getSettings(): Promise<SystemSettings> {
    // Try cache first
    const cachedSettings = this.cache.getSettings();
    if (cachedSettings) {
      return cachedSettings;
    }

    // If not in cache, fetch from Supabase
    const settings = await this.handleQuery<Database['public']['Tables']['system_settings']['Row']>(
      () => this.supabase.from(this.TABLE).select('*').eq('key', 'settings').single(),
      'getSettings'
    );

    // Transform and cache the result
    const transformedSettings = this.transformSettings(settings);
    this.cache.setSettings(transformedSettings);

    return transformedSettings;
  }

  async updateSettings(settings: SystemSettings): Promise<SystemSettings> {
    // Check if settings already exist
    const { data: existingSettings } = await this.supabase
      .from(this.TABLE)
      .select('id')
      .eq('key', 'settings')
      .single();

    // Prepare settings for database
    const settingsValue = {
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

    // Update or insert settings
    const updatedSettings = await this.handleQuery<Database['public']['Tables']['system_settings']['Row']>(
      () => existingSettings
        ? this.supabase.from(this.TABLE).update({ value: settingsValue }).eq('id', existingSettings.id).select().single()
        : this.supabase.from(this.TABLE).insert([{ key: 'settings', value: settingsValue }]).select().single(),
      'updateSettings'
    );

    // Transform and cache the result
    const transformedSettings = this.transformSettings(updatedSettings);
    this.cache.setSettings(transformedSettings);

    return transformedSettings;
  }

  private transformSettings(settings: Database['public']['Tables']['system_settings']['Row']): SystemSettings {
    // Safely extract the value field and cast it to the expected structure
    const settingsData = settings?.value as Record<string, any> || {};
    
    return {
      googleAuthEnabled: settingsData.google_auth_enabled || false,
      googleClientId: settingsData.google_client_id || '',
      googleClientSecret: settingsData.google_client_secret || '',
      facebookAuthEnabled: settingsData.facebook_auth_enabled || false,
      facebookAppId: settingsData.facebook_app_id || '',
      facebookAppSecret: settingsData.facebook_app_secret || '',
      organizationName: settingsData.organization_name || 'Volunteer Hub',
      organizationLogo: settingsData.organization_logo || '',
      primaryColor: settingsData.primary_color || '#3b82f6',
      allowPublicEventViewing: settingsData.allow_public_event_viewing || true,
    };
  }
}
