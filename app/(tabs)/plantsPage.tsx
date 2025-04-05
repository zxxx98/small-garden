import * as React from 'react';
import { StyleSheet, Image, TouchableOpacity, Dimensions, Alert, View } from 'react-native';
import { Layout, Text, Card, Button, Modal, Input, Select, SelectItem, Icon, IconProps, IndexPath, CheckBox } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
  OpacityDecorator
} from 'react-native-draggable-flatlist';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import FlowerIcon from '@/assets/svgs/flower1.svg';
import { PlantManager } from '@/models/PlantManager';
import { Plant } from '@/types/plant';
import { ActionManager } from '@/models/ActionManager';
import { generateId } from '@/utils/uuid';
import { ConfigManager } from '@/models/ConfigManager';
import { useTheme } from '../../theme/themeContext';

type PlantItem = {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  image: string;
  isDead?: boolean;
  lastAction?: { type: string; date: Date };
  nextAction?: { type: string; date: Date };
  actionsLoading: boolean;
  selected?: boolean; // For multi-select mode
}

const PlusIcon = (props: IconProps) => <Icon {...props} name="plus-outline" />;
const DeleteIcon = (props: IconProps) => <Icon {...props} name="trash-2-outline" fill="#FF3D71" width={24} height={24} />;
const CemeteryIcon = (props: IconProps) => <Icon {...props} name="alert-triangle-outline" fill="#FFAA00" width={24} height={24} />;
const EditIcon = (props: IconProps) => <Icon {...props} name="edit-outline" fill="#3366FF" width={24} height={24} />;
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
    actionsLoading: true,
  };
};

const PlantsPage = () =>
{
  const [plants, setPlants] = React.useState<PlantItem[]>([]);
  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);
  const [visible, setVisible] = React.useState(false);
  const [addCategoryVisible, setAddCategoryVisible] = React.useState(false);
  const [editingPlant, setEditingPlant] = React.useState<PlantItem | null>(null);
  const [editMode, setEditMode] = React.useState(false);
  const [selectedPlants, setSelectedPlants] = React.useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = React.useState(false);
  const { themeMode } = useTheme();

  // New plant form state
  const [plantName, setPlantName] = React.useState('');
  const [scientificName, setScientificName] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<any>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<IndexPath>();
  const [newCategory, setNewCategory] = React.useState('');

  // Get the appropriate item background color based on theme
  const itemBackgroundColor = themeMode === 'light'
    ? 'rgba(255, 255, 255, 0.95)'
    : 'rgba(43, 50, 65, 0.95)';

  React.useEffect(() =>
  {
    PlantManager.getAllPlants().then((plants) =>
    {
      const plantItems = plants.map(getPlantItem);
      setPlants(plantItems);

      // Load actions for each plant
      plantItems.forEach(plant =>
      {
        ActionManager.getLastAndNextAction(plant.id)
          .then(actionData =>
          {
            // Process the action data and update the plant
            setPlants(prevPlants =>
            {
              return prevPlants.map(p =>
              {
                if (p.id === plant.id) {
                  // Create a new plant object with updated data
                  const updatedPlant: PlantItem = {
                    ...p,
                    actionsLoading: false
                  };

                  // Handle last action if available
                  if (actionData.lastAction) {
                    updatedPlant.lastAction = {
                      type: actionData.lastAction.name,
                      date: new Date(actionData.lastAction.time)
                    };
                  }

                  // Handle next action if available
                  if (actionData.nextAction) {
                    updatedPlant.nextAction = {
                      type: actionData.nextAction.name,
                      date: new Date(actionData.nextAction.time)
                    };
                  }

                  return updatedPlant;
                }
                return p;
              });
            });
          })
          .catch(error =>
          {
            console.error(`Failed to load actions for plant ${plant.id}:`, error);
            setPlants(prevPlants =>
              prevPlants.map(p =>
                p.id === plant.id ? { ...p, actionsLoading: false } : p
              )
            );
          });
      });
    });
    ConfigManager.getInstance().getCategories().then(categories =>
    {
      setCategories(categories);
    });
  }, []);

  const resetForm = () =>
  {
    setPlantName('');
    setScientificName('');
    setSelectedCategory(null);
    setSelectedIndex(undefined);
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
          onPress: () =>
          {
            setPlants(plants.filter(plant => !selectedPlants.includes(plant.id)));
            setSelectedPlants([]);
            setIsAllSelected(false);
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

  const handleAddPlant = () =>
  {
    if (!plantName.trim()) {
      Alert.alert('错误', '请输入植物名称');
      return;
    }

    const newPlant: PlantItem = {
      id: generateId(),
      name: plantName,
      scientificName: scientificName || plantName,
      category: selectedCategory?.name || '未分类',
      image: 'https://via.placeholder.com/150', // In a real app, handle image upload
      isDead: false,
      lastAction: { type: '添加', date: new Date() },
      nextAction: { type: '浇水', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
      actionsLoading: false,
    };

    if (editingPlant) {
      setPlants(plants.map(p => p.id === editingPlant.id ? { ...p, ...newPlant, id: p.id } : p));
    } else {
      setPlants([...plants, newPlant]);
    }

    setVisible(false);
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
    setPlantName(plant.name);
    setScientificName(plant.scientificName);

    const categoryIndex = categories.findIndex(c => c.name === plant.category);
    if (categoryIndex !== -1) {
      setSelectedCategory(categories[categoryIndex]);
      setSelectedIndex(new IndexPath(categoryIndex));
    }

    setVisible(true);
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
    setSelectedCategory(newCategoryObj);
    setNewCategory('');
    setAddCategoryVisible(false);
  };

  const renderAddCategoryModal = () => (
    <Modal
      visible={addCategoryVisible}
      backdropStyle={styles.backdrop}
      onBackdropPress={() => setAddCategoryVisible(false)}
    >
      <Card
        style={[
          styles.modalCard,
          { backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(43, 50, 65, 0.98)' }
        ]}
      >
        <Text category="h6" style={styles.modalTitle}>添加新类别</Text>
        <Input
          placeholder="输入类别名称"
          value={newCategory}
          onChangeText={setNewCategory}
          style={styles.input}
        />
        <Button onPress={handleAddCategory}>添加</Button>
      </Card>
    </Modal>
  );

  const renderAddEditModal = () => (
    <Modal
      visible={visible}
      backdropStyle={styles.backdrop}
      onBackdropPress={() =>
      {
        resetForm();
        setVisible(false);
      }}
    >
      <Card
        style={[
          styles.modalCard,
          { backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(43, 50, 65, 0.98)' }
        ]}
      >
        <Text category="h6" style={styles.modalTitle}>
          {editingPlant ? '编辑植物' : '添加植物'}
        </Text>
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
          style={styles.input}>
          {categories.map(category => (
            <SelectItem key={category.id} title={category.name} />
          ))}
        </Select>
        <Button
          appearance="ghost"
          status="basic"
          style={styles.addCategoryButton}
          onPress={() => setAddCategoryVisible(true)}>
          + 添加新类别
        </Button>
        <Button onPress={handleAddPlant}>
          {editingPlant ? '保存' : '添加'}
        </Button>
      </Card>
    </Modal>
  );

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

  // Render each plant item
  const renderItem = ({ item, drag }: RenderItemParams<PlantItem>) =>
  {
    // Skip dead plants
    if (item.isDead) return null;

    const isSelected = selectedPlants.includes(item.id);
    const scale = useSharedValue(1);

    React.useEffect(() =>
    {
      scale.value = withTiming(isSelected ? 0.98 : 1, { duration: 200 });
    }, [isSelected]);

    const animatedStyle = useAnimatedStyle(() =>
    {
      return {
        transform: [{ scale: scale.value }],
        opacity: scale.value,
      };
    });

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
      <ScaleDecorator>
        <OpacityDecorator activeOpacity={0.7}>
          <TouchableOpacity
            style={styles.itemContainer}
            onLongPress={editMode ? undefined : drag}
            disabled={editMode}
            delayLongPress={150}
            onPress={() =>
            {
              if (editMode) {
                toggleSelectPlant(item.id);
              } else {
                handleEditPlant(item);
              }
            }}
          >
            <Animated.View style={[
              styles.itemAnimatedContainer,
              animatedStyle,
              { backgroundColor: itemBackgroundColor },
              shadowProps
            ]}>
              {editMode && (
                <Layout style={styles.checkboxContainer}>
                  <CheckBox
                    checked={selectedPlants.includes(item.id)}
                    onChange={() => toggleSelectPlant(item.id)}
                  />
                </Layout>
              )}
              <Layout style={styles.itemContent}>
                <Image source={{ uri: item.image }} style={styles.plantImage} />
                <Layout style={styles.plantInfo}>
                  <Text category="h6">{item.name}</Text>
                  <Text category="s1">{item.scientificName}</Text>
                  <Text category="c1">{item.category}</Text>
                  <Layout style={styles.plantActions}>
                    {item.actionsLoading ? (
                      <>
                        <Text category="p2" status="basic" appearance="hint">加载中...</Text>
                      </>
                    ) : (
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
                    )}
                  </Layout>
                </Layout>
              </Layout>
            </Animated.View>
          </TouchableOpacity>
        </OpacityDecorator>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={themeMode === 'light'
          ? ['#F5F5F5', '#E8F5E9', '#F5F5F5']
          : ['#222B45', '#1A2138', '#222B45']}
        style={styles.container}
      >
        <Layout style={styles.header}>
          <Text category="h1">花园</Text>
          {editMode ? (
            <Layout style={styles.editModeButtons}>
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
            <Layout style={styles.headerButtonsContainer}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleEditMode}
              >
                <EditIcon fill="#3366FF" width={24} height={24} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() =>
                {
                  resetForm();
                  setVisible(true);
                }}
              >
                <PlusIcon fill="#3366FF" width={24} height={24} />
              </TouchableOpacity>
            </Layout>
          )}
        </Layout>

        {editMode && selectedPlants.length > 0 && (
          <Layout style={styles.batchActionBar}>
            <TouchableOpacity
              style={[styles.batchActionButton, styles.dangerButton]}
              onPress={handleBatchDelete}
            >
              <DeleteIcon fill="#FFFFFF" width={24} height={24} />
              <Text style={styles.actionButtonText}>删除 ({selectedPlants.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.batchActionButton, styles.warningButton]}
              onPress={handleBatchMoveToCemetery}
            >
              <CemeteryIcon fill="#FFFFFF" width={24} height={24} />
              <Text style={styles.actionButtonText}>移入墓地 ({selectedPlants.length})</Text>
            </TouchableOpacity>
          </Layout>
        )}

        {plants.length > 0 ? (
          <Layout style={styles.contentContainer}>
            <DraggableFlatList
              data={plants.filter(plant => !plant.isDead)}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={[styles.list]}
              onDragEnd={({ data }) =>
              {
                // We need to merge the filtered data back with dead plants
                const deadPlants = plants.filter(plant => plant.isDead);
                setPlants([...data, ...deadPlants]);
              }}
            />
          </Layout>
        ) : (
          <TouchableOpacity
            style={styles.emptyStateContainer}
            onPress={() =>
            {
              resetForm();
              setVisible(true);
            }}
            activeOpacity={0.7}
          >
            {renderEmptyState()}
          </TouchableOpacity>
        )}

      </LinearGradient>
      {renderAddEditModal()}
      {renderAddCategoryModal()}
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
    elevation: 3,
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
  checkboxContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
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
});

export default PlantsPage;