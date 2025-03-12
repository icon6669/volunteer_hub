import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { CacheService, cacheService } from './CacheService';

export class BaseService {
  protected readonly supabase: SupabaseClient<Database>;
  protected readonly cache: CacheService;

  constructor() {
    this.supabase = supabase;
    this.cache = cacheService;
  }

  protected async handleQuery<T>(
    queryFn: () => Promise<{
      data: T;
      error: any;
    }>,
    operation: string
  ): Promise<T> {
    try {
      const { data, error } = await queryFn();
      if (error) throw error;
      if (!data) throw new Error(`No data returned from ${operation}`);
      return data;
    } catch (error) {
      console.error(`Error in ${operation}:`, error);
      throw error;
    }
  }

  get client(): SupabaseClient<Database> {
    return this.supabase;
  }
}
