import { supabase } from '../lib/supabase';
import { SystemSettings } from '../types';
import { parseSystemSettings, stringifySystemSettings } from './settingsParser';

/**
 * Fetches system settings from the database
 * @returns Promise resolving to SystemSettings object
 */
export const getSystemSettings = async (): Promise<SystemSettings> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'app_settings')
      .single();
    
    if (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
    
    return parseSystemSettings(data?.value as string);
  } catch (error) {
    console.error('Error in getSystemSettings:', error);
    throw error;
  }
};

/**
 * Updates system settings in the database
 * @param settings - SystemSettings object to save
 * @returns Promise resolving to success boolean
 */
export const updateSystemSettings = async (settings: SystemSettings): Promise<boolean> => {
  try {
    const settingsJson = stringifySystemSettings(settings);
    
    // Check if settings record exists
    const { data: existingData, error: checkError } = await supabase
      .from('system_settings')
      .select('id')
      .eq('key', 'app_settings')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking system settings:', checkError);
      throw checkError;
    }
    
    // Update or insert based on existence
    if (existingData?.id) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('system_settings')
        .update({ value: settingsJson })
        .eq('id', existingData.id);
      
      if (updateError) {
        console.error('Error updating system settings:', updateError);
        throw updateError;
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('system_settings')
        .insert({
          key: 'app_settings',
          value: settingsJson
        });
      
      if (insertError) {
        console.error('Error inserting system settings:', insertError);
        throw insertError;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateSystemSettings:', error);
    return false;
  }
};

/**
 * Gets a specific setting value with type safety
 * @param settings - SystemSettings object
 * @param key - Key of the setting to get
 * @param defaultValue - Default value if setting is not found
 * @returns The setting value or default value
 */
export function getSetting<K extends keyof SystemSettings>(
  settings: SystemSettings,
  key: K,
  defaultValue: SystemSettings[K]
): SystemSettings[K] {
  return settings[key] !== undefined ? settings[key] : defaultValue;
}
