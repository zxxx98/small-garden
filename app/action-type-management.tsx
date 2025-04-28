import * as React from 'react';
import { StyleSheet, View, ScrollView, Alert, Image } from 'react-native';
import { Layout, Text, Button, Input, List, ListItem, Icon, IconProps, Modal, Card } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/themeContext';
import { ActionType } from '../types/action';
import { ConfigManager } from '../models/ConfigManager';
import { showMessage } from "react-native-flash-message";
import * as ImagePicker from 'expo-image-picker';
import { FileManager } from '../models/FileManager';
import { clearActionTypesCache } from '../utils/action';
import PageHeader from '../components/PageHeader';
import GradientBackground from '@/components/GradientBackground';

const ActionTypeManagementPage = () => {
  const router = useRouter();
  const { themeMode } = useTheme();

  // 状态管理
  const [actionTypes, setActionTypes] = React.useState<ActionType[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [actionTypeModalVisible, setActionTypeModalVisible] = React.useState(false);
  const [editingActionType, setEditingActionType] = React.useState<ActionType | null>(null);
  const [actionTypeName, setActionTypeName] = React.useState('');
  const [iconImage, setIconImage] = React.useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // 加载行为类型
  const loadActionTypes = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  React.useEffect(() => {
    loadActionTypes();
  }, []);

  // 重置表单
  const resetActionTypeForm = () => {
    setEditingActionType(null);
    setActionTypeName('');
    setIconImage(undefined);
  };

  // 处理选择图片
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showMessage({
          message: '需要访问相册权限才能选择图片',
          duration: 1000,
          type: "info"
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileManager = FileManager.getInstance();
        const savedImagePath = await fileManager.saveImage(asset.uri);
        setIconImage(savedImagePath);
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

  // 处理保存行为类型
  const handleSaveActionType = async () => {
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

    setIsSubmitting(true);
    try {
      const newActionType: ActionType = {
        name: actionTypeName,
        useCustomImage: true,
        iconImage: iconImage,
        color: '#000000'
      };

      let updatedActionTypes: ActionType[];

      if (editingActionType) {
        updatedActionTypes = actionTypes.map(type =>
          type.name === editingActionType.name ? newActionType : type
        );
      } else {
        if (actionTypes.some(type => type.name === actionTypeName)) {
          showMessage({
            message: `行为类型 "${actionTypeName}" 已存在`,
            duration: 1000,
            type: "info"
          });
          return;
        }
        updatedActionTypes = [...actionTypes, newActionType];
      }

      await ConfigManager.getInstance().saveActionTypes(updatedActionTypes);
      setActionTypes(updatedActionTypes);
      clearActionTypesCache();
      setActionTypeModalVisible(false);
      resetActionTypeForm();
    } catch (error) {
      console.error('Failed to save action type:', error);
      showMessage({
        message: '保存行为类型失败',
        duration: 1000,
        type: "warning"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理删除行为类型
  const handleDeleteActionType = (actionType: ActionType) => {
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
          onPress: async () => {
            try {
              const updatedActionTypes = actionTypes.filter(type => type.name !== actionType.name);
              await ConfigManager.getInstance().saveActionTypes(updatedActionTypes);

              if (actionType.useCustomImage && actionType.iconImage) {
                try {
                  const fileManager = FileManager.getInstance();
                  await fileManager.deleteImage(actionType.iconImage);
                } catch (imageError) {
                  console.error('Failed to delete action type image:', imageError);
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

  // 渲染行为类型项
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
      accessoryRight={() => {
        if (item.useCustomImage) {
          return (
            <View style={styles.actionTypeItemActions}>
              <Button
                appearance="ghost"
                status="basic"
                accessoryLeft={(props) => <Icon {...props} name="edit-outline" />}
                onPress={() => {
                  setEditingActionType(item);
                  setActionTypeName(item.name);
                  setIconImage(item.iconImage);
                  setActionTypeModalVisible(true);
                }}
              />
              <Button
                appearance="ghost"
                status="danger"
                accessoryLeft={(props) => <Icon {...props} name="trash-2-outline" />}
                onPress={() => handleDeleteActionType(item)}
              />
            </View>
          );
        }
        return <View />;
      }}
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
        title="行为类型管理"
        onBack={() => router.back()}
        onSave={() => {
          setEditingActionType(null);
          setActionTypeName('');
          setIconImage(undefined);
          setActionTypeModalVisible(true);
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
          data={actionTypes}
          renderItem={renderActionTypeItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text appearance="hint">没有行为类型，点击右上角添加</Text>
            </View>
          )}
        />
      )}

      {/* 添加/编辑行为类型模态框 */}
      <Modal
        visible={actionTypeModalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => {
          setActionTypeModalVisible(false);
          resetActionTypeForm();
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

          <Button onPress={handleSaveActionType}>
            {editingActionType ? '保存' : '添加'}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  actionTypeItemActions: {
    flexDirection: 'row',
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
  pickImageButton: {
    marginTop: 8,
  },
});

export default ActionTypeManagementPage; 