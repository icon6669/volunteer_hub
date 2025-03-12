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
      () => this.supabase.from(this.TABLE).select('*').single(),
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
      .single();

    // Prepare settings for database
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

    // Update or insert settings
    const updatedSettings = await this.handleQuery<Database['public']['Tables']['system_settings']['Row']>(
      () => existingSettings
        ? this.supabase.from(this.TABLE).update(dbSettings).eq('id', existingSettings.id).select().single()
        : this.supabase.from(this.TABLE).insert([dbSettings]).select().single(),
      'updateSettings'
    );

    // Transform and cache the result
    const transformedSettings = this.transformSettings(updatedSettings);
    this.cache.setSettings(transformedSettings);

    return transformedSettings;
  }

  private transformSettings(settings: Database['public']['Tables']['system_settings']['Row']): SystemSettings {
    return {
      googleAuthEnabled: settings.google_auth_enabled,
      googleClientId: settings.google_client_id || '',
      googleClientSecret: settings.google_client_secret || '',
      facebookAuthEnabled: settings.facebook_auth_enabled,
      facebookAppId: settings.facebook_app_id || '',
      facebookAppSecret: settings.facebook_app_secret || '',
      organizationName: settings.organization_name,
      organizationLogo: settings.organization_logo || '',
      primaryColor: settings.primary_color,
      allowPublicEventViewing: settings.allow_public_event_viewing,
    };
  }
}
