import * as React from 'react';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../theme/themeContext';
import { CategoryProvider } from '../context/CategoryContext';
import { FeatherIconsPack } from '../icons/FeatherIconsPack';
import { IoniconsIconsPack } from '../icons/IoniconsIconsPack';
import { MaterialCommunityIconsPack } from '../icons/MaterialCommunityIconsPack';

// Create theme-aware app component
const ThemedApp = () =>
{
  const { theme } = useTheme();

  return (
    <ApplicationProvider {...eva} theme={theme}>
      <CategoryProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        </Stack>
      </CategoryProvider>
    </ApplicationProvider>
  );
}

export default function App()
{
  return (
    <>
      <IconRegistry icons={[EvaIconsPack, FeatherIconsPack, IoniconsIconsPack, MaterialCommunityIconsPack]} />
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </>
  );
}
