import { supabase } from '@/integrations/supabase/client';
import { staticNavigation } from './staticNavigation';

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

// Helper function to merge folder and markdown file entries
function mergeFolderAndMarkdownItems(items: NavigationItem[]): NavigationItem[] {
  const itemMap = new Map<string, NavigationItem>();
  const mergedItems: NavigationItem[] = [];

  // First pass: collect all items by their base path
  for (const item of items) {
    const basePath = item.href.replace(/\.md$/, ''); // Remove .md extension if present
    
    if (itemMap.has(basePath)) {
      const existing = itemMap.get(basePath)!;
      
      // If we have both folder and markdown file, merge them
      if (item.href.endsWith('.md') && !existing.href.endsWith('.md')) {
        // Current item is markdown, existing is folder - use markdown as base, keep folder's children
        itemMap.set(basePath, {
          ...item,
          items: existing.items || [],
        });
      } else if (!item.href.endsWith('.md') && existing.href.endsWith('.md')) {
        // Current item is folder, existing is markdown - use markdown as base, add folder's children
        itemMap.set(basePath, {
          ...existing,
          items: item.items || [],
        });
      } else if (item.href.endsWith('.md') && existing.href.endsWith('.md')) {
        // Both are markdown files - keep the existing one
        continue;
      } else {
        // Both are folders - merge their children
        itemMap.set(basePath, {
          ...existing,
          items: mergeFolderAndMarkdownItems([...(existing.items || []), ...(item.items || [])]),
        });
      }
    } else {
      itemMap.set(basePath, {
        ...item,
        items: item.items ? mergeFolderAndMarkdownItems(item.items) : undefined,
      });
    }
  }

  // Convert map back to array and sort by order_index
  return Array.from(itemMap.values()).sort((a, b) => a.order_index - b.order_index);
}

export class NavigationService {
  async getNavigationStructure(): Promise<NavigationStructure | null> {
    try {
      const { data, error } = await supabase.rpc('get_navigation_structure');
      
      if (error) {
        console.warn('Error fetching navigation structure from database, using static navigation:', error);
        return this.processStaticNavigation();
      }
      
      const processedData = this.processNavigationData(data as NavigationStructure);
      return processedData || this.processStaticNavigation();
    } catch (error) {
      console.warn('Error in getNavigationStructure, using static navigation:', error);
      return this.processStaticNavigation();
    }
  }

  private processNavigationData(data: NavigationStructure): NavigationStructure {
    return {
      sections: data.sections.map(section => ({
        ...section,
        items: mergeFolderAndMarkdownItems(section.items || []),
      })),
    };
  }

  private processStaticNavigation(): NavigationStructure {
    return {
      sections: staticNavigation.sections.map(section => ({
        ...section,
        items: mergeFolderAndMarkdownItems(section.items || []),
      })),
    };
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

  async deleteNavigationSection(id: string) {
    // First delete all items in the section
    const { error: itemsError } = await supabase
      .from('navigation_items')
      .delete()
      .eq('section_id', id);
    
    if (itemsError) throw itemsError;

    // Then delete the section
    const { error } = await supabase
      .from('navigation_sections')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
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
