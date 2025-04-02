import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as eva from '@eva-design/eva';
import { theme as customLightTheme } from './theme';

// Create a dark theme by merging eva dark theme with our custom theme
const customDarkTheme = {
  ...eva.dark,
  ...customLightTheme,
  'color-primary-100': '#052105',
  'color-primary-200': '#0A330A',
  'color-primary-300': '#0F4C0F',
  'color-primary-400': '#156615',
  'color-primary-500': '#1A801A',
  'color-primary-600': '#339933',
  'color-primary-700': '#4DB34D',
  'color-primary-800': '#66CC66',
  'color-primary-900': '#B3E6B3',
  'color-basic-100': '#1A1A1A',
  'color-basic-200': '#2A2A2A',
  'color-basic-300': '#3A3A3A',
  'color-basic-400': '#4A4A4A',
  'color-basic-500': '#5A5A5A',
  'color-basic-600': '#6A6A6A',
  'color-basic-700': '#858585',
  'color-basic-800': '#A0A0A0',
  'color-basic-900': '#C8C8C8',
  'color-basic-1000': '#E0E0E0',
  'color-basic-1100': '#FFFFFF',
  'color-success-100': '#052C0F',
  'color-success-200': '#0A4717',
  'color-success-300': '#0F661F',
  'color-success-400': '#158026',
  'color-success-500': '#1A992E',
  'color-success-600': '#33B34D',
  'color-success-700': '#4DCC66',
  'color-success-800': '#66E680',
  'color-success-900': '#B3F2C9',
};

// Theme mode type
type ThemeMode = 'light' | 'dark';

// Theme context type
type ThemeContextType = {
  themeMode: ThemeMode;
  theme: typeof customLightTheme;
  toggleTheme: () => void;
};

// Create theme context
const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  theme: { ...eva.light, ...customLightTheme },
  toggleTheme: () => {},
});

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  // Get the active theme object based on mode
  const theme = themeMode === 'light' 
    ? { ...eva.light, ...customLightTheme }
    : { ...customDarkTheme };

  // Load theme preference from storage on component mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('themeMode');
        if (storedTheme) {
          setThemeMode(storedTheme as ThemeMode);
        }
      } catch (error) {
        console.log('Error loading theme', error);
      }
    };
    
    loadTheme();
  }, []);

  // Toggle theme function
  const toggleTheme = async () => {
    const newThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newThemeMode);
    
    try {
      await AsyncStorage.setItem('themeMode', newThemeMode);
    } catch (error) {
      console.log('Error saving theme', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeMode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => useContext(ThemeContext); 