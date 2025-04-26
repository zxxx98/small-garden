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
  TopNavigationAction,
  Select,
  SelectItem,
  IndexPath as IconPath
} from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/themeContext';
import { useCategories, Category } from '../../context/CategoryContext';
import { PlantManager } from '@/models/PlantManager';
import { Plant } from '@/types/plant';
import { ConfigManager } from '@/models/ConfigManager';
import { ActionType } from '@/types/action';
import { clearActionTypesCache } from '@/utils/action';
import * as ImagePicker from 'expo-image-picker';
import { FileManager } from '@/models/FileManager';
import { R2Config } from '@/types/config';
import { showMessage } from "react-native-flash-message";
import { DatabaseInstance } from '@/models/sqlite/database';
import LoadingModal from '@/components/LoadingModal';
import { CloudflareR2Manager } from '@/models/CloudflareR2Manager';

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
const ActionTypeIcon = (props: IconProps) => <Icon {...props} name="droplet-outline" />;
const CloudIcon = (props: IconProps) => <Icon {...props} name="cloud-upload-outline" />;
const FlowerIcon = (props: IconProps) => <Icon {...props} name="keypad-outline" />;
const TrashIcon2 = (props: IconProps) => <Icon {...props} name="trash-outline" />;

// Available icon packs for selection
const iconPacks = [
  { text: 'UI Kitten', value: undefined },
  { text: 'Ionicons', value: 'ionicons' },
  { text: 'Material Community', value: 'materialCommunityIcons' },
  { text: 'Feather', value: 'feather' }
];

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

  // State for action types management
  const [actionTypes, setActionTypes] = React.useState<ActionType[]>([]);
  const [actionTypesLoading, setActionTypesLoading] = React.useState(false);
  const [actionTypeModalVisible, setActionTypeModalVisible] = React.useState(false);
  const [editingActionType, setEditingActionType] = React.useState<ActionType | null>(null);
  const [actionTypeName, setActionTypeName] = React.useState('');
  const [iconName, setIconName] = React.useState('');
  const [iconPack, setIconPack] = React.useState<string | undefined>(undefined);
  const [useCustomImage, setUseCustomImage] = React.useState(true);
  const [iconImage, setIconImage] = React.useState<string | undefined>(undefined);
  const [selectedIconPackIndex, setSelectedIconPackIndex] = React.useState<number>(0); // Default UI Kitten

  // Section management state
  const [activeSection, setActiveSection] = React.useState<'main' | 'categories' | 'cemetery' | 'actionTypes'>('main');

  // Cemetery state
  const [deadPlants, setDeadPlants] = React.useState<PlantItem[]>([]);
  const [cemeteryLoading, setCemeteryLoading] = React.useState(false);
  const [showResurrectModal, setShowResurrectModal] = React.useState(false);
  const [selectedDeadPlant, setSelectedDeadPlant] = React.useState<PlantItem | null>(null);

  // R2 configuration state
  const [r2ConfigModalVisible, setR2ConfigModalVisible] = React.useState(false);
  const [r2Config, setR2Config] = React.useState<R2Config>({
    accountId: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: '',
    publicUrl: ''
  });
  const [useR2Storage, setUseR2Storage] = React.useState(false);
  const [r2ConfigLoading, setR2ConfigLoading] = React.useState(false);

  // PlantNet API key state
  const [plantNetApiKey, setPlantNetApiKey] = React.useState<string>('');
  const [plantNetApiKeyModalVisible, setPlantNetApiKeyModalVisible] = React.useState(false);
  const [plantNetApiKeyLoading, setPlantNetApiKeyLoading] = React.useState(false);
  
  // 缓存清理状态
  const [clearCacheLoading, setClearCacheLoading] = React.useState(false);

  // Load dead plants when entering cemetery view
  React.useEffect(() =>
  {
    if (activeSection === 'cemetery') {
      loadDeadPlants();
    } else if (activeSection === 'actionTypes') {
      loadActionTypes();
    }
  }, [activeSection]);

  // Load PlantNet API key
  const loadPlantNetApiKey = async () =>
  {
    setPlantNetApiKeyLoading(true);
    try {
      const configManager = ConfigManager.getInstance();
      const apiKey = await configManager.getPlantNetApiKey();
      if (apiKey) {
        setPlantNetApiKey(apiKey);
      }
    } catch (error) {
      console.error('Failed to load PlantNet API key:', error);
      showMessage({
        message: '加载PlantNet API key失败',
        duration: 1000,
        type: "warning"
      });
    } finally {
      setPlantNetApiKeyLoading(false);
    }
  };

  // Load R2 configuration when the component mounts
  React.useEffect(() =>
  {
    loadR2Config();
    loadPlantNetApiKey();
  }, []);

  // Load action types
  const loadActionTypes = async () =>
  {
    setActionTypesLoading(true);
    try {
      const types = await ConfigManager.getInstance().getActionTypes();
      setActionTypes(types);
    } catch (error) {
      console.error('Failed to load action types:', error);
      showMessage({
        message: '加载行为类型失败',
        duration: 1000,
        type: "warning"
      });
    } finally {
      setActionTypesLoading(false);
    }
  };

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
      showMessage({
        message: '请输入类别名称',
        duration: 1000,
        type: "warning"
      });
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
      showMessage({
        message: '保存类别失败',
        duration: 1000,
        type: "warning"
      });
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
              showMessage({
                message: '删除类别失败',
                duration: 1000,
                type: "warning"
              });
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
      showMessage({
        message: '加载墓地植物失败',
        duration: 1000,
        type: "warning"
      });
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

      showMessage({
        message: `${selectedDeadPlant.name} 已从墓地中复活`,
        duration: 1000,
        type: "success"
      });
    } catch (error) {
      console.error('Failed to resurrect plant:', error);
      showMessage({
        message: '复活植物失败',
        duration: 1000,
        type: "warning"
      });
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
              showMessage({
                message: '删除植物失败',
                duration: 1000,
                type: "warning"
              });
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
    <ScrollView style={styles.container}>
      <Layout style={styles.section}>
        <Text category="h6" style={styles.sectionTitle}>外观</Text>
        <Layout style={styles.settingItem}>
          <Text>暗色模式</Text>
          <Toggle checked={themeMode === 'dark'} onChange={toggleTheme} />
        </Layout>
      </Layout>

      <Layout style={styles.section}>
        <Text category="h6" style={styles.sectionTitle}>数据管理</Text>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveSection('categories')}
        >
          <Layout style={styles.navItemInner}>
            <CategoryIcon fill="#3366FF" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">植物类别管理</Text>
              <Text appearance="hint" category="p2">添加、编辑或删除植物类别</Text>
            </Layout>
            <Icon name="chevron-right-outline" fill="#8F9BB3" width={24} height={24} />
          </Layout>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveSection('actionTypes')}
        >
          <Layout style={styles.navItemInner}>
            <ActionTypeIcon fill="#3366FF" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">行为类型管理</Text>
              <Text appearance="hint" category="p2">添加、编辑或删除自定义行为类型</Text>
            </Layout>
            <Icon name="chevron-right-outline" fill="#8F9BB3" width={24} height={24} />
          </Layout>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveSection('cemetery')}
        >
          <Layout style={styles.navItemInner}>
            <CemeteryIcon fill="#3366FF" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">植物墓地</Text>
              <Text appearance="hint" category="p2">管理已标记为死亡的植物</Text>
            </Layout>
            <Icon name="chevron-right-outline" fill="#8F9BB3" width={24} height={24} />
          </Layout>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={handleClearCache}
        >
          <Layout style={styles.navItemInner}>
            <TrashIcon2 fill="#3366FF" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">清理图片缓存</Text>
              <Text appearance="hint" category="p2">清理所有已缓存的图片，释放存储空间</Text>
            </Layout>
            <Icon name="chevron-right-outline" fill="#8F9BB3" width={24} height={24} />
          </Layout>
        </TouchableOpacity>

        <Button
          appearance="ghost"
          status="danger"
          accessoryLeft={(props) => <Icon {...props} name="refresh-outline" />}
          onPress={() =>
          {
            Alert.alert(
              '重置数据库',
              '确定要重置数据库结构吗？这可能会修复一些应用错误，但不会删除您的数据。',
              [
                { text: '取消', style: 'cancel' },
                {
                  text: '确定',
                  style: 'destructive',
                  onPress: async () =>
                  {
                    try {
                      LoadingModal.show("重置中...");
                      await DatabaseInstance.resetSchema();
                      LoadingModal.hide();
                      showMessage({
                        message: '数据库结构已重置',
                        duration: 1000,
                        type: "success"
                      });
                    } catch (error) {
                      LoadingModal.hide();
                      showMessage({
                        message: '重置失败',
                        duration: 1000,
                        type: "danger"
                      });
                      console.error("Reset schema error:", error);
                    }
                  }
                }
              ]
            );
          }}
          style={styles.navigationButton}
        >
          修复数据库
        </Button>
      </Layout>

      <Layout style={styles.section}>
        <Text category="h6" style={styles.sectionTitle}>云存储</Text>
        <Layout style={styles.settingRow}>
          <Layout style={styles.settingInfo}>
            <Text category="s1">使用Cloudflare R2存储</Text>
            <Text appearance="hint" category="p2">将图片保存到云端而非本地设备</Text>
          </Layout>
          <Toggle
            checked={useR2Storage}
            onChange={toggleR2Storage}
            status="primary"
          />
        </Layout>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setR2ConfigModalVisible(true)}
        >
          <Layout style={styles.navItemInner}>
            <CloudIcon fill="#3366FF" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">Cloudflare R2配置</Text>
              <Text appearance="hint" category="p2">设置R2账户信息和访问凭证</Text>
            </Layout>
            <Icon name="chevron-right-outline" fill="#8F9BB3" width={24} height={24} />
          </Layout>
        </TouchableOpacity>
      </Layout>

      <Divider />

      <Layout style={styles.section}>
        <Text category="h6" style={styles.sectionTitle}>API配置</Text>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setPlantNetApiKeyModalVisible(true)}
        >
          <Layout style={styles.navItemInner}>
            <FlowerIcon fill="#00C781" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">PlantNet API Key</Text>
              <Text appearance="hint" category="p2">设置用于植物识别的API密钥</Text>
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
          <Text appearance="hint" category="p2">版本 1.0.3</Text>
          <Text appearance="hint" category="p2" style={styles.copyright}>© 2023 小花园团队</Text>
        </Layout>
      </Layout>
    </ScrollView>
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

  // Reset action type form
  const resetActionTypeForm = () =>
  {
    setEditingActionType(null);
    setActionTypeName('');
    setIconName('');
    setIconPack(undefined);
    setUseCustomImage(true); // Always use custom image
    setIconImage(undefined);
    setSelectedIconPackIndex(0); // Default UI Kitten
  };

  // Handle showing add/edit action type modal
  const handleShowActionTypeModal = (actionType?: ActionType) =>
  {
    console.log('Opening modal with action type:', actionType);
    if (actionType) {
      // Only allow editing custom image action types
      if (!actionType.useCustomImage) {
        showMessage({
          message: '系统行为类型不能编辑',
          duration: 1000,
          type: "warning"
        });
        return;
      }

      setEditingActionType(actionType);
      setActionTypeName(actionType.name);
      setUseCustomImage(true);
      setIconImage(actionType.iconImage);
    } else {
      resetActionTypeForm();
    }
    setActionTypeModalVisible(true);
  };

  // Handle picking custom image
  const handlePickImage = async () =>
  {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showMessage({
          message: '需要访问相册权限才能选择图片',
          duration: 1000,
          type: "info"
        });
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Save the image to local storage using FileManager
        const imageUri = asset.uri;
        const fileManager = FileManager.getInstance();
        const savedImagePath = await fileManager.saveImage(imageUri);
        setIconImage(savedImagePath);
        setUseCustomImage(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showMessage({
        message: '选择图片时出错',
        duration: 1000,
        type: "warning"
      });
    }
  };

  // Handle adding/editing action type
  const handleSaveActionType = async () =>
  {
    if (!actionTypeName.trim()) {
      showMessage({
        message: '请输入行为类型名称',
        duration: 1000,
        type: "warning"
      });
      return;
    }

    if (!iconImage) {
      showMessage({
        message: '请选择自定义图标',
        duration: 1000,
        type: "warning"
      });
      return;
    }

    try {
      // Create a new action type
      const newActionType: ActionType = {
        name: actionTypeName,
        useCustomImage: true,
        iconImage: iconImage, // This is already the saved path from FileManager
        color: '#000000' // Use black as default color
      };

      let updatedActionTypes: ActionType[];

      if (editingActionType) {
        // Update existing action type
        updatedActionTypes = actionTypes.map(type =>
          type.name === editingActionType.name ? newActionType : type
        );
      } else {
        // Check for duplicates
        if (actionTypes.some(type => type.name === actionTypeName)) {
          showMessage({
            message: `行为类型 "${actionTypeName}" 已存在`,
            duration: 1000,
            type: "info"
          });
          return;
        }
        // Add new action type
        updatedActionTypes = [...actionTypes, newActionType];
      }

      // Save to storage
      await ConfigManager.getInstance().saveActionTypes(updatedActionTypes);

      // Update state
      setActionTypes(updatedActionTypes);

      // Clear cache to reload icon mappings
      clearActionTypesCache();

      // Close modal and reset form
      setActionTypeModalVisible(false);
      resetActionTypeForm();
      showMessage({
        message: `行为类型已${editingActionType ? '更新' : '添加'}`,
        duration: 1000,
        type: "success"
      });
    } catch (error) {
      console.error('Failed to save action type:', error);
      showMessage({
        message: '保存行为类型失败',
        duration: 1000,
        type: "warning"
      });
    }
  };

  // Handle deleting action type
  const handleDeleteActionType = (actionType: ActionType) =>
  {
    // Prevent deletion of system action types
    if (!actionType.useCustomImage) {
      showMessage({
        message: '系统行为类型不能删除',
        duration: 1000,
        type: "warning"
      });
      return;
    }

    Alert.alert(
      '确认删除',
      `确定要删除 "${actionType.name}" 行为类型吗？这可能会影响现有的行为记录。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () =>
          {
            try {
              const updatedActionTypes = actionTypes.filter(type => type.name !== actionType.name);
              await ConfigManager.getInstance().saveActionTypes(updatedActionTypes);

              // Delete the image file if it exists and is a custom image
              if (actionType.useCustomImage && actionType.iconImage) {
                try {
                  const fileManager = FileManager.getInstance();
                  await fileManager.deleteImage(actionType.iconImage);
                } catch (imageError) {
                  console.error('Failed to delete action type image:', imageError);
                  // Continue with deletion even if image deletion fails
                }
              }

              setActionTypes(updatedActionTypes);
              clearActionTypesCache();
            } catch (error) {
              console.error('Failed to delete action type:', error);
              showMessage({
                message: '删除行为类型失败',
                duration: 1000,
                type: "warning"
              });
            }
          }
        }
      ]
    );
  };

  // Render action type item
  const renderActionTypeItem = ({ item }: { item: ActionType }) => (
    <ListItem
      title={item.name}
      accessoryLeft={(props) => (
        <View style={styles.actionTypeIconContainer}>
          {item.useCustomImage && item.iconImage ? (
            <Image
              source={{ uri: item.iconImage }}
              style={styles.actionTypeIcon}
            />
          ) : (
            <Icon
              {...props}
              name={item.iconName || "help-circle-outline"}
              pack={item.pack}
              style={[props?.style, { tintColor: item.color }]}
            />
          )}
        </View>
      )}
      accessoryRight={() =>
      {
        if (item.useCustomImage) {
          return (<View style={styles.categoryItemActions}>
            <TouchableOpacity
              style={styles.categoryActionButton}
              onPress={() => handleShowActionTypeModal(item)}
            >
              <EditIcon fill="#8F9BB3" width={20} height={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.categoryActionButton}
              onPress={() => handleDeleteActionType(item)}
            >
              <TrashIcon fill="#FF3D71" width={20} height={20} />
            </TouchableOpacity>
          </View>)
        }
        return <View></View>
      }}
    />
  );

  // Render action type management modal
  const renderActionTypeModal = () => (
    <Modal
      visible={actionTypeModalVisible}
      backdropStyle={styles.backdrop}
      onBackdropPress={() =>
      {
        setActionTypeModalVisible(false);
        resetActionTypeForm();
      }}
    >
      <Card
        disabled
        style={[
          styles.actionTypeModalCard,
          { backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(43, 50, 65, 0.98)' }
        ]}
      >
        <Text category="h6" style={styles.modalTitle}>
          {editingActionType ? '编辑行为类型' : '添加行为类型'}
        </Text>

        <Input
          placeholder="行为类型名称"
          value={actionTypeName}
          onChangeText={setActionTypeName}
          style={styles.input}
        />

        <View style={styles.customImageContainer}>
          {iconImage ? (
            <Image
              source={{ uri: iconImage }}
              style={styles.customImagePreview}
            />
          ) : (
            <View style={styles.customImagePlaceholder}>
              <Icon name="image-outline" fill="#8F9BB3" width={24} height={24} />
            </View>
          )}
          <Button
            appearance="outline"
            onPress={handlePickImage}
            style={styles.pickImageButton}
          >
            选择自定义图片
          </Button>
        </View>

        <View style={styles.previewContainer}>
          <Text category="s1">预览:</Text>
          <View style={styles.iconPreview}>
            {iconImage ? (
              <Image
                source={{ uri: iconImage }}
                style={styles.customIconPreview}
              />
            ) : (
              <View style={[styles.customIconPreview, { justifyContent: 'center', alignItems: 'center' }]}>
                <Icon name="image-outline" fill="#8F9BB3" width={24} height={24} />
              </View>
            )}
          </View>
        </View>

        <Button onPress={handleSaveActionType} style={styles.saveButton}>
          {editingActionType ? '保存' : '添加'}
        </Button>
      </Card>
    </Modal>
  );

  // Render action types management section
  const renderActionTypesSection = () => (
    <>
      <TopNavigation
        title="管理行为类型"
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
            onPress={() => handleShowActionTypeModal()}
          />
        )}
      />

      <Divider />

      {actionTypesLoading ? (
        <Layout style={styles.loadingContainer}>
          <Text appearance="hint">加载中...</Text>
        </Layout>
      ) : (
        <List
          data={actionTypes}
          renderItem={renderActionTypeItem}
          ItemSeparatorComponent={Divider}
          contentContainerStyle={styles.categoriesList}
          ListEmptyComponent={() => (
            <Layout style={styles.emptyContainer}>
              <Text appearance="hint">没有行为类型，点击右上角添加</Text>
            </Layout>
          )}
        />
      )}
    </>
  );

  // Load R2 configuration when the component mounts
  React.useEffect(() =>
  {
    loadR2Config();
    loadPlantNetApiKey();
  }, []);

  // Load R2 configuration
  const loadR2Config = async () =>
  {
    setR2ConfigLoading(true);
    try {
      const configManager = ConfigManager.getInstance();

      // Load toggle state
      const useR2 = await configManager.getUseR2Storage();
      setUseR2Storage(useR2);

      // Load configuration
      const config = await configManager.getR2Config();
      if (config) {
        setR2Config(config);
      }
    } catch (error) {
      console.error('Failed to load R2 configuration:', error);
      showMessage({
        message: '加载R2配置失败',
        duration: 1000,
        type: "warning"
      });
    } finally {
      setR2ConfigLoading(false);
    }
  };

  // Toggle R2 storage
  const toggleR2Storage = async (checked: boolean) =>
  {
    try {
      // If turning on R2, check if we have valid configuration
      if (checked) {
        const configValid = isR2ConfigValid();
        if (!configValid) {
          Alert.alert(
            'R2配置不完整',
            '请先完成Cloudflare R2的配置后再启用',
            [{ text: '确定', onPress: () => setR2ConfigModalVisible(true) }]
          );
          return;
        }
      }

      await ConfigManager.getInstance().setUseR2Storage(checked);
      setUseR2Storage(checked);

      // Update FileManager config
      await FileManager.getInstance().updateStorageConfig();

      showMessage({
        message: `已${checked ? '启用' : '禁用'}Cloudflare R2存储`,
        duration: 1000,
        type: "success"
      });
    } catch (error) {
      console.error('Failed to toggle R2 storage:', error);
      showMessage({
        message: '更改R2存储设置失败',
        duration: 1000,
        type: "warning"
      });
    }
  };

  // Check if R2 configuration is valid
  const isR2ConfigValid = (): boolean =>
  {
    return !!(
      r2Config.accountId &&
      r2Config.accessKeyId &&
      r2Config.secretAccessKey &&
      r2Config.bucketName
    );
  };

  // Handle saving R2 configuration
  const handleSaveR2Config = async () =>
  {
    if (!r2Config.accountId || !r2Config.accessKeyId ||
      !r2Config.secretAccessKey || !r2Config.bucketName || !r2Config.publicUrl) {
      showMessage({
        message: '请填写所有必填字段',
        duration: 1000,
        type: "warning"
      });
      return;
    }

    try {
      await ConfigManager.getInstance().saveR2Config(r2Config);
      setR2ConfigModalVisible(false);
      showMessage({
        message: 'R2配置已保存',
        duration: 1000,
        type: "success"
      });

      // If R2 storage is enabled, update FileManager config
      if (useR2Storage) {
        await FileManager.getInstance().updateStorageConfig();
      }
    } catch (error) {
      console.error('Failed to save R2 config:', error);
      showMessage({
        message: '保存R2配置失败',
        duration: 1000,
        type: "warning"
      });
    }
  };

  // Render R2 configuration modal
  const renderR2ConfigModal = () => (
    <Modal
      visible={r2ConfigModalVisible}
      backdropStyle={styles.backdrop}
      onBackdropPress={() => setR2ConfigModalVisible(false)}
    >
      <Card
        disabled
        style={[
          styles.r2ConfigModalCard,
          { backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(43, 50, 65, 0.98)' }
        ]}
      >
        <Text category="h6" style={styles.modalTitle}>Cloudflare R2配置</Text>

        <ScrollView style={styles.configScrollView}>
          <Text style={styles.fieldLabel} category="s1">Account ID</Text>
          <Input
            placeholder="Account ID"
            value={r2Config.accountId}
            onChangeText={(text) => setR2Config({ ...r2Config, accountId: text })}
            style={styles.input}
          />

          <Text style={styles.fieldLabel} category="s1">Access Key ID</Text>
          <Input
            placeholder="Access Key ID"
            value={r2Config.accessKeyId}
            onChangeText={(text) => setR2Config({ ...r2Config, accessKeyId: text })}
            style={styles.input}
          />

          <Text style={styles.fieldLabel} category="s1">Secret Access Key</Text>
          <Input
            placeholder="Secret Access Key"
            value={r2Config.secretAccessKey}
            onChangeText={(text) => setR2Config({ ...r2Config, secretAccessKey: text })}
            style={styles.input}
            secureTextEntry={true}
          />

          <Text style={styles.fieldLabel} category="s1">Bucket Name</Text>
          <Input
            placeholder="Bucket Name"
            value={r2Config.bucketName}
            onChangeText={(text) => setR2Config({ ...r2Config, bucketName: text })}
            style={styles.input}
          />

          <Text style={styles.fieldLabel} category="s1">Public URL</Text>
          <Input
            placeholder="例如: https://your-domain.com"
            value={r2Config.publicUrl}
            onChangeText={(text) => setR2Config({ ...r2Config, publicUrl: text })}
            style={styles.input}
          />

          <Text appearance="hint" category="c1" style={styles.configHint}>
            这些信息可以在Cloudflare控制台的R2部分找到。您需要创建一个API令牌才能使用此功能。
          </Text>
        </ScrollView>

        <Button onPress={handleSaveR2Config} style={styles.saveButton}>
          保存配置
        </Button>
      </Card>
    </Modal>
  );

  // Handle saving PlantNet API key
  const handleSavePlantNetApiKey = async () =>
  {
    if (!plantNetApiKey.trim()) {
      showMessage({
        message: '请输入PlantNet API Key',
        duration: 1000,
        type: "info"
      });
      return;
    }

    try {
      await ConfigManager.getInstance().setPlantNetApiKey(plantNetApiKey);
      setPlantNetApiKeyModalVisible(false);
      showMessage({
        message: 'PlantNet API Key已保存',
        duration: 1000,
        type: "success"
      });
    } catch (error) {
      console.error('Failed to save PlantNet API key:', error);
      showMessage({
        message: '保存PlantNet API Key失败',
        duration: 1000,
        type: "warning"
      });
    }
  };

  // Render PlantNet API key configuration modal
  const renderPlantNetApiKeyModal = () => (
    <Modal
      visible={plantNetApiKeyModalVisible}
      backdropStyle={styles.backdrop}
      onBackdropPress={() => setPlantNetApiKeyModalVisible(false)}
    >
      <Card
        disabled
        style={[
          styles.modalCard,
          { backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(43, 50, 65, 0.98)' }
        ]}
      >
        <Text category="h6" style={styles.modalTitle}>PlantNet API Key</Text>

        <Text style={styles.fieldLabel} category="s1">API Key</Text>
        <Input
          placeholder="请输入API Key"
          value={plantNetApiKey}
          onChangeText={setPlantNetApiKey}
          style={styles.input}
          secureTextEntry={false}
        />

        <Text appearance="hint" category="c1" style={styles.configHint}>
          可在PlantNet官网申请API Key，该功能用于植物识别功能
        </Text>

        <Button onPress={handleSavePlantNetApiKey} style={styles.saveButton}>
          保存
        </Button>
      </Card>
    </Modal>
  );

  // Determine background colors based on theme
  const gradientColors = themeMode === 'light'
    ? ['#F5F5F5', '#F3E5F5', '#F5F5F5'] as const
    : ['#222B45', '#1A2138', '#222B45'] as const;

  // 清理缓存的方法
  const handleClearCache = async () => {
    try {
      setClearCacheLoading(true);
      LoadingModal.show("正在清理缓存...");
      
      // 清理R2缓存
      const r2Manager = CloudflareR2Manager.getInstance();
      await r2Manager.clearCache();
      
      LoadingModal.hide();
      showMessage({
        message: "缓存清理成功",
        description: "已清理所有图片缓存",
        type: "success",
      });
    } catch (error) {
      console.error("清理缓存失败:", error);
      LoadingModal.hide();
      showMessage({
        message: "清理缓存失败",
        description: "请稍后重试",
        type: "danger",
      });
    } finally {
      setClearCacheLoading(false);
    }
  };

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
      ) : activeSection === 'cemetery' ? (
        <Layout style={styles.sectionContainer}>
          {renderCemeterySection()}
        </Layout>
      ) : (
        <Layout style={styles.sectionContainer}>
          {renderActionTypesSection()}
        </Layout>
      )}

      {renderCategoryModal()}
      {renderResurrectModal()}
      {renderActionTypeModal()}
      {renderR2ConfigModal()}
      {renderPlantNetApiKeyModal()}
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
  actionTypeIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  actionTypeIcon: {
    width: 24,
    height: 24
  },
  actionTypeModalCard: {
    width: Dimensions.get('window').width * 0.85,
    maxWidth: 400,
    borderRadius: 16,
    padding: 4,
    maxHeight: 500,
  },
  customImageContainer: {
    marginBottom: 16,
  },
  customImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  customImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  selectLabel: {
    marginBottom: 8,
  },
  select: {
    marginBottom: 16,
  },
  previewContainer: {
    marginBottom: 16,
  },
  iconPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  customIconPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    marginRight: 8,
  },
  saveButton: {
    marginTop: 16,
  },
  pickImageButton: {
    marginTop: 8,
  },
  r2ConfigModalCard: {
    width: Dimensions.get('window').width * 0.85,
    maxWidth: 400,
    borderRadius: 16,
    padding: 4,
    maxHeight: 500,
  },
  fieldLabel: {
    marginBottom: 8,
    marginTop: 12,
  },
  configHint: {
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  configScrollView: {
    maxHeight: 380,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  navigationButton: {
    paddingVertical: 12,
  },
});

export default SettingsPage;