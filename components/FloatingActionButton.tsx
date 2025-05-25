import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Icon } from '@ui-kitten/components';
import { useTheme } from '../theme/themeContext';
import { theme } from '@/theme/theme';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: string;
  size?: number;
}

const FloatingActionButton = ({ 
  onPress, 
  size = 56 
}: FloatingActionButtonProps) => {
  const { themeMode } = useTheme();
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          { 
            width: size, 
            height: size,
            backgroundColor: themeMode === 'light' ? theme['color-primary-500'] : theme['color-primary-500'],
            shadowColor: '#000000',
          }
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Icon
          name={"checkmark"}
          pack='ionicons'
          style={{ width: size / 2, height: size / 2, color: themeMode === 'light' ? theme['color-white'] : theme['color-white'] }}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    zIndex: 998,
  },
  button: {
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default FloatingActionButton;