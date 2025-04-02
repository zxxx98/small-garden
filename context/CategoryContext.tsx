import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConfigManager } from '../models/ConfigManager';

// Category type definition
export type Category = {
  id: string;
  name: string;
};

// Category context type
type CategoryContextType = {
  categories: Category[];
  addCategory: (name: string) => Promise<Category>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
};

// Create the category context
const CategoryContext = createContext<CategoryContextType>({
  categories: [],
  addCategory: async () => ({ id: '', name: '' }),
  updateCategory: async () => { },
  deleteCategory: async () => { },
  loading: false,
  error: null,
});

// Category provider component
export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
{
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const configManager = ConfigManager.getInstance();

  // Load categories from storage
  useEffect(() =>
  {
    const loadCategories = async () =>
    {
      try {
        setLoading(true);
        const loadedCategories = await configManager.getCategories();
        setCategories(loadedCategories);
      } catch (err) {
        setError('Failed to load categories');
        console.error('Error loading categories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Add a new category
  const addCategory = async (name: string): Promise<Category> =>
  {
    try {
      const newCategory = {
        id: Date.now().toString(),
        name: name.trim(),
      };

      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      await configManager.saveCategories(updatedCategories);

      return newCategory;
    } catch (err) {
      setError('Failed to add category');
      console.error('Error adding category:', err);
      throw err;
    }
  };

  // Update an existing category
  const updateCategory = async (id: string, name: string): Promise<void> =>
  {
    try {
      const updatedCategories = categories.map(category =>
        category.id === id ? { ...category, name: name.trim() } : category
      );

      setCategories(updatedCategories);
      await configManager.saveCategories(updatedCategories);
    } catch (err) {
      setError('Failed to update category');
      console.error('Error updating category:', err);
      throw err;
    }
  };

  // Delete a category
  const deleteCategory = async (id: string): Promise<void> =>
  {
    try {
      const updatedCategories = categories.filter(category => category.id !== id);
      setCategories(updatedCategories);
      await configManager.saveCategories(updatedCategories);
    } catch (err) {
      setError('Failed to delete category');
      console.error('Error deleting category:', err);
      throw err;
    }
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        loading,
        error,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

// Custom hook to use category context
export const useCategories = () => useContext(CategoryContext); 