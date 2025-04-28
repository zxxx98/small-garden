import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/theme/theme';

interface GradientBackgroundProps {
  children: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
  style?: any;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  colors,
  style,
}) => {
  const defaultColors = theme.mode === 'light'
    ? ['#F5F5F5', '#E8F5E9', '#F5F5F5'] as const
    : ['#222B45', '#1A2138', '#222B45'] as const;

  return (
    <GestureHandlerRootView style={[styles.container, style]}>
      <LinearGradient
        colors={colors || defaultColors}
        style={styles.gradient}
      >
        {children}
      </LinearGradient>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
});

export default GradientBackground; 