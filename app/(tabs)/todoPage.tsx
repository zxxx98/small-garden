import * as React from 'react';
import { StyleSheet, FlatList, Image, TouchableOpacity, View, Dimensions, Alert, ScrollView, Animated } from 'react-native';
import { Layout, Text, Card, Icon, Modal, Button, Input, IconProps, Spinner, Select, SelectItem, Datepicker, IndexPath } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import { Facebook } from 'react-content-loader/native';
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
import { BlurView } from 'expo-blur';
import { useFocusEffect } from 'expo-router';

interface ImageViewerProps
{
    visible: boolean;
    imageUri: string;
    onClose: () => void;
}

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

interface TaskDetailProps
{
    action: Action;
    plant: Plant;
    onClose: () => void;
    onDelete: (id: number) => void;
    onComplete: (action: Action) => void;
}

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

    const pickImage = async () =>
    {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("需要权限", "需要访问相册权限才能选择图片");
            return;
        }

        try {
            setLoading(true);
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                // Save the image using FileManager and get the stored URL
                const imageUri = result.assets[0].uri;

                const savedImageUrl = await fileManager.saveImage(imageUri);

                // Add the saved image URL to the images array
                const newImages = [...images, savedImageUrl];
                setImages(newImages);
            }
        } catch (error) {
            console.error("Error saving image:", error);
            Alert.alert("错误", "保存图片失败，请重试");
        } finally {
            setLoading(false);
        }
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
            Alert.alert("错误", "保存失败，请重试");
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
                        <View style={styles.imageContainer}>
                            {images.length > 0 && (
                                <FlatList
                                    style={{ width: '100%' }}
                                    data={images}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            onPress={() =>
                                            {
                                                setSelectedImage(item);
                                                setShowImageViewer(true);
                                            }}
                                        >
                                            <Image
                                                source={{ uri: item }}
                                                style={styles.thumbnailImage}
                                                resizeMode="cover"
                                            />
                                        </TouchableOpacity>
                                    )}
                                    keyExtractor={(item, index) => index.toString()}
                                    ItemSeparatorComponent={() => <View style={{ width: 5 }} />}
                                />
                            )}
                            <TouchableOpacity
                                style={styles.addImageButton}
                                onPress={pickImage}
                            >
                                <Icon name="plus-outline" style={{ width: 24, height: 24 }} />
                            </TouchableOpacity>
                        </View>

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
        return <TaskLoader />;
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

// 添加待办表单组件
interface TodoFormProps
{
    plants: Plant[];
    actionTypes: ActionType[];
    onSubmit: (formData: {
        plant: Plant;
        actionType: ActionType;
        date: Date;
        remark: string;
    }) => void;
    onCancel: () => void;
    themeMode: string;
}

const TodoForm = ({ plants, actionTypes, onSubmit, onCancel, themeMode }: TodoFormProps) =>
{
    const [selectedPlant, setSelectedPlant] = React.useState<Plant | null>(null);
    const [selectedActionType, setSelectedActionType] = React.useState<ActionType | null>(null);
    const [selectedActionTypeIndex, setSelectedActionTypeIndex] = React.useState<IndexPath>();
    const [todoDate, setTodoDate] = React.useState(new Date());
    const [todoRemark, setTodoRemark] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // 滑动动画值
    const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;

    // 组件挂载时启动滑上动画
    React.useEffect(() =>
    {
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 70,
            friction: 12
        }).start();
    }, []);

    const handleCancel = () =>
    {
        // 滑下动画
        Animated.timing(slideAnim, {
            toValue: Dimensions.get('window').height,
            duration: 300,
            useNativeDriver: true
        }).start(() =>
        {
            onCancel();
        });
    };

    const handleSubmitWithAnimation = () =>
    {
        if (!selectedPlant) {
            Alert.alert('错误', '请选择一个植物');
            return;
        }

        if (!selectedActionType) {
            Alert.alert('错误', '请选择一个待办类型');
            return;
        }

        // 滑下动画，然后提交
        Animated.timing(slideAnim, {
            toValue: Dimensions.get('window').height,
            duration: 300,
            useNativeDriver: true
        }).start(() =>
        {
            onSubmit({
                plant: selectedPlant,
                actionType: selectedActionType,
                date: todoDate,
                remark: todoRemark
            });
        });
    };

    const backgroundColor = themeMode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(43, 50, 65, 0.98)';
    const blurIntensity = themeMode === 'light' ? 50 : 80;

    return (
        <View style={styles.formOverlay}>
            {/* 模糊背景 */}
            <BlurView
                intensity={blurIntensity}
                tint={themeMode === 'light' ? 'light' : 'dark'}
                style={StyleSheet.absoluteFill}
            />

            <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={handleCancel}
            />

            <Animated.View
                style={[
                    styles.animatedFormContainer,
                    { transform: [{ translateY: slideAnim }] }
                ]}
            >
                <ScrollView
                    style={[styles.formContainer, { backgroundColor }]}
                    contentContainerStyle={styles.formContentContainer}
                >
                    <View style={styles.formHeader}>
                        <Text category="h5" style={styles.formTitle}>
                            添加待办事项
                        </Text>
                    </View>

                    {/* 拖动指示器 */}
                    <View style={styles.dragIndicator} />

                    <Text category='s1' style={styles.formLabel}>选择植物:</Text>
                    <Select
                        style={styles.input}
                        placeholder="选择植物"
                        value={selectedPlant?.name}
                        onSelect={(index) =>
                        {
                            const idx = index as IndexPath;
                            if (idx && idx.row !== undefined) {
                                setSelectedPlant(plants[idx.row]);
                            }
                        }}
                    >
                        {plants.map((plant) => (
                            <SelectItem key={plant.id} title={plant.name} />
                        ))}
                    </Select>

                    <Text category='s1' style={styles.formLabel}>选择待办类型:</Text>
                    <Select
                        style={styles.input}
                        placeholder="选择类型"
                        value={selectedActionType?.name}
                        selectedIndex={selectedActionTypeIndex}
                        onSelect={(index) =>
                        {
                            const idx = index as IndexPath;
                            if (idx && idx.row !== undefined) {
                                // Use a timeout to defer the state update outside of render cycle
                                setTimeout(() =>
                                {
                                    setSelectedActionTypeIndex(idx);
                                    setSelectedActionType(actionTypes[idx.row]);
                                }, 0);
                            }
                        }}
                    >
                        {actionTypes.map((type, index) => (
                            <SelectItem key={index.toString()} title={type.name} />
                        ))}
                    </Select>

                    <Text category='s1' style={styles.formLabel}>选择日期:</Text>
                    <Datepicker
                        style={styles.input}
                        date={todoDate}
                        onSelect={setTodoDate}
                        min={new Date()}
                    />

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
                        onPress={handleSubmitWithAnimation}
                        style={styles.submitButton}
                        accessoryLeft={isSubmitting ? (props) => <Spinner size="small" /> : undefined}
                        disabled={isSubmitting || !selectedPlant || !selectedActionType}
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
                </ScrollView>
            </Animated.View>
        </View>
    );
};

const TodoPage = () =>
{
    const [todoItems, setTodoItems] = React.useState<Action[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedTask, setSelectedTask] = React.useState<{ action: Action, plant: Plant } | null>(null);
    const [showDetail, setShowDetail] = React.useState(false);
    const { themeMode } = useTheme();

    // 新的状态变量
    const [showAddTodo, setShowAddTodo] = React.useState(false);
    const [plants, setPlants] = React.useState<Plant[]>([]);
    const [actionTypes, setActionTypes] = React.useState<ActionType[]>([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const loadData = React.useCallback(() =>
    {
        loadTodoItems();
        loadPlantsAndActionTypes();
    }, []);

    useFocusEffect(loadData);

    const loadTodoItems = async () =>
    {
        setLoading(true);
        try {
            const actions = await ActionManager.getAllActions();
            const pendingActions = actions.filter(action => !action.done);
            setTodoItems(pendingActions);
        } catch (error) {
            console.error("Error loading todo items:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadPlantsAndActionTypes = async () =>
    {
        try {
            // 加载所有植物
            const allPlants = await PlantManager.getAllPlants();
            setPlants(allPlants.filter(plant => !plant.isDead)); // 排除死亡的植物

            // 加载行为类型
            const types = await ConfigManager.getInstance().getActionTypes();
            setActionTypes(types);
        } catch (error) {
            console.error("Error loading plants or action types:", error);
        }
    };

    const handleDelete = async (id: number) =>
    {
        try {
            await ActionManager.deleteAction(id);
            // Update the local state to remove the deleted item
            setTodoItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error("Error deleting task:", error);
            Alert.alert("错误", "删除失败，请重试");
        }
    };

    const handleComplete = async (updatedAction: Action) =>
    {
        try {
            await ActionManager.updateAction(updatedAction);
            // Remove from todo list since it's now completed
            setTodoItems(prev => prev.filter(item => item.id !== updatedAction.id));
        } catch (error) {
            console.error("Error completing task:", error);
            throw error; // Let the calling component handle the error
        }
    };

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

    const handleAddTodo = async (formData: {
        plant: Plant;
        actionType: ActionType;
        date: Date;
        remark: string;
    }) =>
    {
        setIsSubmitting(true);

        try {
            // 创建新的待办事项，使用时间戳作为唯一ID
            const newAction: Action = {
                id: Date.now(),
                name: formData.actionType.name,
                plantId: formData.plant.id,
                time: formData.date.getTime(),
                remark: formData.remark,
                imgs: [],
                done: false
            };

            // 保存新待办
            await ActionManager.addAction(newAction);

            // 刷新待办列表
            await loadTodoItems();

            // 关闭表单
            setShowAddTodo(false);

            Alert.alert('成功', '待办事项已添加');
        } catch (error) {
            console.error("Error adding todo:", error);
            Alert.alert('错误', '添加待办事项失败，请重试');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <LinearGradient
            colors={themeMode === 'light'
                ? ['#F5F5F5', '#FFF3E0', '#F5F5F5']
                : ['#222B45', '#1A2138', '#222B45']}
            style={styles.container}
        >
            <Layout style={styles.header}>
                <Text category="h1">今日待办</Text>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setShowAddTodo(true)}
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
                    <View style={styles.loaderContainer}>
                        <TaskLoader />
                        <TaskLoader />
                        <TaskLoader />
                    </View>
                ) : todoItems.length > 0 ? (
                    <FlatList
                        data={todoItems}
                        renderItem={(prop) =>
                        {
                            return <RenderTodoItem onPress={() =>
                            {
                                handleTaskPress(prop.item);
                            }} {...prop} />
                        }}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContainer}
                    />
                ) : (
                    <TouchableOpacity
                        style={styles.emptyContainer}
                        activeOpacity={0.7}
                        onPress={() => setShowAddTodo(true)}
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

            {/* 添加待办表单 - 只在showAddTodo为true时渲染 */}
            {showAddTodo && (
                <TodoForm
                    plants={plants}
                    actionTypes={actionTypes}
                    onSubmit={handleAddTodo}
                    onCancel={() => setShowAddTodo(false)}
                    themeMode={themeMode}
                />
            )}
        </LinearGradient>
    );
};

const TaskLoader = () => (
    <Facebook />
);

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
        maxHeight: '85%',
        borderRadius: 16,
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
    imageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        alignItems: 'center',
    },
    thumbnailImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    addImageButton: {
        width: 80,
        height: 80,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme['color-basic-400'],
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme['color-basic-200'],
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
});

export default TodoPage;