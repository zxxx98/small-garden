import * as React from 'react';
import { StyleSheet, Image, TouchableOpacity, Dimensions, Alert, Platform, View } from 'react-native';
import { Layout, Text, Card, Button, Modal, Input, Select, SelectItem, Icon, IconProps, IndexPath } from '@ui-kitten/components';
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

type PlantItem = {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  image: string;
  lastAction?: { type: string; date: Date };
  nextAction?: { type: string; date: Date };
}

// Mock data for plants - replace with actual data source later
const initialPlants: PlantItem[] = [

];

// Mock categories - replace with actual data source later
const initialCategories = [
  { id: '1', name: '多肉' },
  { id: '2', name: '观叶植物' },
  { id: '3', name: '果蔬' },
  { id: '4', name: '草本' },
];

const PlusIcon = (props: IconProps) => <Icon {...props} name="plus-outline" />;
const TrashIcon = (props: IconProps) => <Icon {...props} name="trash-2-outline" />;
const PlantIcon = (props: IconProps) => <Icon {...props} name="award-outline" />;

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

const PlantsPage = () =>
{
  const [plants, setPlants] = React.useState<PlantItem[]>(initialPlants);
  const [categories, setCategories] = React.useState(initialCategories);
  const [visible, setVisible] = React.useState(false);
  const [addCategoryVisible, setAddCategoryVisible] = React.useState(false);
  const [editingPlant, setEditingPlant] = React.useState<PlantItem | null>(null);
  const [isInDeleteZone, setIsInDeleteZone] = React.useState(false);

  // New plant form state
  const [plantName, setPlantName] = React.useState('');
  const [scientificName, setScientificName] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<any>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<IndexPath>();
  const [newCategory, setNewCategory] = React.useState('');

  // Delete zone animation
  const deleteZoneScale = useSharedValue(1);
  const deleteZoneOpacity = useSharedValue(0);

  const deleteZoneAnimatedStyle = useAnimatedStyle(() =>
  {
    return {
      transform: [{ scale: deleteZoneScale.value }],
      opacity: deleteZoneOpacity.value,
    };
  });

  const showDeleteZone = () =>
  {
    'worklet';
    deleteZoneOpacity.value = withTiming(1, { duration: 200 });
    deleteZoneScale.value = withSpring(1);
  };

  const hideDeleteZone = () =>
  {
    'worklet';
    deleteZoneOpacity.value = withTiming(0, { duration: 200 });
    deleteZoneScale.value = withSpring(1);
  };

  const updateDeleteZoneScale = (scale: number) =>
  {
    'worklet';
    deleteZoneScale.value = withSpring(scale);
  };

  const resetForm = () =>
  {
    setPlantName('');
    setScientificName('');
    setSelectedCategory(null);
    setSelectedIndex(undefined);
    setEditingPlant(null);
  };

  const handleAddPlant = () =>
  {
    if (!plantName.trim()) {
      Alert.alert('错误', '请输入植物名称');
      return;
    }

    const newPlant = {
      id: Date.now().toString(),
      name: plantName,
      scientificName: scientificName || plantName,
      category: selectedCategory?.name || '未分类',
      image: 'https://via.placeholder.com/150', // In a real app, handle image upload
      lastAction: { type: '添加', date: new Date() },
      nextAction: { type: '浇水', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
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
      id: Date.now().toString(),
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
      <Card disabled style={styles.modalCard}>
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
        setVisible(false);
        resetForm();
      }}
    >
      <Card disabled style={styles.modalCard}>
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
      <Text category="h6" style={styles.emptyText}>
        一棵植物都还没有哦，点击屏幕添加吧
      </Text>
    </Layout>
  );

  const [isDragging, setIsDragging] = React.useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = React.useState<number | null>(null);

  const checkIfInDeleteZone = (y: number) =>
  {
    const windowHeight = Dimensions.get('window').height;
    const deleteZoneThreshold = windowHeight * 0.85; // Bottom 15% of screen is delete zone
    return y > deleteZoneThreshold;
  };

  const handleDragStart = (index: number) =>
  {
    showDeleteZone();
    setIsDragging(true);
    setDraggedItemIndex(index);
  };

  const handleDragEnd = ({ data, from }: { data: any[], from: number, to: number }) =>
  {
    // Check if we should delete
    if (isInDeleteZone && draggedItemIndex !== null) {
      const plantToDelete = plants[from];
      handleDeletePlant(plantToDelete.id);
    } else {
      // Otherwise just update order
      setPlants(data);
    }

    // Reset state
    setIsDragging(false);
    setDraggedItemIndex(null);
    hideDeleteZone();
    setIsInDeleteZone(false);
  };

  // This is a simpler method to track position during dragging using pan responder
  React.useEffect(() =>
  {
    if (!isDragging) return;

    const handleMove = (e: any) =>
    {
      if (e && e.nativeEvent && e.nativeEvent.pageY) {
        const isInZone = checkIfInDeleteZone(e.nativeEvent.pageY);
        if (isInZone !== isInDeleteZone) {
          setIsInDeleteZone(isInZone);
          updateDeleteZoneScale(isInZone ? 1.1 : 1);
        }
      }
    };

    // In a real implementation, you would add an actual event listener instead
    // This is a simplified approach for the example
    const intervalId = setInterval(() =>
    {
      // Simulate checking position during drag
      // In practice, we would need to integrate with gesture system
    }, 100);

    return () => clearInterval(intervalId);
  }, [isDragging, isInDeleteZone]);

  // Render each plant item with drag handle
  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<any>) =>
  {
    React.useEffect(() =>
    {
      // Track active state for better UX
      if (isActive && getIndex) {
        const index = getIndex();
        if (index !== null && index !== undefined) {
          setDraggedItemIndex(index);
        }
      }
    }, [isActive]);

    return (
      <ScaleDecorator key={item.id} activeScale={1.05}>
        <OpacityDecorator activeOpacity={1}>
          <TouchableOpacity
            onLongPress={drag}
            delayLongPress={200}
            onPress={() => !isActive && handleEditPlant(item)}
            style={styles.itemContainer}
            activeOpacity={0.7}
          >
            <Layout style={styles.itemAnimatedContainer}>
              <Layout style={styles.itemContent}>
                <Image source={{ uri: item.image }} style={styles.plantImage} />
                <Layout style={styles.plantInfo}>
                  <Text category="h6">{item.name}</Text>
                  <Text category="s1">{item.scientificName}</Text>
                  <Text category="c1">{item.category}</Text>
                  <Layout style={styles.plantActions}>
                    <Text category="p2" status="info">
                      {item.lastAction.type}: {formatTimeDistance(item.lastAction.date)}
                    </Text>
                    <Text category="p2" status="warning">
                      {item.nextAction.type}: {formatTimeDistance(item.nextAction.date)}
                    </Text>
                  </Layout>
                </Layout>
              </Layout>
            </Layout>
          </TouchableOpacity>
        </OpacityDecorator>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#F5F5F5', '#E8F5E9', '#F5F5F5']}
        style={styles.container}
      >
        <Layout style={styles.header}>
          <Text category="h1">花园</Text>
          <Button
            size="small"
            accessoryLeft={PlusIcon}
            onPress={() =>
            {
              resetForm();
              setVisible(true);
            }}
          />
        </Layout>

        {plants.length > 0 ? (
          <Layout style={styles.contentContainer}>
            <DraggableFlatList
              data={plants}
              onDragBegin={handleDragStart}
              onDragEnd={handleDragEnd}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={[styles.list]}
              autoscrollSpeed={100}
              autoscrollThreshold={50}
              dragHitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            />

            {/* Delete zone at bottom - rendered conditionally with animation */}
            <Animated.View style={[
              styles.deleteZone,
              deleteZoneAnimatedStyle,
              isInDeleteZone ? styles.deleteZoneActive : {}
            ]}>
              <Icon
                name="trash-2-outline"
                fill="#ffffff"
                style={styles.deleteZoneIcon}
              />
              <Text style={styles.deleteZoneText}>拖动到此处删除</Text>
            </Animated.View>
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

        {renderAddEditModal()}
        {renderAddCategoryModal()}
      </LinearGradient>
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
    paddingBottom: 120,
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
  deleteZone: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(255,0,0,0.2)',
    zIndex: 500,
    backdropFilter: 'blur(10px)',
  },
  deleteZoneActive: {
    backgroundColor: 'rgba(255,0,0,0.6)',
  },
  deleteZoneIcon: {
    width: 32,
    height: 32,
    marginVertical: 8,
  },
  deleteZoneText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
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
});

export default PlantsPage;