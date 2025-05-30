
import { supabase } from '@/integrations/supabase/client';

export interface NavigationItem {
  id: string;
  title: string;
  href: string;
  description?: string;
  icon?: string;
  order_index: number;
  parent_id?: string;
  is_auto_generated: boolean;
  file_path?: string;
  items?: NavigationItem[];
}

export interface NavigationSection {
  id: string;
  title: string;
  slug: string;
  description?: string;
  icon?: string;
  order_index: number;
  items: NavigationItem[];
}

export interface NavigationStructure {
  sections: NavigationSection[];
}

export class NavigationService {
  async getNavigationStructure(): Promise<NavigationStructure | null> {
    try {
      const { data, error } = await supabase.rpc('get_navigation_structure');
      
      if (error) {
        console.error('Error fetching navigation structure:', error);
        return null;
      }
      
      return data as NavigationStructure;
    } catch (error) {
      console.error('Error in getNavigationStructure:', error);
      return null;
    }
  }

  async addNavigationSection(section: {
    title: string;
    slug: string;
    description?: string;
    icon?: string;
    order_index?: number;
  }) {
    const { data, error } = await supabase
      .from('navigation_sections')
      .insert(section)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateNavigationSection(id: string, updates: Partial<{
    title: string;
    slug: string;
    description: string;
    icon: string;
    order_index: number;
    is_active: boolean;
  }>) {
    const { data, error } = await supabase
      .from('navigation_sections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async addNavigationItem(item: {
    section_id: string;
    parent_id?: string;
    title: string;
    href: string;
    description?: string;
    icon?: string;
    order_index?: number;
    is_auto_generated?: boolean;
    file_path?: string;
  }) {
    const { data, error } = await supabase
      .from('navigation_items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateNavigationItem(id: string, updates: Partial<{
    title: string;
    href: string;
    description: string;
    icon: string;
    order_index: number;
    is_active: boolean;
    parent_id: string;
  }>) {
    const { data, error } = await supabase
      .from('navigation_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteNavigationItem(id: string) {
    const { error } = await supabase
      .from('navigation_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async syncNavigationFromContent() {
    const { data, error } = await supabase.rpc('sync_navigation_from_content');
    
    if (error) {
      console.error('Error syncing navigation:', error);
      throw error;
    }
    
    return data;
  }
}

export const navigationService = new NavigationService();
