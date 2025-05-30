
import { supabase } from '@/integrations/supabase/client';
import { NavigationSection, NavigationItem } from '@/services/navigationService';

export class NavigationEditorService {
  async saveNavigationStructure(sections: NavigationSection[]): Promise<boolean> {
    try {
      // First, update section order
      for (const section of sections) {
        await supabase
          .from('navigation_sections')
          .update({ order_index: section.order_index })
          .eq('id', section.id);

        // Update items in this section
        if (section.items) {
          for (const item of section.items) {
            if (item.id.startsWith('temp-')) {
              // Create new item
              const { data, error } = await supabase
                .from('navigation_items')
                .insert({
                  section_id: section.id,
                  title: item.title,
                  href: item.href,
                  file_path: item.file_path,
                  order_index: item.order_index,
                  is_auto_generated: item.is_auto_generated,
                  parent_id: item.parent_id
                })
                .select()
                .single();

              if (error) throw error;
            } else {
              // Update existing item
              await supabase
                .from('navigation_items')
                .update({
                  section_id: section.id,
                  order_index: item.order_index,
                  title: item.title,
                  href: item.href,
                  parent_id: item.parent_id
                })
                .eq('id', item.id);
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving navigation structure:', error);
      return false;
    }
  }

  async deleteNavigationItem(itemId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('navigation_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting navigation item:', error);
      return false;
    }
  }
}

export const navigationEditorService = new NavigationEditorService();
