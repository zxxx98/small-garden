import * as React from 'react';
import { StyleSheet, Image, TouchableOpacity, Dimensions, Alert, View, ScrollView } from 'react-native';
import { Layout, Text, Button, Input, Select, SelectItem, Icon, IconProps, IndexPath, Spinner } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Plant } from '@/types/plant';
import { generateId } from '@/utils/uuid';
import { ConfigManager } from '@/models/ConfigManager';
import { useTheme } from '../theme/themeContext';
import * as ImagePicker from 'expo-image-picker';
import { fileManager } from '@/models/FileManager';
import { theme } from '@/theme/theme';
import { identifyPlantWithPlantNet } from '@/utils/PlantNet';
import LoadingModal from '@/components/LoadingModal';
import { showMessage } from "react-native-flash-message";
import { observer } from 'mobx-react-lite';
import { rootStore } from '@/stores/RootStore';
import PageHeader from '../components/PageHeader';
import GradientBackground from '@/components/GradientBackground';
import { IPlantModel } from '@/stores/PlantStore';
import ImageViewer from '@/components/ImageViewer';

const IdentifyIcon = (props: IconProps) => <Icon {...props} name="search-outline" fill="#FFFFFF" width={24} height={24} />;

const PlantEditPage = observer(() => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { themeMode } = useTheme();
  const categories = rootStore.settingStore.categories;
  
  // 从路由参数中获取植物ID，如果有则为编辑模式
  const plantId = params.id as string | undefined;
  const editingPlant = plantId ? rootStore.plantStore.plants.find(p => p.id === plantId) : null;
  
  const [plantName, setPlantName] = React.useState(editingPlant?.name || '');
  const [scientificName, setScientificName] = React.useState(editingPlant?.scientificName || '');
  const [plantImage, setPlantImage] = React.useState(editingPlant?.img || '');
  const [description, setDescription] = React.useState(editingPlant?.description || '');
  const [areaId, setAreaId] = React.useState(editingPlant?.areaId || '0');
  const [categorySelectedIndex, setCategorySelectedIndex] = React.useState<number>(0);
  const [imageLoading, setImageLoading] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState('');
  const [showImageViewer, setShowImageViewer] = React.useState(false);

  // Set initial values when editingPlant changes
  React.useEffect(() => {
    if (editingPlant) {
      setPlantName(editingPlant.name);
      setScientificName(editingPlant.scientificName || editingPlant.name);
      setPlantImage(editingPlant.img);

      const categoryIndex = categories.findIndex(c => c.name === editingPlant.type);
      if (categoryIndex !== -1) {
        setCategorySelectedIndex(categoryIndex);
      }
    } else {
      setPlantName('');
      setScientificName('');
      setPlantImage('');
      setCategorySelectedIndex(0);
    }
  }, [editingPlant, categories]);

  const handleSubmit = () => {
    if (!plantName.trim()) {
      showMessage({
        message: '请输入植物名称',
        duration: 1000,
        type: "warning"
      });
      return;
    }

    const formData = {
      plantName,
      scientificName: "",
      category: rootStore.settingStore.categories[categorySelectedIndex].name,
      description: description,
      areaId: areaId,
      image: plantImage || 'https://via.placeholder.com/150'
    };

    const newPlant: Plant = {
      id: editingPlant?.id || generateId(),
      name: formData.plantName,
      scientificName: formData.scientificName,
      type: formData.category,
      description: formData.description,
      img: formData.image,
      isDead: editingPlant?.isDead || false,
      todos: [],
      areaId: formData.areaId,
    };

    if (editingPlant) {
      rootStore.plantStore.updatePlant(newPlant as IPlantModel);
    } else {
      rootStore.plantStore.addPlant(newPlant as IPlantModel);
    }

    showMessage({
      message: editingPlant ? '植物更新成功' : '植物添加成功',
      duration: 1000,
      type: "success"
    });
    
    router.back();
  };

  const showImageOptions = () => {
    Alert.alert(
      "选择图片来源",
      "请选择图片来源",
      [
        { text: "取消", style: "cancel" },
        { text: "相册", onPress: () => pickImage() },
        { text: "相机", onPress: () => takePhoto() }
      ]
    );
  };

  //根据选定的植物调用植物识别接口
  const identifyPlant = async (imageUri: string) => {
    const apiKey = await ConfigManager.getInstance().getPlantNetApiKey();
    if (!apiKey) {
      showMessage({
        message: '未配置植物识别API密钥，请在设置中配置',
        duration: 2000,
        type: "warning"
      });
      return;
    }
    
    if (imageUri) {
      LoadingModal.show("识别中...");
      const result = await identifyPlantWithPlantNet(imageUri, apiKey);
      console.log(result);
      if (result.success) {
        setScientificName(result.scientificName);
        setPlantName(result.commonName);
      }
      LoadingModal.hide();
    }
  };

  // Function to view the image in full screen
  const viewImage = () => {
    if (plantImage) {
      setSelectedImage(plantImage);
      setShowImageViewer(true);
    }
  };

  // Image picking function
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showMessage({
        message: '需要权限，请在设置中开启相册权限',
        duration: 1000,
        type: "info"
      });
      return;
    }

    try {
      setImageLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Save the image using FileManager and get the stored URL
        const imageUri = result.assets[0].uri;
        const savedImageUrl = await fileManager.saveImage(imageUri);
        // 不再自动调用识别
        setPlantImage(savedImageUrl);
      }
    } catch (error) {
      console.error("Error saving image:", error);
      showMessage({
        message: '保存图片失败，请重试',
        duration: 1000,
        type: "warning"
      });
    } finally {
      setImageLoading(false);
    }
  };

  // Camera function
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      showMessage({
        message: '需要权限，请在设置中开启相机权限',
        duration: 1000,
        type: "info"
      });
      return;
    }

    try {
      setImageLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Save the image using FileManager and get the stored URL
        const imageUri = result.assets[0].uri;
        const savedImageUrl = await fileManager.saveImage(imageUri);
        // 不再自动调用识别
        setPlantImage(savedImageUrl);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      showMessage({
        message: '拍照失败，请重试',
        duration: 1000,
        type: "warning"
      });
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <GradientBackground
      colors={themeMode === 'light'
        ? ['#F5F5F5', '#E8F5E9', '#F5F5F5']
        : ['#222B45', '#1A2138', '#222B45']}
      style={styles.container}
    >
      <PageHeader 
        title={editingPlant ? '编辑植物' : '添加植物'}
        onBack={() => router.back()}
        onRightClick={handleSubmit}
        isSubmitting={imageLoading}
        themeMode={themeMode}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Image Picker */}
        <View style={styles.imagePickerContainer}>
          {plantImage ? (
            <View>
              <Image
                source={{ uri: plantImage }}
                style={styles.plantImagePreview}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <View style={styles.imageOverlayIcons}>
                  <TouchableOpacity style={styles.imageOverlayIconButton} onPress={showImageOptions}>
                    <Icon name="edit-2-outline" fill="#FFFFFF" width={24} height={24} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageOverlayIconButton} onPress={viewImage}>
                    <Icon name="eye-outline" fill="#FFFFFF" width={24} height={24} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageOverlayIconButton} onPress={() => identifyPlant(plantImage)}>
                    <IdentifyIcon width={24} height={24} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={showImageOptions}
              disabled={imageLoading}
            >
              {imageLoading ? (
                <Spinner size="medium" />
              ) : (
                <>
                  <Icon name="camera-outline" fill="#8F9BB3" width={32} height={32} />
                  <Text category="c1" style={{ marginTop: 8, textAlign: 'center' }}>
                    添加图片
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <Input
          placeholder="植物名称"
          value={plantName}
          onChangeText={text => {
            setPlantName(text);
          }}
          style={styles.input}
        />

        <Select
          placeholder="选择类别"
          value={categories[categorySelectedIndex].name}
          selectedIndex={new IndexPath(categorySelectedIndex) }
          onSelect={(index) => {
            setCategorySelectedIndex((index as IndexPath).row);
          }}
          style={styles.select}
        >
          {categories.map(category => (
            <SelectItem key={category.id} title={category.name} />
          ))}
        </Select>

        <Input
          placeholder="描述"
          value={description}
          onChangeText={text => {
            setDescription(text);
          }}
          style={styles.input}
          multiline={true} 
          textStyle={{ minHeight: 100, maxHeight: 200, textAlignVertical: 'top' }}
        />
      </ScrollView>

      {/* Image Viewer */}
      <ImageViewer
        visible={showImageViewer}
        imageUri={selectedImage}
        onClose={() => setShowImageViewer(false)}
      />

      {/* LoadingModal for static method rendering */}
      <LoadingModal />
    </GradientBackground>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  imagePickerContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  plantImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
  },
  imageOverlayIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlayIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  addImageButton: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },

  select: {
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
});

export default PlantEditPage; 