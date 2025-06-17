
import { useState } from 'react';
import { navigationService } from '@/services/navigationService';
import { toast } from 'sonner';

export function useNavigationActions() {
  const [isLoading, setIsLoading] = useState(false);

  const addSection = async (title: string) => {
    setIsLoading(true);
    try {
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Get current max order_index
      const existingSections = await navigationService.getNavigationStructureForEditor();
      const maxOrder = existingSections?.sections?.length 
        ? Math.max(...existingSections.sections.map(s => s.order_index)) 
        : 0;

      await navigationService.addNavigationSection({
        title,
        slug,
        order_index: maxOrder + 1
      });

      console.log('Section added successfully:', { title, slug });
    } catch (error) {
      console.error('Error adding section:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSectionTitle = async (sectionId: string, title: string) => {
    setIsLoading(true);
    try {
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      await navigationService.updateNavigationSection(sectionId, {
        title,
        slug
      });

      console.log('Section title updated successfully:', { sectionId, title });
    } catch (error) {
      console.error('Error updating section title:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSection = async (sectionId: string) => {
    setIsLoading(true);
    try {
      console.log('useNavigationActions: Deleting section:', sectionId);
      await navigationService.deleteNavigationSection(sectionId);
      console.log('Section deleted successfully:', sectionId);
    } catch (error) {
      console.error('Error deleting section:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemTitle = async (itemId: string, title: string) => {
    setIsLoading(true);
    try {
      await navigationService.updateNavigationItem(itemId, { title });
      console.log('Item title updated successfully:', { itemId, title });
    } catch (error) {
      console.error('Error updating item title:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reorderSections = async (sections: any[]) => {
    setIsLoading(true);
    try {
      // Update order_index for each section
      const updatePromises = sections.map((section, index) => 
        navigationService.updateNavigationSection(section.id, {
          order_index: index
        })
      );

      await Promise.all(updatePromises);
      console.log('Sections reordered successfully');
    } catch (error) {
      console.error('Error reordering sections:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addSection,
    updateSectionTitle,
    deleteSection,
    updateItemTitle,
    reorderSections,
    isLoading
  };
}
