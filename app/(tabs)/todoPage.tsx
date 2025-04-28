import * as React from 'react';
import { StyleSheet, FlatList, Image, TouchableOpacity, View, Dimensions, Alert, ScrollView, Animated, Platform } from 'react-native';
import { Layout, Text, Card, Icon, Modal, Button, Input, IconProps, Spinner, Select, SelectItem, Datepicker, IndexPath, Toggle, CheckBox, Divider, useTheme as useKittenTheme } from '@ui-kitten/components';
import { ActionManager } from '@/models/ActionManager';
import { PlantManager } from '@/models/PlantManager';
import { Action, ActionType } from '@/types/action';
import { Plant } from '@/types/plant';
import { theme } from '@/theme/theme';
import { getActionIconAsync } from '@/utils/action';
import * as ImagePicker from 'expo-image-picker';
import { fileManager } from '@/models/FileManager';
import { useTheme } from '../../theme/themeContext';
import { ConfigManager } from '@/models/ConfigManager';
import { useFocusEffect } from 'expo-router';
import SlideUpModal from '@/components/SlideUpModal';
import { showMessage } from "react-native-flash-message";
import { generateId } from '@/utils/uuid';
import LoadingModal from '@/components/LoadingModal';
import { DatabaseInstance } from '@/models/sqlite/database';
import PhotoSelectList from '@/components/PhotoSelectList';
import { useRouter } from 'expo-router';
import GradientBackground from '@/components/GradientBackground';

// 图片查看器组件接口定义
interface ImageViewerProps
{
    visible: boolean;    // 是否显示查看器
    imageUri: string;    // 图片URI
    onClose: () => void; // 关闭回调
}

// 图片查看器组件 - 用于全屏查看和旋转图片
const ImageViewer = ({ visible, imageUri, onClose }: ImageViewerProps) =>
{
    const [rotation, setRotation] = React.useState(0);

    const rotateLeft = () =>
    {
        setRotation((prev) => (prev - 90) % 360);
    };

    const rotateRight = () =>
    {
        setRotation((prev) => (prev + 90) % 360);
    };

    return (
        <Modal
            visible={visible}
            backdropStyle={styles.backdrop}
            onBackdropPress={onClose}
        >
            <View style={styles.imageViewerContainer}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Icon name="close-outline" style={{ width: 24, height: 24, tintColor: '#fff' }} />
                </TouchableOpacity>

                <View style={styles.rotationButtonsContainer}>
                    <TouchableOpacity style={styles.rotateButton} onPress={rotateLeft}>
                        <Icon name="arrow-undo" pack='ionicons' style={{ width: 28, height: 28, tintColor: '#fff' }} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rotateButton} onPress={rotateRight}>
                        <Icon name="arrow-redo" pack='ionicons' style={{ width: 28, height: 28, tintColor: '#fff' }} />
                    </TouchableOpacity>
                </View>

                <View style={styles.fullScreenImageContainer}>
                    <Image
                        source={{ uri: imageUri }}
                        style={[
                            styles.fullScreenImage,
                            { transform: [{ rotate: `${rotation}deg` }] }
                        ]}
                        resizeMode="contain"
                    />
                </View>
            </View>
        </Modal>
    );
};

// 任务详情组件接口定义
interface TaskDetailProps
{
    action: Action;           // 待办事项
    plant: Plant;            // 关联的植物
    onClose: () => void;     // 关闭回调
    onDelete: (id: string) => void;  // 删除回调
    onComplete: (action: Action) => void;  // 完成任务回调
}

// 任务详情组件 - 显示待办事项的详细信息，支持完成和删除操作
const TaskDetail = ({ action, plant, onClose, onDelete, onComplete }: TaskDetailProps) =>
{
    const screenWidth = Dimensions.get('window').width;
    const [isCompleting, setIsCompleting] = React.useState(false);
    const [remark, setRemark] = React.useState(action.remark || '');
    const [images, setImages] = React.useState<string[]>(action.imgs || []);
    const [selectedImage, setSelectedImage] = React.useState('');
    const [showImageViewer, setShowImageViewer] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const { themeMode } = useTheme();

    const date = new Date(Number(action.time));
    const cardStyle = [
        styles.detailCard,
        {
            width: screenWidth * 0.8,
            backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(43, 50, 65, 0.98)'
        }
    ];

    const handleDelete = () =>
    {
        Alert.alert(
            "删除待办",
            "确定要删除这个待办事项吗？",
            [
                { text: "取消", style: "cancel" },
                {
                    text: "删除",
                    style: "destructive",
                    onPress: () =>
                    {
                        onDelete(action.id);
                        onClose();
                    }
                }
            ]
        );
    };

    const handleImagePress = (photo: string) => {
        setSelectedImage(photo);
        setShowImageViewer(true);
    };

    const handleComplete = async () =>
    {
        setLoading(true);

        try {
            // Make sure all images are properly saved before completing the task
            const updatedAction = {
                ...action,
                remark: remark,
                imgs: images,
                done: true,
                time: Date.now(), // Update time to completion time
            };

            await onComplete(updatedAction);
            onClose();
        } catch (error) {
            showMessage({
                message: "保存失败，请重试",
                duration: 1000,
                type: "warning"
            });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card style={cardStyle}>
            <ScrollView style={styles.detailContent}>
                <Text category='h5' style={styles.detailDate}>
                    {date.toLocaleDateString()}
                </Text>

                <View style={styles.detailActionContainer}>
                    <Text category='p1' style={styles.detailAction}>
                        为
                    </Text>
                    <Text category='h6' style={[styles.detailAction, styles.boldText, { color: theme['color-primary-600'] }]}>
                        {plant?.name}
                    </Text>
                    <Text category='h6' style={[styles.detailAction, styles.boldText, { color: theme['color-purple-200'] }]}>
                        {action?.name}
                    </Text>
                </View>

                {!isCompleting ? (
                    <View style={styles.buttonGroup}>
                        <Button
                            status='primary'
                            onPress={() => setIsCompleting(true)}
                            style={styles.actionButton}
                        >
                            标记完成
                        </Button>
                        <Button
                            status='danger'
                            onPress={handleDelete}
                            style={styles.actionButton}
                        >
                            删除任务
                        </Button>
                    </View>
                ) : (
                    <View style={styles.completeForm}>
                        <Text category='s1' style={styles.completeFormLabel}>完成备注:</Text>
                        <Input
                            value={remark}
                            onChangeText={setRemark}
                            placeholder="添加备注..."
                            multiline={true}
                            textStyle={{ minHeight: 64 }}
                            style={styles.remarkInput}
                        />

                        <Text category='s1' style={styles.completeFormLabel}>添加图片记录:</Text>
                        <PhotoSelectList 
                            photos={images} 
                            onPhotosChange={setImages}
                            onPhotoPress={handleImagePress}
                        />

                        <View style={styles.buttonGroup}>
                            <Button
                                status='basic'
                                onPress={() => setIsCompleting(false)}
                                style={styles.actionButton}
                            >
                                取消
                            </Button>
                            <Button
                                status='success'
                                onPress={handleComplete}
                                style={styles.actionButton}
                                accessoryLeft={loading ? (props) => <Spinner size="small" /> : undefined}
                                disabled={loading}
                            >
                                确认完成
                            </Button>
                        </View>
                    </View>
                )}

                <ImageViewer
                    visible={showImageViewer}
                    imageUri={selectedImage}
                    onClose={() => setShowImageViewer(false)}
                />
            </ScrollView>
        </Card>
    );
};

// 待办事项列表项渲染组件 - 显示单个待办事项
const RenderTodoItem = ({ item, onPress }: { item: Action, onPress: () => void }) =>
{
    const [plant, setPlant] = React.useState<Plant | null>(null);
    const { themeMode } = useTheme();

    React.useEffect(() =>
    {
        PlantManager.getPlant(item.plantId).then(setPlant);
    }, [item.plantId]);

    const [iconData, setIconData] = React.useState<React.ReactNode>(null);
    React.useEffect(() =>
    {
        getActionIconAsync(item.name).then(setIconData);
    }, [item.name]);
    const cardStyle = [
        styles.todoItem,
        { backgroundColor: themeMode === 'light' ? '#FFFFFF' : '#2E3A59' }
    ];
    const iconContainerStyle = [
        styles.iconContainer,
        { backgroundColor: themeMode === 'light' ? '#F7F9FC' : '#1A2138' }
    ];

    if (!plant) {
        return <View></View>
    }
    return (
        <TouchableOpacity>
            <Card style={cardStyle} onPress={onPress}>
                <View style={styles.todoItemContent}>
                    <View style={iconContainerStyle}>
                        {iconData}
                    </View>
                    <View style={styles.taskInfo}>
                        <Text category="h6" style={styles.plantName}>
                            {plant.name}
                        </Text>
                        <Text category="s1" style={styles.taskName}>
                            {item.name}
                        </Text>
                        {item.remark ? (
                            <Text category="p2" numberOfLines={1} style={styles.taskRemark}>
                                {item.remark}
                            </Text>
                        ) : null}
                    </View>
                    <Icon
                        name="chevron-right-outline"
                        style={styles.arrowIcon}
                        fill={theme['color-basic-500']}
                    />
                </View>
            </Card>
        </TouchableOpacity>
    );
};

// 添加待办表单组件接口定义
interface TodoFormProps
{
    plants: Plant[];         // 可选植物列表
    actionTypes: ActionType[]; // 可选操作类型列表
    onSubmit: (formData: {   // 提交回调
        plant: Plant;
        actionType: ActionType;
        date: Date;
        remark: string;
        isRecurring: boolean;  // 是否循环任务
        recurringInterval: number;  // 循环间隔天数
        recurringStartDate: Date;  // 循环开始日期
        recurringEndDate: Date;  // 循环结束日期
    }) => void;
    onCancel: () => void;    // 取消回调
    themeMode: 'light' | 'dark';  // 主题模式
}

// 添加待办表单组件 - 用于创建新的待办事项
const TodoForm = ({ plants, actionTypes, onSubmit, onCancel, themeMode }: TodoFormProps) =>
{
    const [selectedPlantIndex, setSelectedPlantIndex] = React.useState<IndexPath>();
    const [selectedActionTypeIndex, setSelectedActionTypeIndex] = React.useState<IndexPath>();
    const [todoDate, setTodoDate] = React.useState(new Date());
    const [todoRemark, setTodoRemark] = React.useState('');
    const [isRecurring, setIsRecurring] = React.useState(false);  // 是否为循环任务
    const [recurringInterval, setRecurringInterval] = React.useState(1);  // 循环间隔天数，默认为1（每天）
    const [recurringIntervalIndex, setRecurringIntervalIndex] = React.useState(new IndexPath(0));  // 循环间隔的索引
    const [recurringStartDate, setRecurringStartDate] = React.useState(new Date());  // 循环开始日期
    const [recurringEndDate, setRecurringEndDate] = React.useState(() =>
    {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 默认30天后
        return endDate;
    });  // 循环结束日期

    // 重置表单状态
    const resetForm = () => {
        setSelectedPlantIndex(undefined);
        setSelectedActionTypeIndex(undefined);
        setTodoDate(new Date());
        setTodoRemark('');
        setIsRecurring(false);
        setRecurringInterval(1);
        setRecurringIntervalIndex(new IndexPath(0));
        setRecurringStartDate(new Date());
        setRecurringEndDate(() => {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);
            return endDate;
        });
    };

    // 生成循环间隔选项
    const recurringIntervalOptions = [
        { title: '每天', value: 1 },
        { title: '隔1天', value: 2 },
        { title: '隔2天', value: 3 },
        { title: '隔3天', value: 4 },
        { title: '隔4天', value: 5 },
        { title: '隔5天', value: 6 },
        { title: '隔6天', value: 7 }
    ];

    // Remove the incorrect useEffect that was trying to access non-existent properties
    React.useEffect(() =>
    {
        if (selectedPlantIndex) {
            setTodoDate(new Date());
            setTodoRemark('');
        }
    }, [selectedPlantIndex]);

    const handleSubmit = () =>
    {
        if (!selectedPlantIndex) {
            showMessage({
                message: '请选择一个植物',
                duration: 1000,
                type: "warning"
            });
            return;
        }

        if (selectedActionTypeIndex === undefined) {
            showMessage({
                message: '请选择一个待办类型',
                duration: 1000,
                type: "warning"
            });
            return;
        }

        if (isRecurring && recurringEndDate < recurringStartDate) {
            showMessage({
                message: '结束日期必须晚于开始日期',
                duration: 1000,
                type: "warning"
            });
            return;
        }

        onSubmit({
            plant: plants[selectedPlantIndex.row],
            actionType: actionTypes[selectedActionTypeIndex.row],
            date: todoDate,
            remark: todoRemark,
            isRecurring: isRecurring,
            recurringInterval: recurringIntervalOptions[recurringIntervalIndex.row].value,
            recurringStartDate: recurringStartDate,
            recurringEndDate: recurringEndDate
        });
        
        // 提交后重置表单
        resetForm();
    };
    
    // 处理取消按钮点击
    const handleCancel = () => {
        // 取消时重置表单
        resetForm();
        onCancel();
    };
    
    const items = React.useMemo(() =>
    {
        return plants.map((plant) => (
            <SelectItem key={plant.id} title={plant.name} />
        ))
    }, [plants])

    const headerComponent = (
        <View style={styles.titleContainer}>
            <Text category="h5" style={styles.formTitle}>
                添加待办事项
            </Text>
        </View>
    );

    return (
        <SlideUpModal
            visible={true}
            onClose={handleCancel}
            themeMode={themeMode}
            headerComponent={headerComponent}
        >
            <View style={styles.formContent}>
                <Text category='s1' style={styles.formLabel}>选择植物:</Text>
                <Select
                    style={styles.input}
                    placeholder="选择植物"
                    value={plants[selectedPlantIndex?.row ?? 0].name}
                    selectedIndex={selectedPlantIndex}
                    onSelect={(index) =>
                    {
                        const idx = index as IndexPath;
                        setSelectedPlantIndex(idx);
                    }}
                >
                    {items}
                </Select>

                <Text category='s1' style={styles.formLabel}>选择待办类型:</Text>
                <Select
                    style={styles.input}
                    placeholder="选择类型"
                    value={actionTypes[selectedActionTypeIndex?.row ?? 0].name}
                    selectedIndex={selectedActionTypeIndex}
                    onSelect={(index) =>
                    {
                        const idx = index as IndexPath;
                        if (idx && idx.row !== undefined) {
                            setSelectedActionTypeIndex(idx);
                        }
                    }}
                >
                    {actionTypes.map((type, index) => (
                        <SelectItem key={index.toString()} title={type.name} />
                    ))}
                </Select>

                {!isRecurring && (
                    <>
                        <Text category='s1' style={styles.formLabel}>选择日期:</Text>
                        <Datepicker
                            style={styles.input}
                            date={todoDate}
                            onSelect={setTodoDate}
                            min={new Date()}
                        />
                    </>
                )}

                <View style={styles.switchContainer}>
                    <Text category='s1' style={styles.formLabel}>循环任务:</Text>
                    <View style={styles.switchRow}>
                        <Text>{isRecurring ? '开启' : '关闭'}</Text>
                        <Toggle
                            checked={isRecurring}
                            onChange={() => setIsRecurring(!isRecurring)}
                        />
                    </View>
                </View>

                {isRecurring && (
                    <>
                        <Text category='s1' style={styles.formLabel}>循环周期:</Text>
                        <Select
                            style={styles.input}
                            placeholder="选择循环周期"
                            selectedIndex={recurringIntervalIndex}
                            value={recurringIntervalOptions[recurringIntervalIndex.row].title}
                            onSelect={(index) => 
                            {
                                const idx = index as IndexPath;
                                if (idx && idx.row !== undefined) {
                                    setRecurringIntervalIndex(idx);
                                    setRecurringInterval(recurringIntervalOptions[idx.row].value);
                                }
                            }}
                        >
                            {recurringIntervalOptions.map((option, index) => (
                                <SelectItem key={index.toString()} title={option.title} />
                            ))}
                        </Select>

                        <Text category='s1' style={styles.formLabel}>循环开始日期:</Text>
                        <Datepicker
                            style={styles.input}
                            date={recurringStartDate}
                            onSelect={setRecurringStartDate}
                            min={new Date()}
                        />

                        <Text category='s1' style={styles.formLabel}>循环结束日期:</Text>
                        <Datepicker
                            style={styles.input}
                            date={recurringEndDate}
                            onSelect={setRecurringEndDate}
                            min={recurringStartDate}
                        />

                        <Text category='p2' style={styles.infoText}>
                            将创建从{recurringStartDate.toLocaleDateString()}到{recurringEndDate.toLocaleDateString()}期间的循环任务，间隔为{recurringIntervalOptions[recurringIntervalIndex.row].title}
                        </Text>
                    </>
                )}

                <Text category='s1' style={styles.formLabel}>备注:</Text>
                <Input
                    style={styles.input}
                    multiline={true}
                    textStyle={{ minHeight: 64 }}
                    placeholder="添加备注..."
                    value={todoRemark}
                    onChangeText={setTodoRemark}
                />

                <Button
                    onPress={handleSubmit}
                    style={styles.submitButton}
                    disabled={selectedPlantIndex === undefined || selectedActionTypeIndex === undefined}
                >
                    添加
                </Button>

                <Button
                    appearance="outline"
                    status="basic"
                    onPress={handleCancel}
                    style={styles.cancelButton}
                >
                    取消
                </Button>
            </View>
        </SlideUpModal>
    );
};

// 主页面组件 - 待办事项管理页面
const TodoPage = () =>
{
    // 状态管理
    const [todoItems, setTodoItems] = React.useState<Action[]>([]); // 所有待办事项
    const [todayTasks, setTodayTasks] = React.useState<Action[]>([]); // 今日待办
    const [futureTasks, setFutureTasks] = React.useState<Action[]>([]); // 未来待办
    const [displayedFutureTasks, setDisplayedFutureTasks] = React.useState<Action[]>([]); // 当前显示的未来待办
    const [loading, setLoading] = React.useState(true); // 加载状态
    const [loadingMore, setLoadingMore] = React.useState(false); // 加载更多状态
    const [selectedTask, setSelectedTask] = React.useState<{ action: Action, plant: Plant } | null>(null); // 选中的任务
    const [showDetail, setShowDetail] = React.useState(false); // 是否显示详情
    const { themeMode } = useTheme(); // 主题模式
    const router = useRouter(); // 路由

    // 未来待办显示控制
    const MAX_INITIAL_FUTURE_TASKS = 10; // 初始显示的未来待办数量
    const LOAD_MORE_COUNT = 10; // 每次加载的待办数量

    // 滚动视图引用，用于监听滚动事件
    const scrollViewRef = React.useRef<ScrollView>(null);

    // 加载数据的回调函数
    const loadData = React.useCallback(() =>
    {
        loadTodoItems();
    }, []);

    // 页面聚焦时重新加载数据
    useFocusEffect(loadData);

    // 处理滚动到底部时加载更多未来待办
    const handleLoadMoreFutureTasks = () =>
    {
        if (loadingMore || displayedFutureTasks.length >= futureTasks.length) {
            return; // 已经在加载或已显示全部
        }

        setLoadingMore(true);
        const currentCount = displayedFutureTasks.length;
        const newTasksToShow = futureTasks.slice(0, currentCount + LOAD_MORE_COUNT);

        // 模拟异步加载
        setTimeout(() =>
        {
            setDisplayedFutureTasks(newTasksToShow);
            setLoadingMore(false);
        }, 300);
    };

    // 监听滚动事件
    const handleScroll = (event: any) =>
    {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 20; // 距离底部多少距离开始加载

        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            handleLoadMoreFutureTasks();
        }
    };

    // 将待办事项分为今日和未来
    const separateTodoItems = (actions: Action[]) =>
    {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayItems: Action[] = [];
        const futureItems: Action[] = [];

        actions.forEach(action =>
        {
            const actionDate = new Date(Number(action.time));
            actionDate.setHours(0, 0, 0, 0);

            if (actionDate.getTime() < tomorrow.getTime()) {
                todayItems.push(action);
            } else {
                futureItems.push(action);
            }
        });

        // 按时间排序
        todayItems.sort((a, b) => Number(a.time) - Number(b.time));
        futureItems.sort((a, b) => Number(a.time) - Number(b.time));

        return { todayItems, futureItems };
    };

    // 加载所有待办事项
    const loadTodoItems = async () =>
    {
        setLoading(true);
        try {
            const actions = await ActionManager.getAllActions();
            const pendingActions = actions.filter(action => !action.done);

            // 将待办分为今日和未来
            const { todayItems, futureItems } = separateTodoItems(pendingActions);

            setTodoItems(pendingActions);
            setTodayTasks(todayItems);
            setFutureTasks(futureItems);

            // 初始时只显示一部分未来待办
            setDisplayedFutureTasks(futureItems.slice(0, MAX_INITIAL_FUTURE_TASKS));
        } catch (error) {
            console.error("Error loading todo items:", error);
        } finally {
            setLoading(false);
        }
    };

    // 删除待办事项
    const handleDelete = async (id: string) =>
    {
        try {
            await ActionManager.deleteAction(id);
            // Update the local state to remove the deleted item
            setTodoItems(prev => prev.filter(item => item.id !== id));
            setTodayTasks(prev => prev.filter(item => item.id !== id));
            setFutureTasks(prev => prev.filter(item => item.id !== id));
            setDisplayedFutureTasks(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error("Error deleting task:", error);
            showMessage({
                message: "删除失败，请重试",
                duration: 1000,
                type: "warning"
            });
        }
    };

    // 完成待办事项
    const handleComplete = async (updatedAction: Action) =>
    {
        try {
            await ActionManager.updateAction(updatedAction);
            // Remove from todo list since it's now completed
            setTodoItems(prev => prev.filter(item => item.id !== updatedAction.id));
            setTodayTasks(prev => prev.filter(item => item.id !== updatedAction.id));
            setFutureTasks(prev => prev.filter(item => item.id !== updatedAction.id));
            setDisplayedFutureTasks(prev => prev.filter(item => item.id !== updatedAction.id));
        } catch (error) {
            console.error("Error completing task:", error);
            throw error; // Let the calling component handle the error
        }
    };

    // 处理任务点击事件
    const handleTaskPress = async (action: Action) =>
    {
        try {
            const plant = await PlantManager.getPlant(action.plantId);
            if (plant) {
                setSelectedTask({ action, plant });
                setShowDetail(true);
            }
        } catch (error) {
            console.error("Error getting plant details:", error);
        }
    };

    // 处理添加待办按钮点击
    const handleAddTodoPress = () => {
        router.push('/todo-edit');
    };

    // 渲染分区标题
    const renderSectionHeader = (title: string) => (
        <View style={styles.sectionHeader}>
            <Text category="h6" style={styles.sectionTitle}>{title}</Text>
        </View>
    );

    // 渲染加载更多指示器
    const renderLoadMoreIndicator = () =>
    {
        if (displayedFutureTasks.length < futureTasks.length) {
            return (
                <View style={styles.loadMoreContainer}>
                    {loadingMore ? (
                        <Spinner size="small" />
                    ) : (
                        <Text category="p2" style={styles.loadMoreText}>
                            下拉加载更多...
                        </Text>
                    )}
                </View>
            );
        }
        return null;
    };

    return (
        <GradientBackground
            colors={themeMode === 'light'
                ? ['#F5F5F5', '#FFF3E0', '#F5F5F5']
                : ['#222B45', '#1A2138', '#222B45']}
            style={styles.container}
        >
            <Layout style={styles.header}>
                <Text category="h1">待办</Text>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleAddTodoPress}
                >
                    <Icon
                        name="plus-outline"
                        style={styles.headerIcon}
                        fill={theme['color-primary-500']}
                    />
                </TouchableOpacity>
            </Layout>
            <Layout style={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Spinner size='large' />
                        <Text category='s1' style={styles.loadingText}>加载中...</Text>
                    </View>
                ) : todoItems.length > 0 ? (
                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={styles.listContainer}
                        onScroll={handleScroll}
                        scrollEventThrottle={400} // 控制滚动事件触发频率
                    >
                        {todayTasks.length > 0 && (
                            <>
                                {renderSectionHeader('今日待办')}
                                {todayTasks.map(item => (
                                    <RenderTodoItem
                                        key={item.id}
                                        item={item}
                                        onPress={() => handleTaskPress(item)}
                                    />
                                ))}
                            </>
                        )}

                        {futureTasks.length > 0 && (
                            <>
                                {renderSectionHeader('未来待办')}
                                {displayedFutureTasks.map(item => (
                                    <RenderTodoItem
                                        key={item.id}
                                        item={item}
                                        onPress={() => handleTaskPress(item)}
                                    />
                                ))}
                                {renderLoadMoreIndicator()}
                            </>
                        )}
                    </ScrollView>
                ) : (
                    <TouchableOpacity
                        style={styles.emptyContainer}
                        activeOpacity={0.7}
                        onPress={handleAddTodoPress}
                    >
                        <Icon
                            name="checkmark-circle-2-outline"
                            style={styles.emptyIcon}
                            fill={theme['color-success-400']}
                        />
                        <Text category="h5" style={styles.emptyText}>
                            没有待办事项
                        </Text>
                        <Text category="p1" style={styles.emptySubtext}>
                            点击屏幕添加新的任务
                        </Text>
                    </TouchableOpacity>
                )}
            </Layout>

            {/* 任务详情模态框 */}
            <Modal
                visible={showDetail}
                backdropStyle={styles.backdrop}
                onBackdropPress={() => setShowDetail(false)}
            >
                {selectedTask && (
                    <TaskDetail
                        action={selectedTask.action}
                        plant={selectedTask.plant}
                        onClose={() => setShowDetail(false)}
                        onDelete={handleDelete}
                        onComplete={handleComplete}
                    />
                )}
            </Modal>
        </GradientBackground>
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
    content: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    listContainer: {
        padding: 16,
    },
    todoItem: {
        marginBottom: 12,
        borderRadius: 10,
        elevation: 2,
    },
    todoItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme['color-basic-200'],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    taskInfo: {
        flex: 1,
    },
    plantName: {
        color: theme['color-primary-600'],
    },
    taskName: {
        color: theme['color-basic-800'],
        marginVertical: 4,
    },
    taskRemark: {
        color: theme['color-basic-600'],
    },
    arrowIcon: {
        width: 20,
        height: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        marginBottom: 16,
    },
    emptyText: {
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        textAlign: 'center',
        color: theme['color-basic-600'],
    },
    loaderContainer: {
        padding: 16,
    },
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(2px)',
    },
    detailCard: {
        alignSelf: 'center',
        backgroundColor: theme['color-basic-100'],
        borderRadius: 20,
        elevation: 4,
        overflow: 'hidden',
    },
    detailContent: {
        padding: 20,
    },
    detailDate: {
        color: theme['color-primary-400'],
        fontWeight: 'bold',
        marginBottom: 16,
    },
    detailActionContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 4,
        marginBottom: 24,
    },
    detailAction: {
        fontSize: 16,
        lineHeight: 24,
    },
    boldText: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 10,
    },
    actionButton: {
        flex: 1,
        margin: 4,
    },
    completeForm: {
        marginTop: 16,
    },
    completeFormLabel: {
        marginBottom: 8,
        color: theme['color-basic-600'],
    },
    remarkInput: {
        marginBottom: 16,
    },
    imageViewerContainer: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    fullScreenImageContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 8,
    },
    rotationButtonsContainer: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        flexDirection: 'row',
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 4,
    },
    rotateButton: {
        padding: 8,
        marginHorizontal: 10,
    },
    fab: {
        position: 'absolute',
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        right: 20,
        bottom: 20,
        borderRadius: 28,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        zIndex: 100,
    },
    fabIcon: {
        width: 24,
        height: 24,
    },
    addTodoContent: {
        padding: 16,
    },
    addTodoTitle: {
        textAlign: 'center',
        marginBottom: 16,
        color: theme['color-primary-500'],
    },
    formLabel: {
        marginBottom: 4,
        color: theme['color-basic-600'],
    },
    formInput: {
        marginBottom: 16,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    headerIcon: {
        width: 24,
        height: 24,
    },
    formOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9,
        justifyContent: 'flex-end',
    },
    animatedFormContainer: {
        maxHeight: '90%',
        width: '100%',
    },
    formContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    formContentContainer: {
        padding: 24,
        paddingBottom: 40,
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    formHeaderFixed: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 24,
        paddingTop: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(143, 155, 179, 0.2)',
    },
    formScrollView: {
        flex: 1,
        maxHeight: '80%',
    },
    formScrollContent: {
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 40,
    },
    formContent: {
        flex: 1,
    },
    formTitle: {
        textAlign: 'center',
        flex: 1,
    },
    dragIndicator: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    input: {
        marginBottom: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
    submitButton: {
        marginBottom: 12,
    },
    cancelButton: {
        marginBottom: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
    },
    sectionHeader: {
        paddingVertical: 10,
        paddingHorizontal: 6,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(143, 155, 179, 0.2)',
    },
    sectionTitle: {
        color: theme['color-primary-500'],
    },
    loadMoreContainer: {
        padding: 16,
        alignItems: 'center',
    },
    loadMoreText: {
        color: theme['color-primary-500'],
    },
    switchContainer: {
        marginBottom: 16,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    toggleButton: {
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 32,
    },
    toggleActive: {
        backgroundColor: theme['color-primary-500'],
    },
    toggleInactive: {
        backgroundColor: 'transparent',
        borderColor: theme['color-primary-300'],
    },
    infoText: {
        marginTop: 4,
        marginBottom: 16,
        fontSize: 12,
        color: theme['color-basic-600'],
        fontStyle: 'italic',
    },
    titleContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
});

export default TodoPage;