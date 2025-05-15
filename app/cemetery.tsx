import * as React from 'react';
import { StyleSheet, View, Alert, Image } from 'react-native';
import { Text, Button, List, ListItem, Icon, Modal, Card } from '@ui-kitten/components';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/themeContext';
import { Plant } from '../types/plant';
import { showMessage } from "react-native-flash-message";
import PageHeader from '../components/PageHeader';
import GradientBackground from '@/components/GradientBackground';
import { rootStore } from '@/stores/RootStore';
import { IPlantModel } from '@/stores/PlantStore';

const CemeteryPage = () => {
  const router = useRouter();
  const { themeMode } = useTheme();

  // 状态管理
  const [deadPlants, setDeadPlants] = React.useState<Plant[]>([]);
  const [showResurrectModal, setShowResurrectModal] = React.useState(false);
  const [selectedDeadPlant, setSelectedDeadPlant] = React.useState<Plant | null>(null);

  // 处理复活植物
  const handleResurrectPlant = async () => {
    if (!selectedDeadPlant) return;

    try {
      // 更新植物状态
      const updatedPlant: Plant = {
        ...selectedDeadPlant,
        isDead: false
      };

      // 更新数据库
      await rootStore.plantStore.updatePlant(updatedPlant as IPlantModel);

      // 更新本地状态
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

  // 处理永久删除植物
  const handlePermanentlyDeletePlant = (plant: Plant) => {
    Alert.alert(
      '确认永久删除',
      `确定要永久删除植物 "${plant.name}" 吗？此操作无法撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '永久删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await rootStore.plantStore.deletePlants([plant.id]);
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

  // 渲染死亡植物项
  const renderDeadPlantItem = ({ item }: { item: Plant }) => (
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
        <View style={styles.deadPlantActions}>
          <Button
            appearance="ghost"
            status="primary"
            accessoryLeft={(props) => <Icon {...props} name="activity-outline" />}
            onPress={() => {
              setSelectedDeadPlant(item);
              setShowResurrectModal(true);
            }}
          />
          <Button
            appearance="ghost"
            status="danger"
            accessoryLeft={(props) => <Icon {...props} name="trash-2-outline" />}
            onPress={() => handlePermanentlyDeletePlant(item)}
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
        title="植物墓地"
        onBack={() => router.back()}
        onRightClick={() => {}}
        themeMode={themeMode}
      />

(
        <List
          data={deadPlants}
          renderItem={renderDeadPlantItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="heart-outline" fill="#8F9BB3" width={60} height={60} />
              <Text category="h6" style={styles.emptyTitle}>墓地是空的</Text>
              <Text appearance="hint" style={styles.emptyText}>
                您所有的植物都健康存活 🌱
              </Text>
            </View>
          )}
        />
      )

      {/* 复活植物确认模态框 */}
      <Modal
        visible={showResurrectModal}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => {
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
          <View style={styles.modalActions}>
            <Button
              appearance="outline"
              status="basic"
              onPress={() => {
                setShowResurrectModal(false);
                setSelectedDeadPlant(null);
              }}
            >
              取消
            </Button>
            <Button
              status="primary"
              onPress={handleResurrectPlant}
            >
              复活
            </Button>
          </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
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
  },
  deadPlantActions: {
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
  resurrectText: {
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default CemeteryPage; 