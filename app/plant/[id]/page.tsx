import React, { useMemo } from 'react';
import { View, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions, FlatList, Linking, Platform } from 'react-native';
import Timeline from '../../../components/Timeline';
import PageHeader from '../../../components/PageHeader';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../../stores/RootStore';
import { IPlantModel, ITodoModel } from '../../../stores/PlantStore';
import { Icon, Text, Input, CheckBox, Select, SelectItem, Button, Card, Modal, IndexPath } from '@ui-kitten/components';
import SlideUpModal from '../../../components/SlideUpModal';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getSnapshot, types } from 'mobx-state-tree';
import { ActionType } from '@/types/action';
import { getActionIcon } from '@/utils/action';
import { calculateNextRemindTime } from '@/utils/plant';
import ImageViewer from '@/components/ImageViewer';
import WheelPicker from 'react-native-wheel-picker-expo';
import * as ImagePicker from 'expo-image-picker';
import { FileManager } from '@/models/FileManager';
import { showMessage } from 'react-native-flash-message';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const tabs = [
  { id: 'timeline', label: '时间线' },
  { id: 'actions', label: '行为' },
  { id: 'gallery', label: '图库' },
  { id: 'notes', label: '简介' },
];

const recurringUnits = [
  { label: '天', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
];

//1 - 31
const recurringIntervals = Array.from({ length: 31 }, (_, i) => ({
  label: (i + 1).toString(),
  value: (i + 1).toString()
}));

// 时间线组件
const TimelineTab = observer(({
  plant,
  onImagePress,
}: {
  plant: IPlantModel;
  onImagePress: (images: string[], index: number) => void;
}) => {
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
          去添加行为记录吧，记录你对植物的关爱，让时间见证植物的成长历程
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 20 }}>
      <Timeline
        scrollViewRef={timelineRef}
        data={sortedTimelineData}
        renderTime={(item) => (
          <View style={styles.timelineTimeContainer}>
            <Text style={styles.timelineDate} numberOfLines={1} ellipsizeMode="tail">{format(new Date(item.time), 'MM月dd日', { locale: zhCN })}</Text>
            <Text style={styles.timelineTime} numberOfLines={1} ellipsizeMode="tail">{format(new Date(item.time), 'HH:mm', { locale: zhCN })}</Text>
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
            <Text style={styles.timelineFinishTime}>完成于 {format(new Date(item.time), 'HH:mm', { locale: zhCN })}</Text>
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
                      onPress={() => onImagePress(item.images, index)}
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
});

// 行为列表组件
const ActionsTab = observer(({
  plant,
  onTodoPress
}: {
  plant: IPlantModel;
  onTodoPress: (actionName: string) => void;
}) => {
  const availableActions = rootStore.settingStore.actionTypes;
  const [isActionTypeModalVisible, setIsActionTypeModalVisible] = React.useState(false);
  const [actionTypeName, setActionTypeName] = React.useState('');
  const [iconImage, setIconImage] = React.useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const screenWidth = Dimensions.get('window').width;

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

      if (availableActions.some(type => type.name === actionTypeName)) {
        showMessage({
          message: `行为类型 "${actionTypeName}" 已存在`,
          duration: 1000,
          type: "info"
        });
        return;
      }

      await rootStore.settingStore.addActionType(newActionType);
      await rootStore.settingStore.fetchActionTypes();
      setIsActionTypeModalVisible(false);
      setActionTypeName('');
      setIconImage(undefined);
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

  return (
    <View style={{ flex: 1 }}>
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
                onPress={() => onTodoPress(action.name)}
                activeOpacity={0.7}
              >
                <View style={[styles.switchDot, checked ? styles.switchDotActive : styles.switchDotInactive]} />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={styles.addActionTypeBtn}
        onPress={() => setIsActionTypeModalVisible(true)}
      >
        <Icon name="plus-outline" style={styles.addActionTypeIcon} fill="#fff" />
        <Text style={styles.addActionTypeText}>添加自定义行为</Text>
      </TouchableOpacity>

      <Modal
        visible={isActionTypeModalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => {
          setIsActionTypeModalVisible(false);
          setActionTypeName('');
          setIconImage(undefined);
        }}
      >
        <Card
          disabled
          style={[
            styles.modalCard,
            { width: screenWidth * 0.8 }
          ]}
        >
          <Text style={[styles.modalTitle, { fontSize: 18, fontWeight: 'bold' }]}>
            添加自定义行为
          </Text>
          <View style={styles.inputRow}>
            <Input
              placeholder="行为类型名称"
              value={actionTypeName}
              onChangeText={setActionTypeName}
              style={styles.nameInput}
            />
            <TouchableOpacity onPress={handlePickImage} style={styles.imageContainer}>
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
            </TouchableOpacity>
          </View>

          <Button onPress={handleSaveActionType}>
            添加
          </Button>
        </Card>
      </Modal>
    </View>
  );
});

// 简介组件
const NotesTab = observer(({
  plant,
  onAddNote
}: {
  plant: IPlantModel;
  onAddNote: () => void;
}) => {
  // 处理链接点击
  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) => {
      showMessage({
        message: '无法打开链接',
        description: err.message,
        type: "warning"
      });
    });
  };

  // 检测文本中的链接并渲染
  const renderTextWithLinks = (text: string) => {
    if (!text) return '暂无简介信息';

    // 匹配URL的正则表达式
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <Text
            key={index}
            style={[styles.notesText, styles.linkText]}
            onPress={() => handleLinkPress(part)}
          >
            {part}
          </Text>
        );
      }
      return (
        <Text key={index} style={styles.notesText}>
          {part}
        </Text>
      );
    });
  };

  return (
    <View style={styles.notesBox}>
      <View style={styles.notesContentBox}>
        <Text selectable style={styles.notesText}>
          {renderTextWithLinks(plant.description)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.addNoteBtn}
        onPress={onAddNote}
      >
        <Text style={styles.addNoteBtnText}>添加简介</Text>
      </TouchableOpacity>
    </View>
  );
});

// 图库组件
const GalleryTab = observer(({
  plant,
  onImagePress,
}: {
  plant: IPlantModel;
  onImagePress: (images: string[], index: number) => void;
}) => {
  const availableActions = rootStore.settingStore.actionTypes;
  const [selectedActionTypeIndex, setSelectedActionTypeIndex] = React.useState<IndexPath[]>([]);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const selectedActionTypes = useMemo(() => {
    if(selectedActionTypeIndex.length === 0) {
      return availableActions.map(action => action.name);
    }
    return selectedActionTypeIndex.map(index => availableActions[index.row].name);
  }, [selectedActionTypeIndex]);

  // 获取所有图片
  const getAllImages = () => {
    const images: { url: string; actionName: string; time: number }[] = [];
    plant.actions.forEach(action => {
      if (action.imgs && action.imgs.length > 0) {
        action.imgs.forEach(img => {
          images.push({
            url: img,
            actionName: action.name,
            time: action.time
          });
        });
      }
    });
    return images;
  };

  // 过滤图片
  const filteredImages = React.useMemo(() => {
    const allImages = getAllImages();
    if (selectedActionTypes.length === 0) {
      return allImages;
    }
    return allImages.filter(img => selectedActionTypes.includes(img.actionName));
  }, [selectedActionTypes, plant.actions]);

  // 下载图片
  const downloadImages = async () => {
    if (filteredImages.length === 0) {
      showMessage({
        message: '没有可下载的图片',
        type: 'warning',
      });
      return;
    }

    try {
      setIsDownloading(true);

      // 请求权限
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showMessage({
          message: '需要相册权限才能保存图片',
          type: 'warning',
        });
        return;
      }

      // 创建文件夹
      const folderName = `${plant.name}_${format(new Date(), 'yyyyMMdd')}`;
      const folderPath = `${FileSystem.documentDirectory}${folderName}`;
      await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });

      // 下载进度
      let completedCount = 0;
      const totalCount = filteredImages.length;

      // 批量下载
      const downloadPromises = filteredImages.map(async (image, index) => {
        try {
          const fileName = `${image.actionName}_${format(new Date(image.time), 'yyyyMMdd_HHmmss')}.jpg`;
          const filePath = `${folderPath}/${fileName}`;
          
          // 检查 URL 格式并处理
          let imageUrl = image.url;
          if (imageUrl.startsWith('file://')) {
            // 如果是本地文件，复制到filePath
            await FileSystem.copyAsync({ from: imageUrl, to: filePath });
            const fileInfo = await FileSystem.getInfoAsync(filePath);
          } else {
            // 如果是网络图片，下载
            await FileSystem.downloadAsync(imageUrl, filePath);
          }
          
          // 保存到相册
          const asset = await MediaLibrary.createAssetAsync(filePath);
          console.log('asset', asset);
          await MediaLibrary.createAlbumAsync(folderName, asset, false);
          
          completedCount++;
          showMessage({
            message: `下载进度: ${completedCount}/${totalCount}`,
            type: 'info',
            duration: 1000,
          });
        } catch (error) {
          console.error('下载图片失败:', error);
          showMessage({
            message: `下载第 ${index + 1} 张图片失败`,
            type: 'warning',
            duration: 1000,
          });
        }
      });

      await Promise.all(downloadPromises);

      // 清理临时文件
      await FileSystem.deleteAsync(folderPath, { idempotent: true });

      showMessage({
        message: '下载完成',
        description: `已保存 ${completedCount} 张图片到相册`,
        type: 'success',
      });
    } catch (error) {
      console.error('下载过程出错:', error);
      showMessage({
        message: '下载失败',
        description: '请检查网络连接和存储空间',
        type: 'danger',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.galleryContainer}>
      {/* 行为类型过滤器 */}
      <View style={styles.filterContainer}>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginRight: 16}}>
        <Select 
          style={{ marginLeft: 16,  flex: 1 }} 
          selectedIndex={selectedActionTypeIndex} 
          value={selectedActionTypeIndex.length === 0? "选择行为类型筛选图片" : selectedActionTypes.join(',')} 
          multiSelect 
          onSelect={(indexs) => {
            if (typeof indexs === 'object') {
              setSelectedActionTypeIndex((indexs as IndexPath[]));
            } else {
              setSelectedActionTypeIndex([indexs]);
            }
          }}
        >
          {availableActions.map(action => (
            <SelectItem 
              key={action.name} 
              title={action.name} 
              accessoryRight={getActionIcon(action.name, 16, selectedActionTypes.includes(action.name) ? '#fff' : '#34a853') as any} 
            />
          ))}
        </Select>
        {selectedActionTypeIndex.length > 0 && (
            <TouchableOpacity
              onPress={() => setSelectedActionTypeIndex([])}
              style={styles.filterReset}
            >
              <Text style={styles.filterResetText}>重置</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* 下载按钮 */}
        {filteredImages.length > 0 && (
          <TouchableOpacity
            style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]}
            onPress={downloadImages}
            disabled={isDownloading}
          >
            <Icon
              name={isDownloading ? 'loader-outline' : 'download-outline'}
              style={styles.downloadIcon}
              fill="#fff"
            />
            <Text style={styles.downloadButtonText}>
              {isDownloading ? '下载中...' : '下载图片'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {filteredImages.length === 0 ? (
        <View style={styles.emptyGalleryContainer}>
          <Icon name="image-outline" style={styles.emptyGalleryIcon} fill="#34a853" />
          <Text style={styles.emptyGalleryTitle}>暂无图片</Text>
          <Text style={styles.emptyGalleryText}>
            完成行为并添加图片后，将在这里显示
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredImages}
          numColumns={3}
          keyExtractor={(item, index) => `${item.url}-${index}`}
          contentContainerStyle={styles.galleryGrid}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.galleryItem}
              onPress={() => onImagePress(filteredImages.map(img => img.url), index)}
            >
              <Image
                source={{ uri: item.url }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
              <View style={styles.galleryItemOverlay}>
                <Text style={styles.galleryItemAction} numberOfLines={1}>
                  {item.actionName}
                </Text>
                <Text style={styles.galleryItemTime}>
                  {format(new Date(item.time), 'MM-dd', { locale: zhCN })}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
});

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

  // 处理图片点击
  const handleImagePress = (images: string[], index: number) => {
    setSelectedImages(images);
    setSelectedImageIndex(index);
    setShowImageViewer(true);
  };

  // 保存Todo
  const saveTodo = () => {
    const interval = parseInt(todoData.recurringInterval) || 1;
    const nextRemindTime = calculateNextRemindTime(todoData.recurringUnit, interval);

    const existingTodo = plant.todos.find(todo => todo.actionName === currentAction);

    if (existingTodo) {
      // 更新现有的todo
      plant.updateTodo({ ...existingTodo, isRecurring: todoData.isRecurring, recurringUnit: todoData.recurringUnit, recurringInterval: interval, nextRemindTime: nextRemindTime, remark: todoData.remark });
      rootStore.logStore.addLog('todo_update', `更新了植物"${plant.name}"的${currentAction}提醒设置`, {
        plantId: plant.id,
        plantName: plant.name,
        actionName: currentAction,
        isRecurring: todoData.isRecurring,
        recurringUnit: todoData.recurringUnit,
        recurringInterval: interval,
      });
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
      rootStore.logStore.addLog('todo_create', `为植物"${plant.name}"创建了${currentAction}提醒`, {
        plantId: plant.id,
        plantName: plant.name,
        actionName: currentAction,
        isRecurring: todoData.isRecurring,
        recurringUnit: todoData.recurringUnit,
        recurringInterval: interval,
      });
    }
    setIsTodoModalVisible(false);
  };

  // 删除Todo
  const deleteTodo = () => {
    const newTodos = plant.todos.find(todo => todo.actionName === currentAction);
    plant.deleteTodo(newTodos as ITodoModel);
    rootStore.logStore.addLog('todo_delete', `删除了植物"${plant.name}"的${currentAction}提醒`, {
      plantId: plant.id,
      plantName: plant.name,
      actionName: currentAction,
    });
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
        onRightClick={() => { }}
        rightVisible={false}
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
        {activeTab === 'timeline' && (
          <TimelineTab
            plant={plant}
            onImagePress={handleImagePress}
          />
        )}
        {activeTab === 'actions' && (
          <ActionsTab
            plant={plant}
            onTodoPress={openTodoModal}
          />
        )}
        {activeTab === 'gallery' && (
          <GalleryTab
            plant={plant}
            onImagePress={handleImagePress}
          />
        )}
        {activeTab === 'notes' && (
          <NotesTab
            plant={plant}
            onAddNote={() => setIsNoteModalVisible(true)}
          />
        )}
      </View>

      {/* 添加简介的弹窗 */}
      <SlideUpModal
        visible={isNoteModalVisible}
        onClose={() => setIsNoteModalVisible(false)}
        themeMode="light"
        headerComponent={
          <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>添加简介</Text>
          </View>
        }
      >
        <View style={{ paddingHorizontal: 20 }}>
          <Input
            multiline
            textStyle={{ minHeight: 100 }}
            placeholder="请输入简介信息..."
            value={note}
            onChangeText={setNote}
          />
          <TouchableOpacity
            style={styles.saveNoteBtn}
            onPress={() => {
              rootStore.plantStore.updatePlant({ ...plant, description: note });
              rootStore.logStore.addLog('note_update', `更新了植物"${plant.name}"的简介`, {
                plantId: plant.id,
                plantName: plant.name,
              });
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
          <View style={styles.modalHeader}>
            <View style={styles.todoModalHeader}>
              <View style={styles.todoModalIconContainer}>
                {getActionIcon(currentAction, 24, '#34a853')}
              </View>
              <Text style={styles.todoModalTitle}>{currentAction}</Text>
            </View>
          </View>
        }
      >
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20 }}>
            {/* 提醒频率设置 - 对所有todo都显示 */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>提醒间隔</Text>
              <View style={styles.recurringRow}>
                <Text style={styles.inputLabel}>每</Text>
                <View style={styles.wheelPickerBox}>
                  <WheelPicker
                    initialSelectedIndex={todoData.recurringInterval ? parseInt(todoData.recurringInterval) - 1 : 0}
                    items={recurringIntervals}
                    onChange={({ index }) => {
                      setTodoData({ ...todoData, recurringInterval: (index + 1).toString() });
                    }}
                  />
                </View>
                <View style={styles.wheelPickerBox}>
                  <WheelPicker
                    initialSelectedIndex={recurringUnits.findIndex(unit => unit.value === todoData.recurringUnit)}
                    items={recurringUnits}
                    onChange={({ index }) => {
                      setTodoData({ ...todoData, recurringUnit: recurringUnits[index].value });
                    }}
                  />
                </View>
              </View>
            </View>

            {/* 下次提醒时间预览 */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>下次提醒</Text>
              <View style={styles.nextRemindBox}>
                <Text style={styles.nextRemindText}>
                  将会在 {formatNextRemindTime(todoData.recurringUnit, parseInt(todoData.recurringInterval) || 1)} 提醒
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

            {/* 简介 */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>简介</Text>
              <Input
                multiline
                textStyle={{ minHeight: 60 }}
                placeholder="添加简介信息..."
                value={todoData.remark}
                onChangeText={value => setTodoData({ ...todoData, remark: value })}
                style={styles.remarkInput}
              />
            </View>
          </View>

          {/* 保存按钮 - 固定在底部 */}
          <View style={[styles.buttonGroup, { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' }]}>
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
  modalHeader: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    alignItems: 'flex-end',
    marginRight: 20,
    width: 100,
  },
  timelineDate: {
    fontSize: 13,
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
    marginLeft: 24,
    marginRight: 24,
  },
  timelineContentBox: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    elevation: 1,
    marginBottom: 28,
    marginLeft: 20,
    width: '100%'
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
    width: 90,
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginRight: 8,
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
  timelineFinishTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
    marginTop: -4,
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
    height: 75,
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
    lineHeight: 22,
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
  todoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoModalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e6f4ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  todoModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  formGroup: {
    marginBottom: 16,
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
    marginBottom: 8,
  },
  wheelPickerBox: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    height: 100,
    justifyContent: 'center',
  },
  wheelPicker: {
    height: 120,
    width: '100%',
  },
  remarkInput: {
    marginTop: 8,
  },
  nextRemindBox: {
    backgroundColor: '#f1f8f5',
    padding: 10,
    borderRadius: 8,
  },
  nextRemindText: {
    color: '#34a853',
    fontSize: 14,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  addActionTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34a853',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addActionTypeIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  addActionTypeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionTypeInput: {
    marginBottom: 16,
  },
  imagePickerContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  customImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  customImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  imagePickerText: {
    marginTop: 8,
    color: '#8F9BB3',
    fontSize: 14,
  },
  saveActionTypeBtn: {
    backgroundColor: '#34a853',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveActionTypeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.98)'
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  nameInput: {
    flex: 1,
  },
  imageContainer: {
    width: 60,
    height: 60,
  },
  linkText: {
    color: '#34a853',
    textDecorationLine: 'underline',
  },
  galleryContainer: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    marginBottom: 8,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  filterReset: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  filterResetText: {
    fontSize: 14,
    color: '#34a853',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f8f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e6f4ea',
  },
  filterChipActive: {
    backgroundColor: '#34a853',
    borderColor: '#34a853',
  },
  filterChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChipText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#34a853',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  galleryGrid: {
    padding: 4,
  },
  galleryItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 4,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  galleryItemOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  galleryItemAction: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  galleryItemTime: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
  },
  emptyGalleryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyGalleryIcon: {
    width: 60,
    height: 60,
    marginBottom: 16,
  },
  emptyGalleryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyGalleryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34a853',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  downloadButtonDisabled: {
    opacity: 0.7,
  },
  downloadIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default PlantDetail; 