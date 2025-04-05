import * as React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, View, Dimensions, Image } from 'react-native';
import
{
  Layout,
  Text,
  Toggle,
  Divider,
  List,
  ListItem,
  Icon,
  IconProps,
  Button,
  Card,
  Modal,
  Input,
  TopNavigation,
  TopNavigationAction
} from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/themeContext';
import { useCategories, Category } from '../../context/CategoryContext';
import { PlantManager } from '@/models/PlantManager';
import { Plant } from '@/types/plant';

// Icons
const SunIcon = (props: IconProps) => <Icon {...props} name="sun-outline" />;
const MoonIcon = (props: IconProps) => <Icon {...props} name="moon-outline" />;
const EditIcon = (props: IconProps) => <Icon {...props} name="edit-outline" />;
const TrashIcon = (props: IconProps) => <Icon {...props} name="trash-2-outline" />;
const PlusIcon = (props: IconProps) => <Icon {...props} name="plus-outline" />;
const CategoryIcon = (props: IconProps) => <Icon {...props} name="folder-outline" />;
const BackIcon = (props: IconProps) => <Icon {...props} name="arrow-back-outline" />;
const CemeteryIcon = (props: IconProps) => <Icon {...props} name="alert-triangle-outline" />;
const ResurrectIcon = (props: IconProps) => <Icon {...props} name="activity-outline" />;

type PlantItem = {
  id: string;
  name: string;
  scientificName: string;
  type: string;
  remark?: string;
  img: string;
  isDead: boolean;
};

const SettingsPage = () =>
{
  // Theme context
  const { themeMode, toggleTheme } = useTheme();

  // Categories context
  const { categories, addCategory, updateCategory, deleteCategory, loading } = useCategories();

  // State for category management
  const [categoryModalVisible, setCategoryModalVisible] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [categoryName, setCategoryName] = React.useState('');

  // State for section management
  const [activeSection, setActiveSection] = React.useState<'main' | 'categories' | 'cemetery'>('main');

  // State for cemetery plants
  const [deadPlants, setDeadPlants] = React.useState<PlantItem[]>([]);
  const [cemeteryLoading, setCemeteryLoading] = React.useState(false);
  const [showResurrectModal, setShowResurrectModal] = React.useState(false);
  const [selectedDeadPlant, setSelectedDeadPlant] = React.useState<PlantItem | null>(null);

  // Load dead plants when entering cemetery view
  React.useEffect(() =>
  {
    if (activeSection === 'cemetery') {
      loadDeadPlants();
    }
  }, [activeSection]);

  // Reset category form
  const resetCategoryForm = () =>
  {
    setEditingCategory(null);
    setCategoryName('');
  };

  // Handle showing add/edit category modal
  const handleShowCategoryModal = (category?: Category) =>
  {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      resetCategoryForm();
    }
    setCategoryModalVisible(true);
  };

  // Handle adding/editing category
  const handleSaveCategory = async () =>
  {
    if (!categoryName.trim()) {
      Alert.alert('错误', '请输入类别名称');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryName);
      } else {
        await addCategory(categoryName);
      }
      setCategoryModalVisible(false);
      resetCategoryForm();
    } catch (error) {
      Alert.alert('错误', '保存类别失败');
    }
  };

  // Handle deleting category
  const handleDeleteCategory = (category: Category) =>
  {
    Alert.alert(
      '确认删除',
      `确定要删除 "${category.name}" 类别吗？这可能会影响已经分配到该类别的植物。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () =>
          {
            try {
              await deleteCategory(category.id);
            } catch (error) {
              Alert.alert('错误', '删除类别失败');
            }
          }
        }
      ]
    );
  };

  // Load dead plants from database
  const loadDeadPlants = async () =>
  {
    setCemeteryLoading(true);
    try {
      const plants = await PlantManager.getAllPlants();
      const deadPlants = plants.filter(plant => plant.isDead).map(plant => ({
        id: plant.id,
        name: plant.name,
        scientificName: plant.scientificName || plant.name,
        type: plant.type,
        remark: plant.remark || '',
        img: plant.img,
        isDead: plant.isDead
      }));
      setDeadPlants(deadPlants);
    } catch (error) {
      console.error('Failed to load dead plants:', error);
      Alert.alert('错误', '加载墓地植物失败');
    } finally {
      setCemeteryLoading(false);
    }
  };

  // Handle resurrect plant (set isDead to false)
  const handleResurrectPlant = async () =>
  {
    if (!selectedDeadPlant) return;

    try {
      // Update the plant in database
      const updatedPlant: Plant = {
        id: selectedDeadPlant.id,
        name: selectedDeadPlant.name,
        type: selectedDeadPlant.type,
        scientificName: selectedDeadPlant.scientificName,
        remark: selectedDeadPlant.remark || '',
        img: selectedDeadPlant.img,
        isDead: false
      };

      // Update in database
      await PlantManager.updatePlant(updatedPlant);

      // Update local state
      setDeadPlants(deadPlants.filter(p => p.id !== selectedDeadPlant.id));
      setShowResurrectModal(false);
      setSelectedDeadPlant(null);

      Alert.alert('成功', `${selectedDeadPlant.name} 已从墓地中复活`);
    } catch (error) {
      console.error('Failed to resurrect plant:', error);
      Alert.alert('错误', '复活植物失败');
    }
  };

  // Handle permanently delete dead plant
  const handlePermanentlyDeletePlant = (plant: PlantItem) =>
  {
    Alert.alert(
      '确认永久删除',
      `确定要永久删除植物 "${plant.name}" 吗？此操作无法撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '永久删除',
          style: 'destructive',
          onPress: async () =>
          {
            try {
              await PlantManager.deletePlant(plant.id);
              setDeadPlants(deadPlants.filter(p => p.id !== plant.id));
            } catch (error) {
              console.error('Failed to delete plant:', error);
              Alert.alert('错误', '删除植物失败');
            }
          }
        }
      ]
    );
  };

  // Render category item
  const renderCategoryItem = ({ item }: { item: Category }) => (
    <ListItem
      title={item.name}
      accessoryLeft={(props) => <CategoryIcon {...props} />}
      accessoryRight={() => (
        <View style={styles.categoryItemActions}>
          <TouchableOpacity
            style={styles.categoryActionButton}
            onPress={() => handleShowCategoryModal(item)}
          >
            <EditIcon fill="#8F9BB3" width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryActionButton}
            onPress={() => handleDeleteCategory(item)}
          >
            <TrashIcon fill="#FF3D71" width={20} height={20} />
          </TouchableOpacity>
        </View>
      )}
    />
  );

  // Render dead plant item
  const renderDeadPlantItem = ({ item }: { item: PlantItem }) => (
    <ListItem
      title={item.name}
      description={`${item.type}${item.scientificName ? ` | ${item.scientificName}` : ''}`}
      accessoryLeft={() => (
        <View style={styles.deadPlantImageContainer}>
          {item.img ? (
            <Image
              source={{ uri: item.img }}
              style={styles.deadPlantImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.deadPlantImage, styles.noImage]}>
              <Icon name="image-outline" fill="#8F9BB3" width={24} height={24} />
            </View>
          )}
        </View>
      )}
      accessoryRight={() => (
        <View style={styles.categoryItemActions}>
          <TouchableOpacity
            style={styles.categoryActionButton}
            onPress={() =>
            {
              setSelectedDeadPlant(item);
              setShowResurrectModal(true);
            }}
          >
            <ResurrectIcon fill="#3366FF" width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryActionButton}
            onPress={() => handlePermanentlyDeletePlant(item)}
          >
            <TrashIcon fill="#FF3D71" width={20} height={20} />
          </TouchableOpacity>
        </View>
      )}
    />
  );

  // Render category management modal
  const renderCategoryModal = () => (
    <Modal
      visible={categoryModalVisible}
      backdropStyle={styles.backdrop}
      onBackdropPress={() =>
      {
        setCategoryModalVisible(false);
        resetCategoryForm();
      }}
    >
      <Card
        disabled
        style={[
          styles.modalCard,
          { backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(43, 50, 65, 0.98)' }
        ]}
      >
        <Text category="h6" style={styles.modalTitle}>
          {editingCategory ? '编辑类别' : '添加类别'}
        </Text>
        <Input
          placeholder="类别名称"
          value={categoryName}
          onChangeText={setCategoryName}
          style={styles.input}
        />
        <Button onPress={handleSaveCategory}>
          {editingCategory ? '保存' : '添加'}
        </Button>
      </Card>
    </Modal>
  );

  // Render resurrect plant modal
  const renderResurrectModal = () => (
    <Modal
      visible={showResurrectModal}
      backdropStyle={styles.backdrop}
      onBackdropPress={() =>
      {
        setShowResurrectModal(false);
        setSelectedDeadPlant(null);
      }}
    >
      <Card
        disabled
        style={[
          styles.modalCard,
          { backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(43, 50, 65, 0.98)' }
        ]}
      >
        <Text category="h6" style={styles.modalTitle}>复活植物</Text>
        <Text style={styles.resurrectText}>
          确定要将植物 "{selectedDeadPlant?.name || ''}" 从墓地中复活吗？
        </Text>
        <Layout style={styles.resurrectButtonsContainer}>
          <Button
            status="basic"
            style={styles.resurrectButton}
            onPress={() =>
            {
              setShowResurrectModal(false);
              setSelectedDeadPlant(null);
            }}
          >
            取消
          </Button>
          <Button
            status="primary"
            style={styles.resurrectButton}
            onPress={handleResurrectPlant}
          >
            复活
          </Button>
        </Layout>
      </Card>
    </Modal>
  );

  // Render main settings section
  const renderMainSection = () => (
    <>
      <Layout style={styles.section}>
        <Text category="h6" style={styles.sectionTitle}>外观</Text>
        <Layout style={styles.settingRow}>
          <Layout style={styles.settingInfo}>
            <Text category="s1">暗黑模式</Text>
            <Text appearance="hint" category="p2">切换应用的亮暗主题</Text>
          </Layout>
          <Toggle
            checked={themeMode === 'dark'}
            onChange={toggleTheme}
            status="primary"
          />
        </Layout>
      </Layout>

      <Divider />

      <Layout style={styles.section}>
        <Text category="h6" style={styles.sectionTitle}>内容管理</Text>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveSection('categories')}
        >
          <Layout style={styles.navItemInner}>
            <CategoryIcon fill="#8F9BB3" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">管理植物类别</Text>
              <Text appearance="hint" category="p2">添加、编辑或删除植物类别</Text>
            </Layout>
            <Icon name="chevron-right-outline" fill="#8F9BB3" width={24} height={24} />
          </Layout>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveSection('cemetery')}
        >
          <Layout style={styles.navItemInner}>
            <CemeteryIcon fill="#FFAA00" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">查看墓地</Text>
              <Text appearance="hint" category="p2">查看已死亡的植物，可以复活或永久删除</Text>
            </Layout>
            <Icon name="chevron-right-outline" fill="#8F9BB3" width={24} height={24} />
          </Layout>
        </TouchableOpacity>
      </Layout>

      <Divider />

      <Layout style={styles.section}>
        <Text category="h6" style={styles.sectionTitle}>关于</Text>
        <Layout style={styles.aboutContent}>
          <Text category="s1" style={styles.appName}>小花园应用</Text>
          <Text appearance="hint" category="p2">版本 1.0.0</Text>
          <Text appearance="hint" category="p2" style={styles.copyright}>© 2023 小花园团队</Text>
        </Layout>
      </Layout>
    </>
  );

  // Render categories management section
  const renderCategoriesSection = () => (
    <>
      <TopNavigation
        title="管理植物类别"
        alignment="center"
        accessoryLeft={() => (
          <TopNavigationAction
            icon={BackIcon}
            onPress={() => setActiveSection('main')}
          />
        )}
        accessoryRight={() => (
          <TopNavigationAction
            icon={PlusIcon}
            onPress={() => handleShowCategoryModal()}
          />
        )}
      />

      <Divider />

      {loading ? (
        <Layout style={styles.loadingContainer}>
          <Text appearance="hint">加载中...</Text>
        </Layout>
      ) : (
        <List
          data={categories}
          renderItem={renderCategoryItem}
          ItemSeparatorComponent={Divider}
          contentContainerStyle={styles.categoriesList}
          ListEmptyComponent={() => (
            <Layout style={styles.emptyContainer}>
              <Text appearance="hint">没有植物类别，点击右上角添加</Text>
            </Layout>
          )}
        />
      )}
    </>
  );

  // Render cemetery section
  const renderCemeterySection = () => (
    <>
      <TopNavigation
        title="植物墓地"
        alignment="center"
        accessoryLeft={() => (
          <TopNavigationAction
            icon={BackIcon}
            onPress={() => setActiveSection('main')}
          />
        )}
      />

      <Divider />

      {cemeteryLoading ? (
        <Layout style={styles.loadingContainer}>
          <Text appearance="hint">加载中...</Text>
        </Layout>
      ) : (
        <List
          data={deadPlants}
          renderItem={renderDeadPlantItem}
          ItemSeparatorComponent={Divider}
          contentContainerStyle={styles.categoriesList}
          ListEmptyComponent={() => (
            <Layout style={styles.cemeteryEmpty}>
              <Icon name="heart-outline" fill="#8F9BB3" width={60} height={60} />
              <Text category="h6" style={styles.cemeteryEmptyTitle}>墓地是空的</Text>
              <Text appearance="hint" style={styles.cemeteryEmptyText}>
                您所有的植物都健康存活 🌱
              </Text>
            </Layout>
          )}
        />
      )}
    </>
  );

  // Determine background colors based on theme
  const gradientColors = themeMode === 'light'
    ? ['#F5F5F5', '#F3E5F5', '#F5F5F5'] as const
    : ['#222B45', '#1A2138', '#222B45'] as const;

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
    >
      {activeSection === 'main' ? (
        <>
          <Layout style={styles.header}>
            <Text category="h1">设置</Text>
          </Layout>
          <ScrollView style={styles.scrollView}>
            {renderMainSection()}
          </ScrollView>
        </>
      ) : activeSection === 'categories' ? (
        <Layout style={styles.sectionContainer}>
          {renderCategoriesSection()}
        </Layout>
      ) : (
        <Layout style={styles.sectionContainer}>
          {renderCemeterySection()}
        </Layout>
      )}

      {renderCategoryModal()}
      {renderResurrectModal()}
    </LinearGradient>
  );
};

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
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  section: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  settingInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  navItem: {
    paddingVertical: 12,
  },
  navItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  navItemIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  navItemContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  aboutContent: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  appName: {
    marginBottom: 8,
  },
  copyright: {
    marginTop: 16,
  },
  categoriesList: {
    paddingBottom: 16,
  },
  categoryItemActions: {
    flexDirection: 'row',
  },
  categoryActionButton: {
    padding: 8,
    marginLeft: 4,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    width: Dimensions.get('window').width * 0.85,
    maxWidth: 400,
    borderRadius: 16,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  deadPlantImageContainer: {
    marginRight: 12,
  },
  deadPlantImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F7F9FC',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  cemeteryEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  cemeteryEmptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  cemeteryEmptyText: {
    textAlign: 'center',
  },
  resurrectText: {
    marginBottom: 20,
    textAlign: 'center',
  },
  resurrectButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  resurrectButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default SettingsPage;