import * as React from 'react';
import { StyleSheet, Image, TouchableOpacity, Dimensions, Alert, View, FlatList } from 'react-native';
import { Layout, Text, Modal, Icon, IconProps, CheckBox } from '@ui-kitten/components';
import FlowerIcon from '@/assets/svgs/flower1.svg';
import { useTheme } from '../../theme/themeContext';
import { theme } from '@/theme/theme';
import LoadingModal from '@/components/LoadingModal';
import { showMessage } from "react-native-flash-message";
import { observer } from 'mobx-react-lite';
import { rootStore } from '@/stores/RootStore';
import { useRouter } from 'expo-router';
import GradientBackground from '@/components/GradientBackground';
import { IPlantModel } from '@/stores/PlantStore';

// Define interface for ImageViewer props
interface ImageViewerProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}

// Image viewer for full-screen display with rotation
const ImageViewer = ({ visible, imageUri, onClose }: ImageViewerProps) => {
  const [rotation, setRotation] = React.useState(0);

  const rotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const rotateRight = () => {
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

type PlantItem = {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  image: string;
  isDead?: boolean;
  lastAction: { name: string; time: number } | null;
  nextAction: { name: string; time: number } | null;
  selected?: boolean; // For multi-select mode
}

const PlusIcon = (props: IconProps) => <Icon fill={theme['color-primary-500']} {...props} name="plus-outline" />;
const DeleteIcon = (props: IconProps) => <Icon {...props} name="trash-2-outline" fill="#fff" width={24} height={24} />;
const CemeteryIcon = (props: IconProps) => <Icon {...props} name="alert-triangle-outline" fill="#fff" width={24} height={24} />;
const EditIcon = (props: IconProps) => <Icon {...props} name="edit-outline" fill={theme['color-primary-500']} width={24} height={24} />;
const CloseIcon = (props: IconProps) => <Icon {...props} name="close-outline" fill="#8F9BB3" width={24} height={24} />;
const IdentifyIcon = (props: IconProps) => <Icon {...props} name="search-outline" fill="#FFFFFF" width={24} height={24} />;

// Calculate days ago/from now
const formatTimeDistance = (date: number) => {
  const now = new Date();
  const diffTime = Math.abs(date - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (date < now.getTime()) {
    return `${diffDays}天前`;
  } else {
    return `${diffDays}天后`;
  }
};

const getPlantItem = (plant: IPlantModel): PlantItem => {
  return {
    id: plant.id,
    name: plant.name,
    scientificName: plant.scientificName || plant.name,
    category: plant.type,
    image: plant.img,
    isDead: plant.isDead,
    lastAction: plant.lastActionAndNextAction.last,
    nextAction: plant.lastActionAndNextAction.next,
  };
};

const PlantsPage = observer(() => {
  const router = useRouter();
  const plants = rootStore.plantStore.alivePlants;
  const categories = rootStore.settingStore.categories;
  const [editMode, setEditMode] = React.useState(false);
  const [selectedPlants, setSelectedPlants] = React.useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = React.useState(false);
  const { themeMode } = useTheme();
  const [selectedImage, setSelectedImage] = React.useState('');
  const [showImageViewer, setShowImageViewer] = React.useState(false);

  // Determine background colors based on theme
  const gradientColors = themeMode === 'light'
    ? ['#F0F8F0', '#E8F5E9', '#F0F8F0'] as const // 浅绿色调渐变,营造自然、生机的氛围
    : ['#1A231D', '#162419', '#1A231D'] as const // 深绿色调渐变,保持暗色主题的同时带来植物感

  // Get the appropriate item background color based on theme
  const itemBackgroundColor = themeMode === 'light'
    ? 'rgba(255, 255, 255, 0.95)'
    : 'rgba(43, 50, 65, 0.95)';

  const toggleEditMode = () => {
    setEditMode(!editMode);
    // Clear selections when toggling edit mode
    setSelectedPlants([]);
    setIsAllSelected(false);
  };

  const toggleSelectAll = () => {
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

  const toggleSelectPlant = (id: string) => {
    setSelectedPlants(prev => {
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

  const handleBatchDelete = () => {
    if (selectedPlants.length === 0) return;

    Alert.alert(
      '确认删除',
      `确定要删除这${selectedPlants.length}个植物吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            LoadingModal.show("删除中...");
            const success = await rootStore.plantStore.deletePlants(selectedPlants);
            LoadingModal.hide();
            if (success) {
              showMessage({
                message: '删除成功',
                duration: 1000,
                type: "success"
              });
              setSelectedPlants([]);
              setIsAllSelected(false);
            } else {
              showMessage({
                message: '删除失败',
                duration: 1000,
                type: "warning"
              });
            }
          }
        }
      ]
    );
  };

  const handleBatchMoveToCemetery = () => {
    if (selectedPlants.length === 0) return;

    Alert.alert(
      '确认移入墓地',
      `确定要将这${selectedPlants.length}个植物移入墓地吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              // Update plants in the database
              await rootStore.plantStore.moveToCemeterys(selectedPlants);
              setSelectedPlants([]);
              setIsAllSelected(false);
            } catch (error) {
              console.error('Failed to move plants to cemetery:', error);
              showMessage({
                message: '移入墓地失败',
                duration: 1000,
                type: "warning"
              });
            }
          }
        }
      ]
    );
  };

  const handleEditPlant = (plant: PlantItem) => {
    router.push({
      pathname: '/plant/[id]/page',
      params: { id: plant.id }
    });
  };

  const handleAddPlant = () => {
    router.push('/plant-edit');
  };

  // Render each plant item
  const renderItem = ({ item }: { item: PlantItem }) => {
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
        onPress={() => {
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
                      {item.lastAction.name}: {formatTimeDistance(item.lastAction.time)}
                    </Text>
                  )}
                  {item.nextAction && (
                    <Text category="p2" status="warning">
                      {item.nextAction.name}: {formatTimeDistance(item.nextAction.time)}
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
    <GradientBackground colors={gradientColors} >
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
              onPress={handleAddPlant}
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

      {plants.length > 0 ? (
        <Layout style={[styles.contentContainer, { backgroundColor: 'transparent' }]}>
          <FlatList
            data={rootStore.plantStore.alivePlants.map(getPlantItem)}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.list]}
            style={{ backgroundColor: 'transparent' }}
          />
        </Layout>
      ) : (
        <TouchableOpacity
          style={styles.emptyStateContainer}
          onPress={handleAddPlant}
          activeOpacity={0.7}
        >
          {renderEmptyState()}
        </TouchableOpacity>
      )}

      <ImageViewer
        visible={showImageViewer}
        imageUri={selectedImage}
        onClose={() => setShowImageViewer(false)}
      />

      <LoadingModal />
    </GradientBackground>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

export default PlantsPage;