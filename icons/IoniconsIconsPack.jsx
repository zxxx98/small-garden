import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const IoniconsIconsPack = {
  name: 'ionicons',
  icons: createIconsMap(),
};

function createIconsMap()
{
  return new Proxy({}, {
    get(target, name)
    {
      return IconProvider(name);
    },
  });
}

const IconProvider = (name) => ({
  toReactElement: (props) => IoniconsIcon({ name, ...props }),
});

function IoniconsIcon({ name, style })
{
  console.log(style)
  const { height, tintColor, ...iconStyle } = StyleSheet.flatten(style);
  return (
    <Ionicons
      name={name}
      size={height || 24}
      color={tintColor}
      style={iconStyle}
    />
  );
}