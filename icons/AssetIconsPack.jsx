import React from 'react';
import { Image } from 'react-native';

const IconProvider = (source) => ({
  toReactElement: ({ animation, ...props }) => (
    <Image {...props} source={source} />
  ),
});

export const AssetIconsPack = {
  name: 'assets',
  icons: {
    'github': IconProvider(require('../assets/images/github.png')),
    'color-palette': IconProvider(require('../assets/images/color-palette.png')),
  },
};