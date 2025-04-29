import * as React from 'react';
import { StyleSheet, Image, TouchableOpacity, Dimensions, View } from 'react-native';
import { Icon } from '@ui-kitten/components';

export interface ImageViewerProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}

export const ImageViewer = ({ visible, imageUri, onClose }: ImageViewerProps) => {
  const [rotation, setRotation] = React.useState(0);

  const rotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const rotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  if (!visible) return null;

  return (
    <View style={[styles.modalContainer, { display: visible ? 'flex' : 'none' }]}>
      <View style={styles.imageViewerContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close-outline" style={{ width: 24, height: 24, tintColor: '#fff' }} />
        </TouchableOpacity>

        <View style={styles.rotationButtonsContainer}>
          <TouchableOpacity style={styles.rotateButton} onPress={rotateLeft}>
            <Icon name="arrow-undo" pack='ionicons' style={{ width: 28, height: 28, tintColor: '#fff' }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.rotateButton} onPress={rotateRight}>
            <Icon name="arrow-redo" pack='ionicons' style={{ width: 28, height: 28, tintColor: '#fff' }} />
          </TouchableOpacity>
        </View>

        <View style={styles.fullScreenImageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.fullScreenImage,
              { transform: [{ rotate: `${rotation}deg` }] }
            ]}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
  },
  imageViewerContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullScreenImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  rotationButtonsContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 4,
  },
  rotateButton: {
    padding: 8,
    marginHorizontal: 10,
  },
});

export default ImageViewer; 