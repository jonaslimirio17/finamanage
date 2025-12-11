import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MerchantMapping {
  merchant_name: string;
  category: string;
  subcategory: string | null;
}

/**
 * Hook for managing merchant → category mappings
 * When a user categorizes a transaction from a merchant, the mapping is saved
 * Future transactions from the same merchant will be pre-categorized
 */
export function useMerchantCategories(userId: string | null) {
  
  /**
   * Normalize merchant name for consistent matching
   */
  const normalizeMerchantName = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\sáàãâéêíóôõúç-]/gi, ''); // Keep accents but remove special chars
  }, []);

  /**
   * Save or update a merchant → category mapping
   * Called when user categorizes a transaction
   */
  const saveMerchantMapping = useCallback(async (
    merchant: string,
    category: string,
    subcategory?: string | null
  ): Promise<boolean> => {
    if (!userId || !merchant || !category) return false;
    
    const normalizedMerchant = normalizeMerchantName(merchant);
    if (!normalizedMerchant) return false;

    try {
      // Upsert the mapping (update if exists, insert if not)
      // Using type assertion since table was just created
      const { error } = await (supabase
        .from('merchant_category_mappings' as any)
        .upsert(
          {
            profile_id: userId,
            merchant_name: normalizedMerchant,
            category,
            subcategory: subcategory || null,
          },
          {
            onConflict: 'profile_id,merchant_name',
          }
        ) as any);

      if (error) {
        console.error('Error saving merchant mapping:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in saveMerchantMapping:', err);
      return false;
    }
  }, [userId, normalizeMerchantName]);

  /**
   * Get category mapping for a merchant
   * Returns null if no mapping exists
   */
  const getMerchantCategory = useCallback(async (
    merchant: string
  ): Promise<MerchantMapping | null> => {
    if (!userId || !merchant) return null;
    
    const normalizedMerchant = normalizeMerchantName(merchant);
    if (!normalizedMerchant) return null;

    try {
      const { data, error } = await (supabase
        .from('merchant_category_mappings' as any)
        .select('merchant_name, category, subcategory')
        .eq('profile_id', userId)
        .eq('merchant_name', normalizedMerchant)
        .maybeSingle() as any);

      if (error) {
        console.error('Error fetching merchant mapping:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in getMerchantCategory:', err);
      return null;
    }
  }, [userId, normalizeMerchantName]);

  /**
   * Get all merchant mappings for the user
   * Useful for displaying in settings or bulk operations
   */
  const getAllMappings = useCallback(async (): Promise<MerchantMapping[]> => {
    if (!userId) return [];

    try {
      const { data, error } = await (supabase
        .from('merchant_category_mappings' as any)
        .select('merchant_name, category, subcategory')
        .eq('profile_id', userId)
        .order('merchant_name') as any);

      if (error) {
        console.error('Error fetching all mappings:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getAllMappings:', err);
      return [];
    }
  }, [userId]);

  /**
   * Delete a merchant mapping
   */
  const deleteMerchantMapping = useCallback(async (merchant: string): Promise<boolean> => {
    if (!userId || !merchant) return false;
    
    const normalizedMerchant = normalizeMerchantName(merchant);
    if (!normalizedMerchant) return false;

    try {
      const { error } = await (supabase
        .from('merchant_category_mappings' as any)
        .delete()
        .eq('profile_id', userId)
        .eq('merchant_name', normalizedMerchant) as any);

      if (error) {
        console.error('Error deleting merchant mapping:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in deleteMerchantMapping:', err);
      return false;
    }
  }, [userId, normalizeMerchantName]);

  return {
    saveMerchantMapping,
    getMerchantCategory,
    getAllMappings,
    deleteMerchantMapping,
    normalizeMerchantName,
  };
}
