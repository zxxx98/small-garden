import * as React from 'react';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { Stack } from 'expo-router';
import { theme } from '../theme/theme';
export default function App() {
  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={{ ...eva.light, ...theme }}>
        <Stack>
          <Stack.Screen name='(tabs)' options={{ headerShown: false }}></Stack.Screen>
          <Stack.Screen name="+not-found" options={{headerShown: false}} />
        </Stack>
      </ApplicationProvider>
    </>
  );
}
