import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions, FlatList } from 'react-native';
import Timeline from '../../../components/Timeline';
import PageHeader from '../../../components/PageHeader';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../../stores/RootStore';
import { IPlantModel, ITodoModel } from '../../../stores/PlantStore';
import { Icon, Input, CheckBox, Select, SelectItem } from '@ui-kitten/components';
import SlideUpModal from '../../../components/SlideUpModal';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getSnapshot, types } from 'mobx-state-tree';
import { ActionType } from '@/types/action';
import { getActionIcon } from '@/utils/action';
import { calculateNextRemindTime } from '@/utils/plant';
import { useAddAction } from '@/context/AddActionContext';
import ImageViewer from '@/components/ImageViewer';

const tabs = [
  { id: 'timeline', label: '时间线' },
  { id: 'actions', label: '行为' },
  { id: 'notes', label: '备注' },
];

const recurringUnits = [
  { text: '天', value: 'day' },
  { text: '周', value: 'week' },
  { text: '月', value: 'month' },
];

const PlantDetail = observer(() => {
  const [activeTab, setActiveTab] = React.useState('timeline');
  const [isNoteModalVisible, setIsNoteModalVisible] = React.useState(false);
  const [note, setNote] = React.useState('');
  
  // Image viewer states
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [selectedImages, setSelectedImages] = React.useState<string[]>([]);
  const [showImageViewer, setShowImageViewer] = React.useState(false);

  // Todo Modal states
  const [isTodoModalVisible, setIsTodoModalVisible] = React.useState(false);
  const [currentAction, setCurrentAction] = React.useState<string>('');
  const [todoData, setTodoData] = React.useState({
    isRecurring: false,
    recurringUnit: 'day',
    recurringInterval: '1',
    remark: ''
  });

  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const plant = rootStore.plantStore.plants.find(p => p.id === id);
  const { open: openAddAction } = useAddAction();

  if (!plant) {
    return (
      <View style={styles.centeredBox}>
        <Text style={styles.emptyText}>植物不存在</Text>
      </View>
    );
  }

  // 打开编辑Todo的弹窗
  const openTodoModal = (actionName: string) => {
    const existingTodo = plant.todos.find(todo => todo.actionName === actionName);

    if (existingTodo) {
      setTodoData({
        isRecurring: existingTodo.isRecurring,
        recurringUnit: existingTodo.recurringUnit,
        recurringInterval: existingTodo.recurringInterval.toString(),
        remark: existingTodo.remark
      });
    } else {
      setTodoData({
        isRecurring: false,
        recurringUnit: 'day',
        recurringInterval: '1',
        remark: ''
      });
    }

    setCurrentAction(actionName);
    setIsTodoModalVisible(true);
  };

  // 保存Todo
  const saveTodo = () => {
    const interval = parseInt(todoData.recurringInterval) || 1;
    const nextRemindTime = calculateNextRemindTime(todoData.recurringUnit, interval);

    const existingTodo = plant.todos.find(todo => todo.actionName === currentAction);

    if (existingTodo) {
      // 更新现有的todo
      existingTodo.isRecurring = todoData.isRecurring;
      existingTodo.recurringUnit = todoData.recurringUnit;
      existingTodo.recurringInterval = interval;
      existingTodo.nextRemindTime = nextRemindTime;
      existingTodo.remark = todoData.remark;
      plant.updateTodo(existingTodo as ITodoModel);
    } else {
      // 创建新的todo
      const newTodo = {
        plantId: plant.id,
        isRecurring: todoData.isRecurring,
        actionName: currentAction,
        recurringUnit: todoData.recurringUnit,
        recurringInterval: interval,
        nextRemindTime: nextRemindTime,
        remark: todoData.remark
      };
      plant.addTodo(newTodo as ITodoModel);
    }
    setIsTodoModalVisible(false);
  };

  // 删除Todo
  const deleteTodo = () => {
    const newTodos = plant.todos.find(todo => todo.actionName !== currentAction);
    plant.deleteTodo(newTodos as ITodoModel);
    setIsTodoModalVisible(false);
  };

  // Render a custom image viewer for gallery navigation
  const renderImageViewer = () => {
    if (!showImageViewer || selectedImages.length === 0) return null;
    
    const currentImage = selectedImages[selectedImageIndex];
    
    return (
      <View style={styles.imageViewerContainer}>
        <ImageViewer
          visible={showImageViewer}
          imageUri={currentImage}
          onClose={() => setShowImageViewer(false)}
        />
        
        {selectedImages.length > 1 && (
          <View style={styles.imageNavigationContainer}>
            <TouchableOpacity 
              style={[
                styles.imageNavigationButton,
                selectedImageIndex === 0 && styles.imageNavigationButtonDisabled
              ]}
              disabled={selectedImageIndex === 0}
              onPress={() => setSelectedImageIndex(prev => Math.max(0, prev - 1))}
            >
              <Icon name="arrow-back" style={styles.imageNavigationIcon} fill="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.imageCounterText}>
              {selectedImageIndex + 1} / {selectedImages.length}
            </Text>
            
            <TouchableOpacity 
              style={[
                styles.imageNavigationButton,
                selectedImageIndex === selectedImages.length - 1 && styles.imageNavigationButtonDisabled
              ]}
              disabled={selectedImageIndex === selectedImages.length - 1}
              onPress={() => setSelectedImageIndex(prev => Math.min(selectedImages.length - 1, prev + 1))}
            >
              <Icon name="arrow-forward" style={styles.imageNavigationIcon} fill="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // 渲染时间线内容
  const renderTimeline = () => {
    // Get all actions for this plant with complete data
    const timelineData = plant.actions.map(action => ({
      id: action.id,
      time: action.time,
      name: action.name,
      description: action.remark,
      images: action.imgs || []
    }));

    // Sort actions by time in descending order (newest first)
    const sortedTimelineData = [...timelineData].sort((a, b) => b.time - a.time);

    // Add proper type for the ref
    const timelineRef = React.useRef<ScrollView>(null);
    
    // Scroll to the top of the timeline after render
    React.useEffect(() => {
      if (timelineRef.current && sortedTimelineData.length > 0) {
        // Even though there's a TypeScript error in the IDE, this should work at runtime
        // @ts-ignore - ScrollView.scrollTo is available at runtime
        timelineRef.current.scrollTo({ y: 0, animated: true });
      }
    }, [sortedTimelineData.length]);

    // If no actions exist, show empty state
    if (sortedTimelineData.length === 0) {
      return (
        <View style={styles.emptyTimelineContainer}>
          <Icon name="calendar-outline" style={styles.emptyTimelineIcon} fill="#34a853" />
          <Text style={styles.emptyTimelineTitle}>暂无行为记录</Text>
          <Text style={styles.emptyTimelineText}>
            记录你对植物的关爱，让时间见证植物的成长历程
          </Text>
          <TouchableOpacity 
            style={styles.addActionButton}
            onPress={() => {
              // Open add action modal
              openAddAction();
            }}
          >
            <Text style={styles.addActionButtonText}>添加行为记录</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <Timeline
          scrollViewRef={timelineRef}
          data={sortedTimelineData}
          renderTime={(item) => (
            <View style={styles.timelineTimeContainer}>
              <Text style={styles.timelineDate}>{format(new Date(item.time), 'MM月dd日', { locale: zhCN })}</Text>
              <Text style={styles.timelineTime}>{format(new Date(item.time), 'HH:mm', { locale: zhCN })}</Text>
            </View>
          )}
          renderContent={(item) => (
            <View style={styles.timelineContentBox}>
              <View style={styles.timelineHeaderRow}>
                <View style={styles.timelineIconBadge}>
                  {getActionIcon(item.name, 16, '#fff')}
                </View>
                <Text style={styles.timelineTitle}>{item.name}</Text>
              </View>
              
              {item.description ? (
                <Text style={styles.timelineDesc}>{item.description}</Text>
              ) : null}
              
              {item.images && item.images.length > 0 && (
                <View style={styles.timelineImagesContainer}>
                  <FlatList
                    style={{ width: '100%' }}
                    contentContainerStyle={{ paddingVertical: 4 }}
                    data={item.images}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item: image, index }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedImages(item.images);
                          setSelectedImageIndex(index);
                          setShowImageViewer(true);
                        }}
                      >
                        <Image
                          source={{ uri: image }}
                          style={styles.timelineImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    )}
                    keyExtractor={(_, index) => `${item.id}-image-${index}`}
                    ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
                  />
                </View>
              )}

              <Text style={styles.timelineFooterTime}>
                完成于 {format(new Date(item.time), 'HH:mm', { locale: zhCN })}
              </Text>
            </View>
          )}
          renderIcon={(item) => (
            <View style={styles.timelineIconContainer}>
              {getActionIcon(item.name, 24, '#34a853')}
            </View>
          )}
          lineColor="#34a85340"
        />
      </View>
    );
  };

  // 渲染行为列表
  const renderActions = () => {
    const availableActions = rootStore.settingStore.actionTypes;

    return (
      <ScrollView style={styles.actionScroll}>
        {availableActions.map((action: ActionType) => {
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
                    // 已有Todo，直接打开编辑弹窗
                    openTodoModal(action.name);
                  } else {
                    // 没有Todo，打开新建弹窗
                    openTodoModal(action.name);
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

  // 格式化显示提醒时间
  const formatNextRemindTime = (unit: string, interval: number) => {
    const nextTime = calculateNextRemindTime(unit, interval);
    return format(new Date(nextTime), 'yyyy年MM月dd日', { locale: zhCN });
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title={plant.name}
        onBack={() => router.back()}
        onSave={() => { }}
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

      {/* Todo编辑弹窗 */}
      <SlideUpModal
        visible={isTodoModalVisible}
        onClose={() => setIsTodoModalVisible(false)}
        themeMode="light"
        headerComponent={
          <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>编辑提醒</Text>
          </View>
        }
      >
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.todoModalTitle}>{currentAction}</Text>

          {/* 提醒频率设置 - 对所有todo都显示 */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>提醒间隔</Text>
            <View style={styles.recurringRow}>
              <Text style={styles.inputLabel}>每</Text>
              <Input
                style={styles.intervalInput}
                value={todoData.recurringInterval}
                onChangeText={value => {
                  // 确保输入的是数字且大于0
                  const numValue = value.replace(/[^0-9]/g, '');
                  const finalValue = numValue === '' ? '1' : numValue;
                  setTodoData({ ...todoData, recurringInterval: finalValue });
                }}
                keyboardType="number-pad"
              />
              <View style={styles.unitSelect}>
                <Select
                  value={recurringUnits.find(unit => unit.value === todoData.recurringUnit)?.text}
                  onSelect={index => {
                    const selectedIndex = Array.isArray(index) ? index[0].row : index.row;
                    const selectedUnit = recurringUnits[selectedIndex];
                    setTodoData({ ...todoData, recurringUnit: selectedUnit.value });
                  }}
                >
                  {recurringUnits.map(unit => (
                    <SelectItem key={unit.value} title={unit.text} />
                  ))}
                </Select>
              </View>
            </View>
          </View>

          {/* 下次提醒时间预览 */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>下次提醒时间</Text>
            <View style={styles.nextRemindBox}>
              <Text style={styles.nextRemindText}>
                {formatNextRemindTime(todoData.recurringUnit, parseInt(todoData.recurringInterval) || 1)}
              </Text>
            </View>
          </View>

          {/* 循环选项 */}
          <View style={styles.formGroup}>
            <CheckBox
              checked={todoData.isRecurring}
              onChange={checked => setTodoData({ ...todoData, isRecurring: checked })}
              style={styles.checkbox}
            >
              {() => <Text style={styles.checkboxLabel}>循环提醒</Text>}
            </CheckBox>
          </View>

          {/* 备注 */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>备注</Text>
            <Input
              multiline
              textStyle={{ minHeight: 80 }}
              placeholder="添加备注信息..."
              value={todoData.remark}
              onChangeText={value => setTodoData({ ...todoData, remark: value })}
              style={styles.remarkInput}
            />
          </View>

          {/* 保存按钮 */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={deleteTodo}
            >
              <Text style={styles.deleteBtnText}>删除</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={saveTodo}
            >
              <Text style={styles.saveBtnText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SlideUpModal>

      {/* Custom Image Viewer for gallery navigation */}
      {renderImageViewer()}
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
  timelineTimeContainer: {
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  timelineTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  timelineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f4ea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1,
  },
  timelineContentBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 8,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#34a853',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  timelineTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  timelineDesc: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
    marginBottom: 12,
  },
  timelineImagesContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  timelineImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  timelineSingleImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  imageCountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timelineFooterTime: {
    fontSize: 12, 
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  emptyTimelineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTimelineIcon: {
    width: 60,
    height: 60,
    marginBottom: 16,
  },
  emptyTimelineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyTimelineText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addActionButton: {
    backgroundColor: '#34a853',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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

  // Todo Modal Styles
  todoModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  checkbox: {
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  intervalInput: {
    width: 70,
    marginHorizontal: 10,
  },
  unitSelect: {
    flex: 1,
  },
  remarkInput: {
    marginTop: 8,
  },
  nextRemindBox: {
    backgroundColor: '#f1f8f5',
    padding: 12,
    borderRadius: 8,
  },
  nextRemindText: {
    color: '#34a853',
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: '#34a853',
    borderRadius: 24,
    paddingVertical: 12,
    flex: 2,
    alignItems: 'center',
    marginLeft: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#ff3b30',
    fontSize: 16,
  },
  imageViewerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  imageNavigationContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  imageNavigationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  imageNavigationButtonDisabled: {
    opacity: 0.5,
  },
  imageNavigationIcon: {
    width: 24,
    height: 24,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PlantDetail; 