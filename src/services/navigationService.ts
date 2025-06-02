
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
  items?: NavigationItem[]; // Add support for nested items
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

export const navigationService = {
  async getNavigationStructure(): Promise<NavigationStructure> {
    try {
      // Try to get navigation from Supabase if configured
      const { data, error } = await supabase.rpc('get_navigation_structure');
      
      if (error) {
        console.warn('Failed to fetch navigation from database, using fallback:', error.message);
        return getFallbackNavigation();
      }
      
      return data || getFallbackNavigation();
    } catch (error) {
      console.warn('Database connection failed, using fallback navigation:', error);
      return getFallbackNavigation();
    }
  },

  async addNavigationSection(section: {
    title: string;
    slug: string;
    description?: string;
    icon?: string;
    order_index: number;
  }) {
    const { data, error } = await supabase
      .from('navigation_sections')
      .insert([section])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateNavigationSection(sectionId: string, updates: {
    title?: string;
    slug?: string;
    description?: string;
    icon?: string;
    order_index?: number;
    is_active?: boolean;
  }) {
    const { data, error } = await supabase
      .from('navigation_sections')
      .update(updates)
      .eq('id', sectionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async addNavigationItem(item: {
    section_id: string;
    parent_id?: string;
    title: string;
    href: string;
    description?: string;
    icon?: string;
    order_index: number;
    is_auto_generated: boolean;
    file_path?: string;
  }) {
    const { data, error } = await supabase
      .from('navigation_items')
      .insert([item])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteNavigationItem(itemId: string) {
    const { error } = await supabase
      .from('navigation_items')
      .delete()
      .eq('id', itemId);
    
    if (error) throw error;
  }
};

// Fallback navigation structure when database is not available
function getFallbackNavigation(): NavigationStructure {
  return {
    sections: [
      {
        id: 'meet-pieces',
        title: 'Meet Pieces',
        slug: 'meet-pieces',
        description: 'Introduction to Pieces',
        icon: 'Puzzle',
        order_index: 1,
        items: [
          {
            id: 'fundamentals',
            title: 'Fundamentals',
            href: '/meet-pieces/fundamentals',
            order_index: 1,
            parent_id: undefined,
            is_auto_generated: false
          },
          {
            id: 'macos-installation',
            title: 'macOS Installation Guide',
            href: '/meet-pieces/macos-installation-guide',
            order_index: 2,
            parent_id: undefined,
            is_auto_generated: false
          }
        ]
      },
      {
        id: 'quick-guides',
        title: 'Quick Guides',
        slug: 'quick-guides',
        description: 'Get started quickly',
        icon: 'Zap',
        order_index: 2,
        items: [
          {
            id: 'overview',
            title: 'Overview',
            href: '/quick-guides',
            order_index: 1,
            parent_id: undefined,
            is_auto_generated: false
          }
        ]
      },
      {
        id: 'cli',
        title: 'CLI',
        slug: 'cli',
        description: 'Command line interface',
        icon: 'Terminal',
        order_index: 3,
        items: [
          {
            id: 'cli-overview',
            title: 'Overview',
            href: '/cli',
            order_index: 1,
            parent_id: undefined,
            is_auto_generated: false
          }
        ]
      },
      {
        id: 'desktop',
        title: 'Desktop',
        slug: 'desktop',
        description: 'Desktop application',
        icon: 'Monitor',
        order_index: 4,
        items: [
          {
            id: 'desktop-overview',
            title: 'Overview',
            href: '/desktop',
            order_index: 1,
            parent_id: undefined,
            is_auto_generated: false
          }
        ]
      },
      {
        id: 'extensions-plugins',
        title: 'Extensions & Plugins',
        slug: 'extensions-plugins',
        description: 'IDE integrations',
        icon: 'Puzzle',
        order_index: 5,
        items: [
          {
            id: 'extensions-overview',
            title: 'Overview',
            href: '/extensions-plugins',
            order_index: 1,
            parent_id: undefined,
            is_auto_generated: false
          }
        ]
      }
    ]
  };
}
