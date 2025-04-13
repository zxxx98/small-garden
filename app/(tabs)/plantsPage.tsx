import * as React from 'react';
import { StyleSheet, Image, TouchableOpacity, Dimensions, Alert, View, FlatList, ScrollView, Animated } from 'react-native';
import { Layout, Text, Card, Button, Modal, Input, Select, SelectItem, Icon, IconProps, IndexPath, CheckBox, Spinner } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import FlowerIcon from '@/assets/svgs/flower1.svg';
import { PlantManager } from '@/models/PlantManager';
import { Plant } from '@/types/plant';
import { ActionManager } from '@/models/ActionManager';
import { generateId } from '@/utils/uuid';
import { ConfigManager } from '@/models/ConfigManager';
import { useTheme } from '../../theme/themeContext';
import * as ImagePicker from 'expo-image-picker';
import { fileManager } from '@/models/FileManager';
import { useFocusEffect } from 'expo-router';
import { theme } from '@/theme/theme';
import SlideUpModal from '@/components/SlideUpModal';
import { identifyPlantWithPlantNet } from '@/utils/PlantNet';
import LoadingModal from '@/components/LoadingModal';

// Define interface for ImageViewer props
interface ImageViewerProps
{
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}

// Image viewer for full-screen display with rotation
const ImageViewer = ({ visible, imageUri, onClose }: ImageViewerProps) =>
{
  const [rotation, setRotation] = React.useState(0);

  const rotateLeft = () =>
  {
    setRotation((prev) => (prev - 90) % 360);
  };

  const rotateRight = () =>
  {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <Modal
      visible={visible}
      backdropStyle={styles.backdrop}
      onBackdropPress={onClose}
    >
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
    </Modal>
  );
};

// New interface for PlantEditForm component
interface PlantEditFormProps
{
  editingPlant: PlantItem | null;
  categories: { id: string; name: string }[];
  themeMode: 'light' | 'dark';
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

// PlantEditForm component to replace the modal
const PlantEditForm = ({
  editingPlant,
  categories,
  themeMode,
  onSubmit,
  onCancel
}: PlantEditFormProps) =>
{
  const [plantName, setPlantName] = React.useState(editingPlant?.name || '');
  const [scientificName, setScientificName] = React.useState(editingPlant?.scientificName || '');
  const [selectedCategory, setSelectedCategory] = React.useState<any>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<IndexPath>();
  const [plantImage, setPlantImage] = React.useState(editingPlant?.image || '');
  const [imageLoading, setImageLoading] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState('');
  const [showImageViewer, setShowImageViewer] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Set initial values when editingPlant changes
  React.useEffect(() =>
  {
    if (editingPlant) {
      setPlantName(editingPlant.name);
      setScientificName(editingPlant.scientificName);
      setPlantImage(editingPlant.image);

      const categoryIndex = categories.findIndex(c => c.name === editingPlant.category);
      if (categoryIndex !== -1) {
        setSelectedCategory(categories[categoryIndex]);
        setSelectedIndex(new IndexPath(categoryIndex));
      }
    } else {
      setPlantName('');
      setScientificName('');
      setPlantImage('');
      setSelectedCategory(null);
      setSelectedIndex(undefined);
    }
  }, [editingPlant, categories]);

  const handleSubmit = () =>
  {
    if (!plantName.trim()) {
      Alert.alert('错误', '请输入植物名称');
      return;
    }

    onSubmit({
      plantName,
      scientificName: scientificName || plantName,
      category: selectedCategory?.name || '未分类',
      image: plantImage || 'https://via.placeholder.com/150'
    });
  };

  const showImageOptions = () =>
  {
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
  const identifyPlant = async (imageUri: string) =>
  {
    const apiKey = await ConfigManager.getInstance().getPlantNetApiKey();
    if (apiKey && imageUri) {
      setLoading(true);
      const result = await identifyPlantWithPlantNet(imageUri, apiKey);
      console.log(result);
      if (result.success) {
        setScientificName(result.scientificName);
        setPlantName(result.commonName);
      }
      // Set the plant image after identification is done
      setPlantImage(imageUri);
      setLoading(false);
    } else {
      setPlantImage(imageUri);
    }
  };

  // Function to view the image in full screen
  const viewImage = () =>
  {
    if (plantImage) {
      setSelectedImage(plantImage);
      setShowImageViewer(true);
    }
  };

  // Image picking function
  const pickImage = async () =>
  {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("需要权限", "需要访问相册权限才能选择图片");
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
        await identifyPlant(savedImageUrl);
      }
    } catch (error) {
      console.error("Error saving image:", error);
      Alert.alert("错误", "保存图片失败，请重试");
    } finally {
      setImageLoading(false);
    }
  };

  // Camera function
  const takePhoto = async () =>
  {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("需要权限", "需要访问相机权限才能拍照");
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
        await identifyPlant(savedImageUrl);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("错误", "拍照失败，请重试");
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <SlideUpModal visible={true} onClose={onCancel} themeMode={themeMode}>
      <View style={styles.formHeader}>
        <Text category="h5" style={styles.formTitle}>
          {editingPlant ? '编辑植物' : '添加植物'}
        </Text>
      </View>

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
        onChangeText={text =>
        {
          setPlantName(text);
          if (!scientificName) {
            setScientificName(text);
          }
        }}
        style={styles.input}
      />

      <Input
        placeholder="植物学名"
        value={scientificName}
        onChangeText={setScientificName}
        style={styles.input}
      />

      <Select
        placeholder="选择类别"
        value={selectedCategory?.name}
        selectedIndex={selectedIndex}
        onSelect={(index) =>
        {
          setSelectedIndex(index as IndexPath);
          if ((index as IndexPath).row !== undefined) {
            setSelectedCategory(categories[(index as IndexPath).row]);
          }
        }}
        style={styles.input}
      >
        {categories.map(category => (
          <SelectItem key={category.id} title={category.name} />
        ))}
      </Select>

      <Button onPress={handleSubmit} style={styles.submitButton}>
        {editingPlant ? '保存' : '添加'}
      </Button>

      <Button appearance="outline" status="basic" onPress={onCancel} style={styles.cancelButton}>
        取消
      </Button>

      {/* Image Viewer */}
      <ImageViewer
        visible={showImageViewer}
        imageUri={selectedImage}
        onClose={() => setShowImageViewer(false)}
      />

      {/* Loading Modal for plant identification */}
      <LoadingModal
        visible={loading}
        message=""
      />
    </SlideUpModal>
  );
};

type PlantItem = {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  image: string;
  isDead?: boolean;
  lastAction?: { type: string; date: Date };
  nextAction?: { type: string; date: Date };
  selected?: boolean; // For multi-select mode
}

const PlusIcon = (props: IconProps) => <Icon fill={theme['color-primary-500']} {...props} name="plus-outline" />;
const DeleteIcon = (props: IconProps) => <Icon {...props} name="trash-2-outline" fill="#fff" width={24} height={24} />;
const CemeteryIcon = (props: IconProps) => <Icon {...props} name="alert-triangle-outline" fill="#fff" width={24} height={24} />;
const EditIcon = (props: IconProps) => <Icon {...props} name="edit-outline" fill={theme['color-primary-500']} width={24} height={24} />;
const CloseIcon = (props: IconProps) => <Icon {...props} name="close-outline" fill="#8F9BB3" width={24} height={24} />;

// Calculate days ago/from now
const formatTimeDistance = (date: Date) =>
{
  const now = new Date();
  const diffTime = Math.abs(date.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (date < now) {
    return `${diffDays}天前`;
  } else {
    return `${diffDays}天后`;
  }
};

const getPlantItem = (plant: Plant): PlantItem =>
{
  return {
    id: plant.id,
    name: plant.name,
    scientificName: plant.scientificName || plant.name,
    category: plant.type,
    image: plant.img,
    isDead: plant.isDead,
    lastAction: undefined,
    nextAction: undefined,
  };
};

const PlantsPage = () =>
{
  const [plants, setPlants] = React.useState<PlantItem[]>([]);
  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = React.useState(false); // Replace visible modal state
  const [editingPlant, setEditingPlant] = React.useState<PlantItem | null>(null);
  const [editMode, setEditMode] = React.useState(false);
  const [selectedPlants, setSelectedPlants] = React.useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = React.useState(false);
  const { themeMode } = useTheme();
  const [newCategory, setNewCategory] = React.useState('');
  const [selectedImage, setSelectedImage] = React.useState('');
  const [showImageViewer, setShowImageViewer] = React.useState(false);

  // Get the appropriate item background color based on theme
  const itemBackgroundColor = themeMode === 'light'
    ? 'rgba(255, 255, 255, 0.95)'
    : 'rgba(43, 50, 65, 0.95)';

  const updatePlants = React.useCallback(
    () =>
    {
      PlantManager.getAllPlants().then((plants) =>
      {
        const plantItems = plants.map(getPlantItem);

        // Create an array of promises for all action queries
        const actionPromises = plantItems.map(plant =>
          ActionManager.getLastAndNextAction(plant.id)
            .then(actionData =>
            {
              return {
                plantId: plant.id,
                actionData,
                success: true
              };
            })
            .catch(error =>
            {
              console.error(`Failed to load actions for plant ${plant.id}:`, error);
              return {
                plantId: plant.id,
                actionData: null,
                success: false
              };
            })
        );

        // Wait for all action queries to complete
        Promise.all(actionPromises)
          .then(results =>
          {
            // Update all plants at once with the action data
            plantItems.forEach(p =>
            {
              const result = results.find(r => r.plantId === p.id);
              if (result) {
                // Create a new plant object with updated data

                if (result.success && result.actionData) {
                  // Handle last action if available
                  if (result.actionData.lastAction) {
                    p.lastAction = {
                      type: result.actionData.lastAction.name,
                      date: new Date(result.actionData.lastAction.time)
                    };
                  }

                  // Handle next action if available
                  if (result.actionData.nextAction) {
                    p.nextAction = {
                      type: result.actionData.nextAction.name,
                      date: new Date(result.actionData.nextAction.time)
                    };
                  }
                }
              }
              return p;
            })
            setPlants(plantItems);
          });
      });
      ConfigManager.getInstance().getCategories().then(categories =>
      {
        setCategories(categories);
      });
    }, [])

  React.useEffect(() =>
  {
    updatePlants();
  }, []);

  useFocusEffect(updatePlants);

  const resetForm = () =>
  {
    setEditingPlant(null);
  };

  const toggleEditMode = () =>
  {
    setEditMode(!editMode);
    // Clear selections when toggling edit mode
    setSelectedPlants([]);
    setIsAllSelected(false);
  };

  const toggleSelectAll = () =>
  {
    if (isAllSelected) {
      // Deselect all
      setSelectedPlants([]);
    } else {
      // Select all non-dead plants
      const allIds = plants
        .filter(plant => !plant.isDead)
        .map(plant => plant.id);
      setSelectedPlants(allIds);
    }
    setIsAllSelected(!isAllSelected);
  };

  const toggleSelectPlant = (id: string) =>
  {
    setSelectedPlants(prev =>
    {
      if (prev.includes(id)) {
        // Remove if already selected
        setIsAllSelected(false);
        return prev.filter(plantId => plantId !== id);
      } else {
        // Add if not selected
        const newSelected = [...prev, id];
        // Check if all plants are now selected
        const allNonDeadPlants = plants.filter(plant => !plant.isDead).length;
        if (newSelected.length === allNonDeadPlants) {
          setIsAllSelected(true);
        }
        return newSelected;
      }
    });
  };

  const handleBatchDelete = () =>
  {
    if (selectedPlants.length === 0) return;

    Alert.alert(
      '确认删除',
      `确定要删除这${selectedPlants.length}个植物吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () =>
          {

            const success = await PlantManager.deletePlants(selectedPlants);
            if (success) {
              setPlants(plants.filter(plant => !selectedPlants.includes(plant.id)));
              setSelectedPlants([]);
              setIsAllSelected(false);
            }
          }
        }
      ]
    );
  };

  const handleBatchMoveToCemetery = () =>
  {
    if (selectedPlants.length === 0) return;

    Alert.alert(
      '确认移入墓地',
      `确定要将这${selectedPlants.length}个植物移入墓地吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () =>
          {
            try {
              // Update plants in the database
              const updatedPlants = await Promise.all(
                selectedPlants.map(async (id) =>
                {
                  const plant = plants.find(p => p.id === id);
                  if (plant) {
                    const updatedPlant = {
                      id: plant.id,
                      name: plant.name,
                      type: plant.category,
                      scientificName: plant.scientificName,
                      remark: '',
                      img: plant.image,
                      isDead: true
                    };

                    // Update in database
                    await PlantManager.updatePlant(updatedPlant);
                    return id;
                  }
                  return null;
                })
              );

              // Update local state
              setPlants(plants.map(p =>
                selectedPlants.includes(p.id) ? { ...p, isDead: true } : p
              ));

              setSelectedPlants([]);
              setIsAllSelected(false);
            } catch (error) {
              console.error('Failed to move plants to cemetery:', error);
              Alert.alert('错误', '移入墓地失败');
            }
          }
        }
      ]
    );
  };

  const handleAddPlant = (formData: any) =>
  {
    const newPlant: PlantItem = {
      id: generateId(),
      name: formData.plantName,
      scientificName: formData.scientificName,
      category: formData.category,
      image: formData.image,
      isDead: false,
    };

    if (editingPlant) {
      setPlants(plants.map(p => p.id === editingPlant.id ? { ...p, ...newPlant, id: p.id } : p));

      // Update in database
      const plantToUpdate: Plant = {
        id: editingPlant.id,
        name: formData.plantName,
        type: formData.category,
        scientificName: formData.scientificName,
        remark: '',
        img: formData.image,
        isDead: false
      };

      PlantManager.updatePlant(plantToUpdate).catch(error =>
      {
        console.error('Failed to update plant:', error);
        Alert.alert('错误', '更新植物失败');
      });
    } else {
      setPlants([...plants, newPlant]);

      // Add to database
      const plantToAdd: Plant = {
        id: newPlant.id,
        name: formData.plantName,
        type: formData.category,
        scientificName: formData.scientificName,
        remark: '',
        img: formData.image,
        isDead: false
      };

      PlantManager.addPlant(plantToAdd).catch(error =>
      {
        console.error('Failed to add plant:', error);
        Alert.alert('错误', '添加植物失败');
      });
    }

    setShowForm(false);
    resetForm();
  };

  const handleDeletePlant = (id: string) =>
  {
    Alert.alert(
      '确认删除',
      '确定要删除这个植物吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () =>
          {
            setPlants(plants.filter(plant => plant.id !== id));
            setIsAllSelected(false);
          }
        }
      ]
    );
  };

  const handleMoveToCemetery = (id: string) =>
  {
    Alert.alert(
      '确认移入墓地',
      '确定要将这个植物移入墓地吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () =>
          {
            try {
              // Update the plant in database
              const plant = plants.find(p => p.id === id);
              if (plant) {
                const updatedPlant = {
                  id: plant.id,
                  name: plant.name,
                  type: plant.category,
                  scientificName: plant.scientificName,
                  remark: '',
                  img: plant.image,
                  isDead: true
                };

                // Update in database
                await PlantManager.updatePlant(updatedPlant);

                // Update local state
                setPlants(plants.map(p =>
                  p.id === id ? { ...p, isDead: true } : p
                ));
              }
            } catch (error) {
              console.error('Failed to move plant to cemetery:', error);
              Alert.alert('错误', '移入墓地失败');
            }
          }
        }
      ]
    );
  };

  const handleEditPlant = (plant: PlantItem) =>
  {
    setEditingPlant(plant);
    setShowForm(true);
  };

  const handleAddCategory = () =>
  {
    if (!newCategory.trim()) {
      Alert.alert('错误', '请输入类别名称');
      return;
    }

    const newCategoryObj = {
      id: generateId(),
      name: newCategory
    };

    setCategories([...categories, newCategoryObj]);
    setNewCategory('');
  };

  // Render each plant item
  const renderItem = ({ item }: { item: PlantItem }) =>
  {
    // Skip dead plants
    if (item.isDead) return null;

    const isSelected = selectedPlants.includes(item.id);

    // Get shadow properties based on theme
    const shadowProps = themeMode === 'light'
      ? {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        borderColor: 'rgba(0, 0, 0, 0.03)',
      }
      : {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        borderColor: 'rgba(255, 255, 255, 0.05)',
      };

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() =>
        {
          if (editMode) {
            toggleSelectPlant(item.id);
          } else {
            handleEditPlant(item);
          }
        }}
        activeOpacity={0.5}
      >
        <View style={[
          styles.itemAnimatedContainer,
          {
            backgroundColor: itemBackgroundColor,
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected
              ? (themeMode === 'light' ? '#3366FF' : '#5E92F3')
              : (themeMode === 'light' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.05)')
          },
          shadowProps
        ]}>
          <Layout style={[styles.itemContent, { backgroundColor: 'transparent' }]}>
            {editMode ? (
              <View style={styles.editModeRow}>
                <CheckBox
                  checked={selectedPlants.includes(item.id)}
                  onChange={() => toggleSelectPlant(item.id)}
                  style={styles.checkbox}
                />
                <Image source={{ uri: item.image }} style={styles.plantImage} />
              </View>
            ) : (
              <Image source={{ uri: item.image }} style={styles.plantImage} />
            )}
            <Layout style={[styles.plantInfo, { backgroundColor: 'transparent' }]}>
              <Text category="h6">{item.name}</Text>
              <Text category="s1">{item.scientificName}</Text>
              <Text category="c1">{item.category}</Text>
              <Layout style={[styles.plantActions, { backgroundColor: 'transparent' }]}>
                <>
                  {item.lastAction && (
                    <Text category="p2" status="info">
                      {item.lastAction.type}: {formatTimeDistance(item.lastAction.date)}
                    </Text>
                  )}
                  {item.nextAction && (
                    <Text category="p2" status="warning">
                      {item.nextAction.type}: {formatTimeDistance(item.nextAction.date)}
                    </Text>
                  )}
                </>
              </Layout>
            </Layout>
          </Layout>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <Layout style={styles.emptyContainer}>
      <FlowerIcon width={100} height={100} />
      <Text category="h5" style={[styles.emptyText, { color: themeMode === 'light' ? '#2C3E50' : '#E4E9F2' }]}>
        您的花园还是空的
      </Text>
      <Text category="p1" style={[styles.emptyText, { color: themeMode === 'light' ? '#2C3E50' : '#E4E9F2', marginTop: 8 }]}>
        点击添加您的第一株植物吧！
      </Text>
    </Layout>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={themeMode === 'light'
          ? ['#F5F5F5', '#E8F5E9', '#F5F5F5']
          : ['#222B45', '#1A2138', '#222B45']}
        style={styles.container}
      >
        <Layout style={[styles.header, { backgroundColor: 'transparent' }]}>
          <Text category="h1">花园</Text>
          {editMode ? (
            <Layout style={[styles.editModeButtons, { backgroundColor: 'transparent' }]}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleEditMode}
              >
                <CloseIcon fill="#8F9BB3" width={24} height={24} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectAllContainer}
                onPress={toggleSelectAll}
              >
                <CheckBox
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                />
                <Text category="c1" style={styles.selectAllText}>全选</Text>
              </TouchableOpacity>
            </Layout>
          ) : (
            <Layout style={[styles.headerButtonsContainer, { backgroundColor: 'transparent' }]}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleEditMode}
              >
                <EditIcon width={24} height={24} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() =>
                {
                  resetForm();
                  setShowForm(true);
                }}
              >
                <PlusIcon width={24} height={24} />
              </TouchableOpacity>
            </Layout>
          )}
        </Layout>

        {editMode && selectedPlants.length > 0 && (
          <Layout style={[styles.batchActionBar, { backgroundColor: 'transparent' }]}>
            <TouchableOpacity
              style={[styles.batchActionButton, styles.dangerButton]}
              onPress={handleBatchDelete}
            >
              <DeleteIcon width={24} height={24} />
              <Text style={styles.actionButtonText}>删除 ({selectedPlants.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.batchActionButton, styles.warningButton]}
              onPress={handleBatchMoveToCemetery}
            >
              <CemeteryIcon width={24} height={24} />
              <Text style={styles.actionButtonText}>移入墓地 ({selectedPlants.length})</Text>
            </TouchableOpacity>
          </Layout>
        )}

        {/* Always render the plant list, and overlay the edit form when needed */}
        {plants.length > 0 ? (
          <Layout style={[styles.contentContainer, { backgroundColor: 'transparent' }]}>
            <FlatList
              data={plants.filter(plant => !plant.isDead)}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={[styles.list]}
              style={{ backgroundColor: 'transparent' }}
            />
          </Layout>
        ) : (
          <TouchableOpacity
            style={styles.emptyStateContainer}
            onPress={() =>
            {
              resetForm();
              setShowForm(true);
            }}
            activeOpacity={0.7}
          >
            {renderEmptyState()}
          </TouchableOpacity>
        )}

        {/* Render the form overlay only when showForm is true */}
        {showForm && (
          <PlantEditForm
            editingPlant={editingPlant}
            categories={categories}
            themeMode={themeMode}
            onSubmit={handleAddPlant}
            onCancel={() =>
            {
              setShowForm(false);
              resetForm();
            }}
          />
        )}
      </LinearGradient>

      {/* Image viewer can be kept outside */}
      <ImageViewer
        visible={showImageViewer}
        imageUri={selectedImage}
        onClose={() => setShowImageViewer(false)}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  itemContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'visible',
    position: 'relative',
  },
  itemAnimatedContainer: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  itemContent: {
    flexDirection: 'row',
    padding: 16,
  },
  plantImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  plantInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  plantActions: {
    marginTop: 8,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(8px)',
  },
  modalCard: {
    width: Dimensions.get('window').width * 0.9,
    maxWidth: 400,
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#2C3E50',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  addCategoryButton: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#2C3E50',
    fontSize: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  editModeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectAllText: {
    marginLeft: 8,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  batchActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  batchActionButton: {
    flex: 1,
    marginHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  dangerButton: {
    backgroundColor: '#FF3D71',
  },
  warningButton: {
    backgroundColor: '#FFAA00',
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
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
  editModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 8,
  },
  formOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9,
    justifyContent: 'flex-end',
  },
  animatedFormContainer: {
    maxHeight: '90%',
    width: '100%',
  },
  formContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  formContentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    textAlign: 'center',
    flex: 1,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(150, 150, 150, 0.3)',
    alignSelf: 'center',
    borderRadius: 5,
    marginBottom: 20,
    marginTop: -10,
  },
  submitButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 20,
  },
});

export default PlantsPage;