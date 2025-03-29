import * as React from 'react';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { Stack } from 'expo-router';
import { theme } from '../theme/theme';
import { FeatherIconsPack } from '../icons/FeatherIconsPack';
import { IoniconsIconsPack } from '../icons/IoniconsIconsPack';
export default function App() {
  return (
    <>
      <IconRegistry icons={[EvaIconsPack,FeatherIconsPack,IoniconsIconsPack]} />
      <ApplicationProvider {...eva} theme={{ ...eva.dark, ...theme }}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{headerShown: false}} />
        </Stack>
      </ApplicationProvider>
    </>
  );
}
