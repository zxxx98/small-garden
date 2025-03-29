import { StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const FeatherIconsPack = {
  name: 'feather',
  icons: createIconsMap(),
};

function createIconsMap() {
  return new Proxy({}, {
    get(target, name) {
      return IconProvider(name);
    },
  });
}

const IconProvider = (name) => ({
  toReactElement: (props) => FeatherIcon({ name, ...props }),
});

function FeatherIcon({ name, style }) {
  const { height, tintColor, ...iconStyle } = StyleSheet.flatten(style);
  return (
    <Feather
      name={name}
      size={height || 24}
      color={tintColor}
      style={iconStyle}
    />
  );
}