import * as React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, View, Dimensions } from 'react-native';
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

// Icons
const SunIcon = (props: IconProps) => <Icon {...props} name="sun-outline" />;
const MoonIcon = (props: IconProps) => <Icon {...props} name="moon-outline" />;
const EditIcon = (props: IconProps) => <Icon {...props} name="edit-outline" />;
const TrashIcon = (props: IconProps) => <Icon {...props} name="trash-2-outline" />;
const PlusIcon = (props: IconProps) => <Icon {...props} name="plus-outline" />;
const CategoryIcon = (props: IconProps) => <Icon {...props} name="folder-outline" />;
const BackIcon = (props: IconProps) => <Icon {...props} name="arrow-back-outline" />;

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
  const [activeSection, setActiveSection] = React.useState<'main' | 'categories'>('main');

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
      <Card disabled style={styles.modalCard}>
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

  // Determine background colors based on theme
  const gradientColors = themeMode === 'light'
    ? ['#F5F5F5', '#F3E5F5', '#F5F5F5']
    : ['#222B45', '#1A2138', '#222B45'];

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
      ) : (
        <Layout style={styles.sectionContainer}>
          {renderCategoriesSection()}
        </Layout>
      )}

      {renderCategoryModal()}
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
});

export default SettingsPage;