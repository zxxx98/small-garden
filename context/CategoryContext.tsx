import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Default categories - same as in plantsPage
const defaultCategories: Category[] = [
  { id: '1', name: '多肉' },
  { id: '2', name: '观叶植物' },
  { id: '3', name: '果蔬' },
  { id: '4', name: '草本' },
];

// Create the category context
const CategoryContext = createContext<CategoryContextType>({
  categories: [],
  addCategory: async () => ({ id: '', name: '' }),
  updateCategory: async () => {},
  deleteCategory: async () => {},
  loading: false,
  error: null,
});

// Storage key
const STORAGE_KEY = 'plant_categories';

// Category provider component
export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load categories from storage
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const storedCategories = await AsyncStorage.getItem(STORAGE_KEY);
        
        if (storedCategories) {
          setCategories(JSON.parse(storedCategories));
        } else {
          // If no categories stored, use default categories
          setCategories(defaultCategories);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCategories));
        }
      } catch (err) {
        setError('Failed to load categories');
        console.error('Error loading categories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Save categories to storage
  const saveCategories = async (updatedCategories: Category[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCategories));
    } catch (err) {
      setError('Failed to save categories');
      console.error('Error saving categories:', err);
      throw err;
    }
  };

  // Add a new category
  const addCategory = async (name: string): Promise<Category> => {
    try {
      const newCategory = {
        id: Date.now().toString(),
        name: name.trim(),
      };
      
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      await saveCategories(updatedCategories);
      
      return newCategory;
    } catch (err) {
      setError('Failed to add category');
      console.error('Error adding category:', err);
      throw err;
    }
  };

  // Update an existing category
  const updateCategory = async (id: string, name: string): Promise<void> => {
    try {
      const updatedCategories = categories.map(category =>
        category.id === id ? { ...category, name: name.trim() } : category
      );
      
      setCategories(updatedCategories);
      await saveCategories(updatedCategories);
    } catch (err) {
      setError('Failed to update category');
      console.error('Error updating category:', err);
      throw err;
    }
  };

  // Delete a category
  const deleteCategory = async (id: string): Promise<void> => {
    try {
      const updatedCategories = categories.filter(category => category.id !== id);
      setCategories(updatedCategories);
      await saveCategories(updatedCategories);
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