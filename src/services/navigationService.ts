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

// Helper function to build hierarchical structure from flat array
function buildHierarchy(items: NavigationItem[]): NavigationItem[] {
  console.log('Building hierarchy from', items.length, 'items');
  
  const itemMap = new Map<string, NavigationItem>();
  const rootItems: NavigationItem[] = [];
  
  // First pass: create map of all items
  items.forEach(item => {
    itemMap.set(item.id, { ...item, items: [] });
  });
  
  // Second pass: build parent-child relationships
  items.forEach(item => {
    const itemWithChildren = itemMap.get(item.id)!;
    
    if (item.parent_id && itemMap.has(item.parent_id)) {
      // This item has a parent, add it to parent's children
      const parent = itemMap.get(item.parent_id)!;
      if (!parent.items) parent.items = [];
      parent.items.push(itemWithChildren);
      parent.items.sort((a, b) => a.order_index - b.order_index);
    } else {
      // This is a root item
      rootItems.push(itemWithChildren);
    }
  });
  
  // Sort root items by order_index
  rootItems.sort((a, b) => a.order_index - b.order_index);
  
  console.log('Built hierarchy:', {
    totalItems: items.length,
    rootItems: rootItems.length,
    hierarchy: rootItems.map(item => ({
      title: item.title,
      childCount: item.items?.length || 0,
      children: item.items?.map(child => child.title) || []
    }))
  });
  
  return rootItems;
}

// Helper function to merge folder and markdown file entries
function mergeFolderAndMarkdownItems(items: NavigationItem[]): NavigationItem[] {
  console.log('Merging folder and markdown items:', items.length);
  
  // Build hierarchical structure first
  const hierarchicalItems = buildHierarchy(items);
  
  console.log('After building hierarchy, root items:', hierarchicalItems.length);
  
  return hierarchicalItems;
}

export class NavigationService {
  async getNavigationStructure(): Promise<NavigationStructure | null> {
    try {
      const { data, error } = await supabase.rpc('get_navigation_structure');
      
      if (error) {
        console.warn('Error fetching navigation structure from database, using static navigation:', error);
        return this.processStaticNavigation();
      }
      
      console.log('Raw navigation data from database:', data);
      
      const processedData = this.processNavigationData(data as NavigationStructure);
      
      console.log('Processed navigation data:', processedData);
      
      return processedData || this.processStaticNavigation();
    } catch (error) {
      console.warn('Error in getNavigationStructure, using static navigation:', error);
      return this.processStaticNavigation();
    }
  }

  private processNavigationData(data: NavigationStructure): NavigationStructure {
    console.log('Processing navigation data:', data);
    
    const processedSections = data.sections.map(section => {
      console.log(`Processing section "${section.title}" with ${section.items?.length || 0} items`);
      
      // Check for potential issues with the items
      if (section.items) {
        const duplicateTitles = section.items.reduce((acc, item, index) => {
          const count = section.items.filter(i => i.title === item.title).length;
          if (count > 1) acc.push(`${item.title} (appears ${count} times)`);
          return acc;
        }, [] as string[]);
        
        if (duplicateTitles.length > 0) {
          console.warn(`Section "${section.title}" has duplicate items:`, duplicateTitles);
        }
        
        // Check for circular parent references
        section.items.forEach(item => {
          if (item.parent_id) {
            const parent = section.items.find(i => i.id === item.parent_id);
            if (!parent) {
              console.warn(`Item "${item.title}" has parent_id "${item.parent_id}" but parent not found in section`);
            }
          }
        });
      }
      
      return {
        ...section,
        items: mergeFolderAndMarkdownItems(section.items || []),
      };
    });
    
    return {
      sections: processedSections,
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
