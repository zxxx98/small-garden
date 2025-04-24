import * as React from 'react';
import { StyleSheet, View, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Text, Button, Select, SelectItem, Input, Icon, Spinner, IndexPath } from '@ui-kitten/components';
import { useTheme } from '../../theme/themeContext';
import { PlantManager } from '@/models/PlantManager';
import { ActionManager } from '@/models/ActionManager';
import { Plant } from '@/types/plant';
import { Action } from '@/types/action';
import { ConfigManager } from '@/models/ConfigManager';
import { ActionType } from '@/types/action';
import { generateId } from '@/utils/uuid';
import * as ImagePicker from 'expo-image-picker';
import { fileManager } from '@/models/FileManager';
import SlideUpModal from '@/components/SlideUpModal';
import { showMessage } from "react-native-flash-message";
import { useRouter } from 'expo-router';
import { useAddAction } from '@/context/AddActionContext';

const AddActionPage = () => {
    const [plants, setPlants] = React.useState<Plant[]>([]);
    const [actionTypes, setActionTypes] = React.useState<ActionType[]>([]);
    const [selectedPlantIndex, setSelectedPlantIndex] = React.useState<IndexPath | undefined>(undefined);
    const [selectedActionTypeIndex, setSelectedActionTypeIndex] = React.useState<IndexPath | undefined>(undefined);
    const [remark, setRemark] = React.useState('');
    const [images, setImages] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const { themeMode } = useTheme();
    const router = useRouter();
    const { visible, hide } = useAddAction();

    // 加载植物和行为类型
    React.useEffect(() => {
        if (visible) {
            loadData();
        }
    }, [visible]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // 加载植物
            const plantsData = await PlantManager.getAllPlants();
            setPlants(plantsData);

            // 加载行为类型
            const actionTypesData = await ConfigManager.getInstance().getActionTypes();
            setActionTypes(actionTypesData);
        } catch (error) {
            console.error('加载数据失败:', error);
            showMessage({
                message: '加载数据失败',
                type: 'danger',
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 选择图片
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const newImageUri = result.assets[0].uri;
                setImages([...images, newImageUri]);
            }
        } catch (error) {
            console.error('选择图片失败:', error);
            showMessage({
                message: '选择图片失败',
                type: 'danger',
                duration: 3000,
            });
        }
    };

    // 删除图片
    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
    };

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
                imgs: uploadedImages,
                done: true, // 直接标记为完成
            };

            // 保存行为
            await ActionManager.addAction(newAction);

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

    // 渲染图片预览
    const renderImagePreview = () => {
        if (images.length === 0) {
            return (
                <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                    <Icon name="image-outline" style={styles.addImageIcon} fill="#8F9BB3" />
                    <Text category="c1">添加图片</Text>
                </TouchableOpacity>
            );
        }

        return (
            <View style={styles.imagesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {images.map((uri, index) => (
                        <View key={index} style={styles.imageItem}>
                            <Image source={{ uri }} style={styles.imagePreview} />
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => removeImage(index)}
                            >
                                <Icon name="close-circle" fill="#FF3D71" style={styles.removeImageIcon} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
                {images.length < 9 && (
                    <TouchableOpacity style={styles.addMoreImageButton} onPress={pickImage}>
                        <Icon name="plus-outline" style={styles.addImageIcon} fill="#8F9BB3" />
                    </TouchableOpacity>
                )}
            </View>
        );
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
                        value={plants[selectedPlantIndex?.row ?? 0].name}
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
                        value={actionTypes[selectedActionTypeIndex?.row ?? 0].name}
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
                    {renderImagePreview()}

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
    addImageButton: {
        height: 120,
        borderWidth: 1,
        borderColor: '#E4E9F2',
        borderStyle: 'dashed',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    addImageIcon: {
        width: 32,
        height: 32,
        marginBottom: 8,
    },
    imagesContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    imageItem: {
        marginRight: 8,
        position: 'relative',
    },
    imagePreview: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    removeImageIcon: {
        width: 24,
        height: 24,
    },
    addMoreImageButton: {
        width: 100,
        height: 100,
        borderWidth: 1,
        borderColor: '#E4E9F2',
        borderStyle: 'dashed',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AddActionPage;
