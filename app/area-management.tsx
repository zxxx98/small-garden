import * as React from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Layout, Text, Button, Input, List, ListItem, Icon, IconProps, Modal, Card } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/themeContext';
import { useAreas } from '../context/AreaContext';
import { Area } from '../types/config';
import { showMessage } from "react-native-flash-message";
import PageHeader from '../components/PageHeader';
import GradientBackground from '@/components/GradientBackground';

const AreaManagementPage = () => {
  const router = useRouter();
  const { themeMode } = useTheme();
  const { areas, addArea, updateArea, deleteArea, loading } = useAreas();

  // 状态管理
  const [areaModalVisible, setAreaModalVisible] = React.useState(false);
  const [editingArea, setEditingArea] = React.useState<Area | null>(null);
  const [areaName, setAreaName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // 重置表单
  const resetAreaForm = () => {
    setEditingArea(null);
    setAreaName('');
  };

  // 处理保存区域
  const handleSaveArea = async () => {
    if (!areaName.trim()) {
      showMessage({
        message: '请输入区域名称',
        duration: 1000,
        type: "warning"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingArea) {
        await updateArea(editingArea.id, areaName);
      } else {
        await addArea(areaName);
      }
      setAreaModalVisible(false);
      resetAreaForm();
    } catch (error) {
      showMessage({
        message: '保存区域失败',
        duration: 1000,
        type: "warning"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理删除区域
  const handleDeleteArea = (area: Area) => {
    Alert.alert(
      '确认删除',
      `确定要删除 "${area.name}" 区域吗？这可能会影响已经分配到该区域的植物。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteArea(area.id);
            } catch (error) {
              showMessage({
                message: '删除区域失败',
                duration: 1000,
                type: "warning"
              });
            }
          }
        }
      ]
    );
  };

  // 渲染区域项
  const renderAreaItem = ({ item }: { item: Area }) => (
    <ListItem
      title={item.name}
      accessoryLeft={(props) => <Icon {...props} name="home-outline" />}
      accessoryRight={() => (
        <View style={styles.areaItemActions}>
          <Button
            appearance="ghost"
            status="basic"
            accessoryLeft={(props) => <Icon {...props} name="edit-outline" />}
            onPress={() => {
              setEditingArea(item);
              setAreaName(item.name);
              setAreaModalVisible(true);
            }}
          />
          <Button
            appearance="ghost"
            status="danger"
            accessoryLeft={(props) => <Icon {...props} name="trash-2-outline" />}
            onPress={() => handleDeleteArea(item)}
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
        title="植物区域管理"
        onBack={() => router.back()}
        onRightClick={() => {
          setEditingArea(null);
          setAreaName('');
          setAreaModalVisible(true);
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
          data={areas}
          renderItem={renderAreaItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text appearance="hint">没有植物区域，点击右上角添加</Text>
            </View>
          )}
        />
      )}

      {/* 添加/编辑区域模态框 */}
      <Modal
        visible={areaModalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => {
          setAreaModalVisible(false);
          resetAreaForm();
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
            {editingArea ? '编辑区域' : '添加区域'}
          </Text>
          <Input
            placeholder="区域名称"
            value={areaName}
            onChangeText={setAreaName}
            style={styles.input}
          />
          <Button onPress={handleSaveArea}>
            {editingArea ? '保存' : '添加'}
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
  areaItemActions: {
    flexDirection: 'row',
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

export default AreaManagementPage; 