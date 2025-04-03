import * as React from 'react';
import { StyleSheet, FlatList, Image, TouchableOpacity, View, Dimensions, Alert, ScrollView } from 'react-native';
import { Layout, Text, Card, Icon, Modal, Button, Input, IconProps, Spinner } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import ContentLoader from 'react-content-loader';
import { ActionManager } from '@/models/ActionManager';
import { PlantManager } from '@/models/PlantManager';
import { Action } from '@/types/action';
import { Plant } from '@/types/plant';
import { theme } from '@/theme/theme';
import { getIconAndColor } from '@/utils/action';
import * as ImagePicker from 'expo-image-picker';
import { fileManager } from '@/models/FileManager';

interface ImageViewerProps {
    visible: boolean;
    imageUri: string;
    onClose: () => void;
}

const ImageViewer = ({ visible, imageUri, onClose }: ImageViewerProps) => {
    const [rotation, setRotation] = React.useState(0);

    const rotateLeft = () => {
        setRotation((prev) => (prev - 90) % 360);
    };

    const rotateRight = () => {
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

interface TaskDetailProps {
    action: Action;
    plant: Plant;
    onClose: () => void;
    onDelete: (id: number) => void;
    onComplete: (action: Action) => void;
}

const TaskDetail = ({ action, plant, onClose, onDelete, onComplete }: TaskDetailProps) => {
    const screenWidth = Dimensions.get('window').width;
    const [isCompleting, setIsCompleting] = React.useState(false);
    const [remark, setRemark] = React.useState(action.remark || '');
    const [images, setImages] = React.useState<string[]>(action.imgs || []);
    const [selectedImage, setSelectedImage] = React.useState('');
    const [showImageViewer, setShowImageViewer] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const date = new Date(Number(action.time));

    const handleDelete = () => {
        Alert.alert(
            "删除待办",
            "确定要删除这个待办事项吗？",
            [
                { text: "取消", style: "cancel" },
                { 
                    text: "删除", 
                    style: "destructive",
                    onPress: () => {
                        onDelete(action.id);
                        onClose();
                    }
                }
            ]
        );
    };

    const pickImage = async () => {
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

    const handleComplete = async () => {
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
        <Card style={[styles.detailCard, { width: screenWidth * 0.8 }]}>
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
                                            onPress={() => {
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

const RenderTodoItem = ({ item ,onPress }: { item: Action,onPress:()=>void }) => {
    const [plant, setPlant] = React.useState<Plant | null>(null);
    
    React.useEffect(() => {
        PlantManager.getPlant(item.plantId).then(setPlant);
    }, [item.plantId]);

    const iconData = getIconAndColor(item.name);
    
    if (!plant) {
        return <TaskLoader />;
    }
    
    return (
        <TouchableOpacity>
            <Card style={styles.todoItem} onPress={onPress}>
                <View style={styles.todoItemContent}>
                    <View style={styles.iconContainer}>
                        <Icon 
                            name={iconData.iconName} 
                            style={styles.taskIcon} 
                            fill={iconData.color} 
                            pack={iconData.pack}
                        />
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

const TodoPage = () => {
    const [todoItems, setTodoItems] = React.useState<Action[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedTask, setSelectedTask] = React.useState<{action: Action, plant: Plant} | null>(null);
    const [showDetail, setShowDetail] = React.useState(false);

    React.useEffect(() => {
        loadTodoItems();
    }, []);

    const loadTodoItems = async () => {
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

    const handleDelete = async (id: number) => {
        try {
            await ActionManager.deleteAction(id);
            // Update the local state to remove the deleted item
            setTodoItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error("Error deleting task:", error);
            Alert.alert("错误", "删除失败，请重试");
        }
    };

    const handleComplete = async (updatedAction: Action) => {
        try {
            await ActionManager.updateAction(updatedAction);
            // Remove from todo list since it's now completed
            setTodoItems(prev => prev.filter(item => item.id !== updatedAction.id));
        } catch (error) {
            console.error("Error completing task:", error);
            throw error; // Let the calling component handle the error
        }
    };

    const handleTaskPress = async (action: Action) => {
        try {
            const plant = await PlantManager.getPlant(action.plantId);
            if (plant) {
                setSelectedTask({action, plant});
                setShowDetail(true);
            }
        } catch (error) {
            console.error("Error getting plant details:", error);
        }
    };

    return (
        <LinearGradient
            colors={['#F5F5F5', '#FFF3E0', '#F5F5F5']}
            style={styles.container}
        >
            <Layout style={styles.header}>
                <Text category="h1">今日待办</Text>
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
                        renderItem={(prop)=>{
                            return <RenderTodoItem onPress={()=>{
                                handleTaskPress(prop.item);
                            }} {...prop} />
                        }}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContainer}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Icon 
                            name="checkmark-circle-2-outline" 
                            style={styles.emptyIcon} 
                            fill={theme['color-success-400']}
                        />
                        <Text category="h5" style={styles.emptyText}>
                            没有待办事项
                        </Text>
                        <Text category="p1" style={styles.emptySubtext}>
                            休息一下或添加新的任务吧
                        </Text>
                    </View>
                )}
            </Layout>

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
        </LinearGradient>
    );
};

const TaskLoader = () => (
    <ContentLoader
        height={90}
        backgroundColor="#f5f5f5"
        foregroundColor="#dbdbdb"
        style={styles.todoItem}
    >
        <circle cx="35" cy="45" r="25" />
        <rect x="80" y="15" rx="4" ry="4" width="100" height="20" />
        <rect x="80" y="45" rx="4" ry="4" width="150" height="15" />
        <rect x="80" y="70" rx="3" ry="3" width="120" height="10" />
    </ContentLoader>
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
    taskIcon: {
        width: 24,
        height: 24,
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
});

export default TodoPage;