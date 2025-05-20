import * as React from 'react';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { Stack, usePathname } from 'expo-router';
import { ThemeProvider, useTheme } from '../theme/themeContext';
import { CategoryProvider } from '../context/CategoryContext';
import { AreaProvider } from '../context/AreaContext';
import { FeatherIconsPack } from '../icons/FeatherIconsPack';
import { IoniconsIconsPack } from '../icons/IoniconsIconsPack';
import { MaterialCommunityIconsPack } from '../icons/MaterialCommunityIconsPack';
import { AssetIconsPack } from '../icons/AssetIconsPack';
import LoadingModal from '@/components/LoadingModal';
import FlashMessage from 'react-native-flash-message';
import { ActionCompletionProvider } from '@/context/ActionCompletionContext';
import FloatingActionButton from '@/components/FloatingActionButton';
import ActionCompletionPanel from '@/components/ActionCompletionPanel';
import { useActionCompletion } from '@/context/ActionCompletionContext';
import { useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { initRootStore, rootStore } from '@/stores/RootStore';

// Create theme-aware app component
const ThemedApp = () => {
  const { theme } = useTheme();
  return (
    <ApplicationProvider {...eva} theme={theme}>
      <CategoryProvider>
        <ActionCompletionProvider>
          <AreaProvider>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" options={{ headerShown: false }} />
                <Stack.Screen name="plant-edit" options={{ headerShown: false }} />
                <Stack.Screen name="category-management" options={{ headerShown: false }} />
                <Stack.Screen name="area-management" options={{ headerShown: false }} />
                <Stack.Screen name="action-type-management" options={{ headerShown: false }} />
                <Stack.Screen name="cemetery" options={{ headerShown: false }} />
                <Stack.Screen name="plant/[id]/page" options={{ headerShown: false }} />
                <Stack.Screen name="logs" options={{ headerShown: false }} />
              </Stack>
            <FloatingButtonWrapper />
            <ActionCompletionPanel />
          </AreaProvider>
        </ActionCompletionProvider>
      </CategoryProvider>

      {/* LoadingModal for rendering */}
      <LoadingModal />
      <FlashMessage position="top" />
    </ApplicationProvider>
  );
}

// 创建一个包装组件来使用上下文
const FloatingButtonWrapper = () => {
  const { show } = useActionCompletion();

  // 只在特定页面显示悬浮按钮（可以根据需要调整）
  const currentRoute = usePathname();

  // 在这些页面显示悬浮按钮
  const showOnRoutes = [
    '/plantsPage',
    '/todoPage',
    '/timelinePage',
    '/logs',
  ];

  const shouldShow = showOnRoutes.some(route =>
    currentRoute.includes(route.replace('[id]', ''))
  );

  if (!shouldShow) return null;

  return <FloatingActionButton onPress={()=>{show()}} />;
};

export default function App() {
  initRootStore();
  return (
    <>
      <IconRegistry icons={[EvaIconsPack, FeatherIconsPack, IoniconsIconsPack, MaterialCommunityIconsPack, AssetIconsPack]} />
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </>
  );
}
