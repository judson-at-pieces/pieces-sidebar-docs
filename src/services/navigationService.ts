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
  privacy?: 'PUBLIC' | 'PRIVATE';
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

// Helper function to capitalize titles for auto-generated content only with special cases
function capitalizeTitle(title: string): string {
  // Special cases that should maintain specific capitalization
  const specialCases: { [key: string]: string } = {
    'piecesos': 'PiecesOS',
    'pieces-os': 'PiecesOS',
    'pieces_os': 'PiecesOS',
    'ollama': 'Ollama',
    'vs': 'VS',
    'vscode': 'VSCode',
    'macos': 'macOS',
    'ios': 'iOS',
    'api': 'API',
    'ui': 'UI',
    'cli': 'CLI',
    'sdk': 'SDK',
    'github': 'GitHub',
    'jetbrains': 'JetBrains',
    'llm': 'LLM',
    'llms': 'LLMs'
  };
  
  // Check for special cases first
  const lowerTitle = title.toLowerCase();
  if (specialCases[lowerTitle]) {
    return specialCases[lowerTitle];
  }
  
  // Words that should remain lowercase (unless they're the first word)
  const lowercaseWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'is', 'it', 'of', 'on', 'or', 'the', 'to', 'up', 'via', 'with'];
  
  return title
    .split(/(\s+|\|)/) // Split on whitespace and pipe characters, keeping the separators
    .map((part, index) => {
      // If it's whitespace or a separator, keep it as-is
      if (/^\s+$/.test(part) || part === '|') {
        return part;
      }
      
      // Check if this part matches a special case
      const lowerPart = part.toLowerCase();
      if (specialCases[lowerPart]) {
        return specialCases[lowerPart];
      }
      
      // If it's a word
      const word = part.toLowerCase();
      
      // Always capitalize the first word, or if it's not in the lowercase list
      if (index === 0 || !lowercaseWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      return word;
    })
    .join('');
}

// Helper function to build hierarchical structure from flat array
function buildHierarchy(items: NavigationItem[]): NavigationItem[] {
  console.log('Building hierarchy from', items.length, 'items');
  
  const itemMap = new Map<string, NavigationItem>();
  const rootItems: NavigationItem[] = [];
  
  // First pass: create map of all items and identify folder/file pairs to deduplicate
  const processedItems = new Map<string, NavigationItem>();
  const folderPaths = new Set<string>();
  
  // Identify all folder paths (items that have children or are parents)
  items.forEach(item => {
    if (items.some(i => i.parent_id === item.id)) {
      folderPaths.add(item.href);
    }
  });
  
  // Process items, deduplicating folder/file pairs
  items.forEach(item => {
    const itemPath = item.href;
    
    // Check if this is a standalone file that has a corresponding folder
    const hasCorrespondingFolder = folderPaths.has(itemPath);
    
    // If there's both a folder and file with same path, prefer the folder (parent item)
    if (hasCorrespondingFolder) {
      const isFolder = items.some(i => i.parent_id === item.id);
      if (!isFolder) {
        // This is the standalone file, skip it since we have a folder
        console.log(`Skipping standalone file ${item.title} because folder exists`);
        return;
      }
    }
    
    processedItems.set(item.id, { 
      ...item, 
      // ONLY apply capitalization for auto-generated items, preserve user titles
      title: item.is_auto_generated ? capitalizeTitle(item.title) : item.title,
      items: [] 
    });
  });
  
  // Convert processed items to array
  const deduplicatedItems = Array.from(processedItems.values());
  
  // Create map for hierarchy building
  deduplicatedItems.forEach(item => {
    itemMap.set(item.id, item);
  });
  
  // Second pass: build parent-child relationships
  deduplicatedItems.forEach(item => {
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
    deduplicatedItems: deduplicatedItems.length,
    rootItems: rootItems.length,
    hierarchy: rootItems.map(item => ({
      title: item.title,
      href: item.href,
      childCount: item.items?.length || 0,
      children: item.items?.map(child => ({ title: child.title, href: child.href })) || []
    }))
  });
  
  return rootItems;
}

// Enhanced merge function that creates proper folder structure
function mergeFolderAndMarkdownItems(items: NavigationItem[]): NavigationItem[] {
  console.log('Merging folder and markdown items:', items.length);
  
  // Build hierarchical structure with deduplication
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

  // Get navigation structure including private items for editor
  async getNavigationStructureForEditor(): Promise<NavigationStructure | null> {
    try {
      const { data, error } = await supabase
        .from('navigation_sections')
        .select(`
          id,
          title,
          slug,
          description,
          icon,
          order_index,
          navigation_items!inner (
            id,
            title,
            href,
            description,
            icon,
            order_index,
            parent_id,
            is_auto_generated,
            file_path,
            privacy
          )
        `)
        .eq('is_active', true)
        .eq('navigation_items.is_active', true)
        .order('order_index');
      
      if (error) {
        console.error('Error fetching navigation structure for editor:', error);
        return null;
      }
      
      // Transform the data to match our interface
      const sections = data.map(section => ({
        ...section,
        items: section.navigation_items || []
      }));
      
      const processedData = this.processNavigationData({ sections });
      
      return processedData;
    } catch (error) {
      console.error('Error in getNavigationStructureForEditor:', error);
      return null;
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
          console.warn(`Section "${section.title}" has duplicate items:`, [...new Set(duplicateTitles)]);
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
        // PRESERVE user-entered section titles - don't auto-capitalize
        title: section.title,
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
        // Only capitalize static navigation titles since they're auto-generated
        title: capitalizeTitle(section.title),
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
    privacy?: 'PUBLIC' | 'PRIVATE';
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
    privacy: string;
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

  async updateNavigationItemByFilePath(filePath: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('navigation_items')
      .update({ is_active: isActive })
      .eq('file_path', filePath)
      .select();
    
    if (error) throw error;
    return data;
  }

  async updateNavigationItemPrivacyByFilePath(filePath: string, privacy: 'PUBLIC' | 'PRIVATE') {
    // Use the new cascading function
    const { data, error } = await supabase.rpc('update_navigation_item_privacy_by_file_path_cascade', {
      p_file_path: filePath,
      p_privacy: privacy
    });
    
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
