import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Timeline from '../../../components/Timeline';
import PageHeader from '../../../components/PageHeader';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../../stores/RootStore';
import { IPlantModel } from '../../../stores/PlantStore';
import { Icon, Input } from '@ui-kitten/components';
import SlideUpModal from '../../../components/SlideUpModal';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getSnapshot, types } from 'mobx-state-tree';
import { ActionType } from '@/types/action';
import { getActionIcon } from '@/utils/action';

const tabs = [
  { id: 'timeline', label: '时间线' },
  { id: 'actions', label: '行为' },
  { id: 'notes', label: '备注' },
];

const PlantDetail = observer(() => {
  const [activeTab, setActiveTab] = React.useState('timeline');
  const [isNoteModalVisible, setIsNoteModalVisible] = React.useState(false);
  const [note, setNote] = React.useState('');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const plant = rootStore.plantStore.plants.find(p => p.id === id);

  if (!plant) {
    return (
      <View style={styles.centeredBox}>
        <Text style={styles.emptyText}>植物不存在</Text>
      </View>
    );
  }

  // 渲染时间线内容
  const renderTimeline = () => {
    const timelineData = plant.actions.map(action => ({
      time: action.time,
      name: action.name,
      description: action.remark
    }));

    return (
      <View style={{ flex: 1 }}>
        <Timeline
          data={timelineData}
          renderTime={(item) => (
            <Text style={styles.timelineTime}>{format(new Date(item.time), 'MM月dd日', { locale: zhCN })}</Text>
          )}
          renderContent={(item) => (
            <View style={styles.timelineContentBox}>
              <Text style={styles.timelineTitle}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.timelineDesc}>{item.description}</Text>
              ) : null}
            </View>
          )}
        />
      </View>
    );
  };

  // 渲染行为列表
  const renderActions = () => {
    const availableActions = rootStore.settingStore.actionTypes;

    return (
      <ScrollView style={styles.actionScroll}>
        {availableActions.map((action:ActionType) => {
          const checked = plant.todos.some(todo => todo.actionName === action.name);
          return (
            <View key={action.name} style={styles.actionRow}>
              <View style={styles.actionLeft}>
                {getActionIcon(action.name)}
                <Text style={styles.actionName}>{action.name}</Text>
              </View>
              <TouchableOpacity
                style={[styles.switchBox, checked ? styles.switchBoxActive : styles.switchBoxInactive]}
                onPress={() => {
                  const hasTodo = plant.todos.some(todo => todo.actionName === action.name);
                  if (hasTodo) {
                    const newTodos = plant.todos.filter(todo => todo.actionName !== action.name);
                    plant.todos.replace(newTodos);
                    rootStore.plantStore.updatePlant(plant);
                  } else {
                    const newTodo = {
                      plantId: plant.id,
                      isRecurring: false,
                      actionName: action.name,
                      recurringUnit: 'day',
                      recurringInterval: 1,
                      nextRemindTime: Date.now(),
                      remark: ''
                    };
                    plant.todos.push(newTodo);
                    rootStore.plantStore.updatePlant(plant);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.switchDot, checked ? styles.switchDotActive : styles.switchDotInactive]} />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // 渲染备注信息
  const renderNotes = () => {
    return (
      <View style={styles.notesBox}>
        <View style={styles.notesContentBox}>
          <Text style={styles.notesText}>{plant.description || '暂无备注信息'}</Text>
        </View>
        <TouchableOpacity
          style={styles.addNoteBtn}
          onPress={() => setIsNoteModalVisible(true)}
        >
          <Text style={styles.addNoteBtnText}>添加备注</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title={plant.name}
        onBack={() => router.back()}
        onSave={() => {}}
      />

      {/* 植物基本信息 */}
      <View style={styles.headerRow}>
        <View style={styles.avatarBox}>
          <Image
            source={{ uri: plant.img || 'https://placeholder.com/150' }}
            style={styles.avatar}
          />
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.plantName}>{plant.name}</Text>
          <View style={styles.typeRow}>
            <Text style={styles.typeText}>{plant.type}</Text>
            <Text style={styles.areaText}>
              {rootStore.settingStore.areas.find(area => area.id === plant.areaId)?.name ?? "默认"}
            </Text>
          </View>
        </View>
      </View>

      {/* 标签页 */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 标签页内容 */}
      <View style={styles.tabContent}>
        {activeTab === 'timeline' && renderTimeline()}
        {activeTab === 'actions' && renderActions()}
        {activeTab === 'notes' && renderNotes()}
      </View>

      {/* 添加备注的弹窗 */}
      <SlideUpModal
        visible={isNoteModalVisible}
        onClose={() => setIsNoteModalVisible(false)}
        themeMode="light"
        headerComponent={
          <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>添加备注</Text>
          </View>
        }
      >
        <View style={{ paddingHorizontal: 20 }}>
          <Input
            multiline
            textStyle={{ minHeight: 100 }}
            placeholder="请输入备注信息..."
            value={note}
            onChangeText={setNote}
          />
          <TouchableOpacity
            style={styles.saveNoteBtn}
            onPress={() => {
              plant.description = note;
              rootStore.plantStore.updatePlant(plant);
              setIsNoteModalVisible(false);
              setNote('');
            }}
          >
            <Text style={styles.saveNoteBtnText}>保存</Text>
          </TouchableOpacity>
        </View>
      </SlideUpModal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  centeredBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f7f7',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  avatarBox: {
    width: 80,
    height: 80,
    backgroundColor: '#e6f4ea',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  infoBox: {
    marginLeft: 16,
    flex: 1,
  },
  plantName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  typeText: {
    color: '#666',
    fontSize: 15,
  },
  areaText: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#e6f4ea',
    color: '#34a853',
    borderRadius: 8,
    fontSize: 13,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#34a853',
  },
  tabText: {
    color: '#888',
    fontSize: 16,
  },
  tabTextActive: {
    color: '#34a853',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  timelineTime: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
  timelineContentBox: {
    backgroundColor: '#f1f8f5',
    padding: 12,
    borderRadius: 8,
  },
  timelineTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },
  timelineDesc: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  actionScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 24,
    height: 24,
  },
  actionName: {
    marginLeft: 12,
    fontSize: 16,
    color: '#222',
  },
  switchBox: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    padding: 3,
  },
  switchBoxActive: {
    backgroundColor: '#34a853',
    alignItems: 'flex-end',
  },
  switchBoxInactive: {
    backgroundColor: '#ddd',
    alignItems: 'flex-start',
  },
  switchDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  switchDotActive: {
    shadowColor: '#34a853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  switchDotInactive: {
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notesBox: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  notesContentBox: {
    backgroundColor: '#f1f8f5',
    borderRadius: 10,
    padding: 18,
    marginBottom: 18,
  },
  notesText: {
    color: '#666',
    fontSize: 15,
  },
  addNoteBtn: {
    backgroundColor: '#34a853',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addNoteBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveNoteBtn: {
    backgroundColor: '#34a853',
    borderRadius: 24,
    paddingVertical: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  saveNoteBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PlantDetail; 