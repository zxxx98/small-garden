import * as React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Text, Button, Select, SelectItem, Input, Icon, Spinner, IndexPath } from '@ui-kitten/components';
import { useTheme } from '../../theme/themeContext';
import { Action } from '@/types/action';
import { generateId } from '@/utils/uuid';
import * as ImagePicker from 'expo-image-picker';
import { fileManager } from '@/models/FileManager';
import SlideUpModal from '@/components/SlideUpModal';
import { showMessage } from "react-native-flash-message";
import { useRouter } from 'expo-router';
import { useAddAction } from '@/context/AddActionContext';
import PhotoSelectList from '@/components/PhotoSelectList';
import { rootStore } from '@/stores/RootStore';
import { IActionModel } from '@/stores/ActionStore';
import ImageViewer from '@/components/ImageViewer';
import { ITodoModel } from '@/stores/PlantStore';
import { calculateNextRemindTime } from '@/utils/plant';

// 图片查看器组件接口定义
interface ImageViewerProps {
    visible: boolean;    // 是否显示查看器
    imageUri: string;    // 图片URI
    onClose: () => void; // 关闭回调
}

// 图片查看器组件 - 用于全屏查看图片
const ImageViewerComponent = ({ visible, imageUri, onClose }: ImageViewerProps) => {
    const [rotation, setRotation] = React.useState(0);

    const rotateLeft = () => {
        setRotation((prevRotation) => (prevRotation - 90) % 360);
    };

    const rotateRight = () => {
        setRotation((prevRotation) => (prevRotation + 90) % 360);
    };

    if (!visible) return null;

    return (
        <View style={styles.imageViewerContainer}>
            <View style={styles.fullScreenImageContainer}>
                <Image
                    source={{ uri: imageUri }}
                    style={[styles.fullScreenImage, { transform: [{ rotate: `${rotation}deg` }] }]}
                    resizeMode="contain"
                />
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="close-outline" style={{ width: 24, height: 24 }} fill="white" />
            </TouchableOpacity>
            <View style={styles.rotationButtonsContainer}>
                <TouchableOpacity style={styles.rotateButton} onPress={rotateLeft}>
                    <Icon name="refresh-outline" style={{ width: 24, height: 24 }} fill="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.rotateButton} onPress={rotateRight}>
                    <Icon name="refresh-outline" style={{ width: 24, height: 24, transform: [{ scaleX: -1 }] }} fill="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const AddAction = () => {
    const plants = rootStore.plantStore.plants;
    const actionTypes = rootStore.settingStore.actionTypes;
    const [selectedPlantIndex, setSelectedPlantIndex] = React.useState<IndexPath | undefined>(undefined);
    const [selectedActionTypeIndex, setSelectedActionTypeIndex] = React.useState<IndexPath | undefined>(undefined);
    const [remark, setRemark] = React.useState('');
    const [images, setImages] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [selectedImage, setSelectedImage] = React.useState('');
    const [showImageViewer, setShowImageViewer] = React.useState(false);
    const { themeMode } = useTheme();
    const router = useRouter();
    const { visible, hide } = useAddAction();

    // 请求相机权限
    React.useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showMessage({
                    message: '需要相机权限才能拍照',
                    type: 'warning',
                    duration: 3000,
                });
            }
        })();
    }, []);

    // 提交行为
    const handleSubmit = async () => {
        if (!selectedPlantIndex || !selectedActionTypeIndex) {
            showMessage({
                message: '请选择植物和行为类型',
                type: 'warning',
                duration: 3000,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const selectedPlant = plants[selectedPlantIndex.row];
            const selectedActionType = actionTypes[selectedActionTypeIndex.row];

            // 上传图片
            const uploadedImages = await Promise.all(
                images.map(async (imageUri) => {
                    return await fileManager.saveImage(imageUri);
                })
            );

            // 创建行为
            const newAction: Action = {
                id: generateId(),
                name: selectedActionType.name,
                plantId: selectedPlant.id,
                time: Date.now(),
                remark: remark,
                imgs: uploadedImages
            };

            // 保存行为
            await rootStore.actionStore.addAction(newAction as IActionModel);
            //如果该植物的todo启用了改行为，则要刷新对应的todo
            const todo = selectedPlant.todos.find(t => t.actionName === newAction.name);
            if (todo) {
                //如果不是循环todo，则删除当前todo
                if (!todo.isRecurring) {
                    selectedPlant.deleteTodo(todo as ITodoModel);
                } else {
                    //如果是循环todo，则更新nextRemindTime
                    const nextRemindTime = calculateNextRemindTime(todo.recurringUnit, todo.recurringInterval);
                    selectedPlant.updateTodo({ ...todo, nextRemindTime: nextRemindTime } as ITodoModel);
                }
            }

            showMessage({
                message: '添加行为成功',
                type: 'success',
                duration: 3000,
            });

            // 关闭面板并重置表单
            hide();
            resetForm();

            // 导航到时间线页面
            router.push('/timelinePage');
        } catch (error) {
            console.error('添加行为失败:', error);
            showMessage({
                message: '添加行为失败',
                type: 'danger',
                duration: 3000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 重置表单
    const resetForm = () => {
        setSelectedPlantIndex(undefined);
        setSelectedActionTypeIndex(undefined);
        setRemark('');
        setImages([]);
    };

    // 关闭添加行为面板
    const closeAddActionModal = () => {
        hide();
        resetForm();
    };

    // 处理图片点击事件
    const handleImagePress = (imageUri: string) => {
        setSelectedImage(imageUri);
        setShowImageViewer(true);
    };

    return (
        <SlideUpModal
            visible={visible}
            onClose={closeAddActionModal}
            themeMode={themeMode}
            headerComponent={
                <View style={styles.modalHeader}>
                    <Text category="h6">添加行为</Text>
                </View>
            }
        >
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <Spinner size="large" />
                    <Text style={styles.loadingText}>加载中...</Text>
                </View>
            ) : (
                <View style={styles.formContainer}>
                    <Text category="s1" style={styles.label}>选择植物</Text>
                    <Select
                        style={styles.select}
                        placeholder="选择植物"
                        value={plants.length > 0 && selectedPlantIndex?.row !== undefined ? plants[selectedPlantIndex.row].name : ''}
                        selectedIndex={selectedPlantIndex}
                        onSelect={(index) => setSelectedPlantIndex(index as IndexPath)}
                    >
                        {plants.map((plant, index) => (
                            <SelectItem key={index} title={plant.name} />
                        ))}
                    </Select>

                    <Text category="s1" style={styles.label}>选择行为类型</Text>
                    <Select
                        style={styles.select}
                        placeholder="选择行为类型"
                        value={actionTypes.length > 0 && selectedActionTypeIndex?.row !== undefined ? actionTypes[selectedActionTypeIndex.row].name : ''}
                        selectedIndex={selectedActionTypeIndex}
                        onSelect={(index) => setSelectedActionTypeIndex(index as IndexPath)}
                    >
                        {actionTypes.map((type, index) => (
                            <SelectItem key={index} title={type.name} />
                        ))}
                    </Select>

                    <Text category="s1" style={styles.label}>备注</Text>
                    <Input
                        style={styles.input}
                        placeholder="添加备注..."
                        value={remark}
                        onChangeText={setRemark}
                        multiline
                        textStyle={{ minHeight: 64 }}
                    />

                    <Text category="s1" style={styles.label}>记录图片</Text>
                    <PhotoSelectList
                        photos={images}
                        onPhotosChange={setImages}
                        onPhotoPress={handleImagePress}
                    />

                    <View style={styles.buttonContainer}>
                        <Button
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                            accessoryLeft={isSubmitting ? (props) => <Spinner size="small" /> : undefined}
                        >
                            {isSubmitting ? '提交中...' : '提交'}
                        </Button>
                        <Button
                            appearance="outline"
                            status="basic"
                            onPress={closeAddActionModal}
                            style={styles.cancelButton}
                        >
                            取消
                        </Button>
                    </View>
                </View>
            )}

            <ImageViewer
                visible={showImageViewer}
                imageUri={selectedImage}
                onClose={() => setShowImageViewer(false)}
            />
        </SlideUpModal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        marginBottom: 20,
    },
    modalHeader: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    formContainer: {
        padding: 16,
    },
    label: {
        marginBottom: 8,
        marginTop: 16,
    },
    select: {
        marginBottom: 16,
    },
    input: {
        marginBottom: 16,
    },
    buttonContainer: {
        marginTop: 24,
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
        padding: 24,
    },
    loadingText: {
        marginTop: 16,
    },
    imageViewerContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1000,
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

export default AddAction;
