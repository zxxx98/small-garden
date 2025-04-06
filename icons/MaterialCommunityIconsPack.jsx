import { StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const MaterialCommunityIconsPack = {
  name: 'materialCommunityIcons',
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
  toReactElement: (props) => MaterialCommunityIcon({ name, ...props }),
});

function MaterialCommunityIcon({ name, style })
{
  const { height, tintColor, ...iconStyle } = StyleSheet.flatten(style);
  return (
    <MaterialCommunityIcons
      name={name}
      size={height || 24}
      color={tintColor}
      style={iconStyle}
    />
  );
}