import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConfigManager } from '../models/ConfigManager';
import { Area } from '../types/config';

// Area context type
type AreaContextType = {
  areas: Area[];
  addArea: (name: string) => Promise<Area>;
  updateArea: (id: string, name: string) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
};

// Create the area context
const AreaContext = createContext<AreaContextType>({
  areas: [],
  addArea: async () => ({ id: '', name: '' }),
  updateArea: async () => { },
  deleteArea: async () => { },
  loading: false,
  error: null,
});

// Area provider component
export const AreaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
{
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const configManager = ConfigManager.getInstance();

  // Load areas from storage
  useEffect(() =>
  {
    const loadAreas = async () =>
    {
      try {
        setLoading(true);
        const loadedAreas = await configManager.getAreas();
        setAreas(loadedAreas);
      } catch (err) {
        setError('加载区域失败');
        console.error('Error loading areas:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAreas();
  }, []);

  // Add a new area
  const addArea = async (name: string): Promise<Area> =>
  {
    try {
      const newArea = {
        id: Date.now().toString(),
        name: name.trim(),
      };

      await configManager.addArea(newArea);
      const updatedAreas = await configManager.getAreas();
      setAreas(updatedAreas);

      return newArea;
    } catch (err) {
      setError('添加区域失败');
      console.error('Error adding area:', err);
      throw err;
    }
  };

  // Update an existing area
  const updateArea = async (id: string, name: string): Promise<void> =>
  {
    try {
      const areaToUpdate = areas.find(area => area.id === id);
      if (!areaToUpdate) {
        throw new Error('区域不存在');
      }

      const updatedArea = { ...areaToUpdate, name: name.trim() };
      await configManager.updateArea(updatedArea);
      
      const updatedAreas = await configManager.getAreas();
      setAreas(updatedAreas);
    } catch (err) {
      setError('更新区域失败');
      console.error('Error updating area:', err);
      throw err;
    }
  };

  // Delete an area
  const deleteArea = async (id: string): Promise<void> =>
  {
    try {
      await configManager.deleteArea(id);
      const updatedAreas = await configManager.getAreas();
      setAreas(updatedAreas);
    } catch (err) {
      setError('删除区域失败');
      console.error('Error deleting area:', err);
      throw err;
    }
  };

  return (
    <AreaContext.Provider
      value={{
        areas,
        addArea,
        updateArea,
        deleteArea,
        loading,
        error,
      }}
    >
      {children}
    </AreaContext.Provider>
  );
};

export const useAreas = () => useContext(AreaContext); 