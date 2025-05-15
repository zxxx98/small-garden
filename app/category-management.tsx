import * as React from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Layout, Text, Button, Input, List, ListItem, Icon, IconProps, Modal, Card } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/themeContext';
import { useCategories, Category } from '../context/CategoryContext';
import { showMessage } from "react-native-flash-message";
import PageHeader from '../components/PageHeader';
import GradientBackground from '@/components/GradientBackground';

const CategoryManagementPage = () => {
  const router = useRouter();
  const { themeMode } = useTheme();
  const { categories, addCategory, updateCategory, deleteCategory, loading } = useCategories();

  // 状态管理
  const [categoryModalVisible, setCategoryModalVisible] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [categoryName, setCategoryName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // 重置表单
  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryName('');
  };

  // 处理保存类别
  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      showMessage({
        message: '请输入类别名称',
        duration: 1000,
        type: "warning"
      });
      return;
    }

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理删除类别
  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      '确认删除',
      `确定要删除 "${category.name}" 类别吗？这可能会影响已经分配到该类别的植物。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
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

  // 渲染类别项
  const renderCategoryItem = ({ item }: { item: Category }) => (
    <ListItem
      title={item.name}
      style={{ backgroundColor: 'transparent' }}
      accessoryLeft={(props) => <Icon {...props} name="folder-outline" />}
      accessoryRight={() => (
        <View style={styles.categoryItemActions}>
          <Button
            appearance="ghost"
            status="basic"
            accessoryLeft={(props) => <Icon {...props} name="edit-outline" />}
            onPress={() => {
              setEditingCategory(item);
              setCategoryName(item.name);
              setCategoryModalVisible(true);
            }}
          />
          <Button
            appearance="ghost"
            status="danger"
            accessoryLeft={(props) => <Icon {...props} name="trash-2-outline" />}
            onPress={() => handleDeleteCategory(item)}
          />
        </View>
      )}
    />
  );

  return (
    <GradientBackground
      colors={themeMode === 'light'
        ? ['#F5F5F5', '#F3E5F5', '#F5F5F5']
        : ['#222B45', '#1A2138', '#222B45']}
      style={styles.container}
    >
      <PageHeader
        title="植物类别管理"
        onBack={() => router.back()}
        onRightClick={() => {
          setEditingCategory(null);
          setCategoryName('');
          setCategoryModalVisible(true);
        }}
        isSubmitting={isSubmitting}
        themeMode={themeMode}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text appearance="hint">加载中...</Text>
        </View>
      ) : (
        <List
          data={categories}
          renderItem={renderCategoryItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text appearance="hint">没有植物类别，点击右上角添加</Text>
            </View>
          )}
        />
      )}

      {/* 添加/编辑类别模态框 */}
      <Modal
        visible={categoryModalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => {
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
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  categoryItemActions: {
    flexDirection: 'row'
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    width: '85%',
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
});

export default CategoryManagementPage; 