import * as React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Button, Select, SelectItem, Input, Spinner, IndexPath } from '@ui-kitten/components';
import { useTheme } from '../theme/themeContext';
import { Action } from '@/types/action';
import { generateId } from '@/utils/uuid';
import SlideUpModal from '@/components/SlideUpModal';
import { showMessage } from "react-native-flash-message";
import { useRouter } from 'expo-router';
import { rootStore } from '@/stores/RootStore';
import { IActionModel } from '@/stores/ActionStore';
import { ITodoModel } from '@/stores/PlantStore';
import { calculateNextRemindTime } from '@/utils/plant';
import { useActionCompletion } from '@/context/ActionCompletionContext';
import PhotoSelectList from '@/components/PhotoSelectList';
import { fileManager } from '@/models/FileManager';
import ImageViewer from '@/components/ImageViewer';

const ActionCompletionPanel = () => {
  const plants = rootStore.plantStore.plants;
  const actionTypes = rootStore.settingStore.actionTypes;
  const [selectedPlantIndex, setSelectedPlantIndex] = React.useState<IndexPath | undefined>(undefined);
  const [selectedActionTypeIndex, setSelectedActionTypeIndex] = React.useState<IndexPath | undefined>(undefined);
  const [remark, setRemark] = React.useState('');
  const [images, setImages] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState('');
  const [showImageViewer, setShowImageViewer] = React.useState(false);
  const { themeMode } = useTheme();
  const router = useRouter();
  const { visible, hide, todo } = useActionCompletion();

  React.useEffect(() => {
    if (todo) {
      console.log('todo', todo);
      setSelectedPlantIndex(new IndexPath(plants.findIndex(p => p.id === todo.plantId)));
      setSelectedActionTypeIndex(new IndexPath(actionTypes.findIndex(t => t.name === todo.actionName)));
    }
  }, [todo]);

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
      };
      // 保存行为
      await rootStore.actionStore.addAction(newAction as IActionModel);
      
      // 如果该植物的todo启用了该行为，则要处理对应的todo
      const todo = selectedPlant.todos.find(t => t.actionName === newAction.name);
      if (todo) {
        // 如果不是循环todo，则删除当前todo
        if (!todo.isRecurring) {
          selectedPlant.deleteTodo(todo as ITodoModel);
        } else {
          // 如果是循环todo，则更新nextRemindTime
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
  const closePanel = () => {
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
      onClose={closePanel}
      themeMode={themeMode}
      headerComponent={
        <View style={styles.modalHeader}>
          <Text category="h6">完成行为</Text>
        </View>
      }
    >
      <View style={styles.formContainer}>
        <Text category="s1" style={styles.label}>选择植物</Text>
        <Select
          style={styles.select}
          placeholder="选择植物"
          value={selectedPlantIndex?.row !== undefined ? plants[selectedPlantIndex.row].name : ''}
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

        <Text category="s1" style={styles.label}>简介</Text>
        <Input
          style={styles.input}
          placeholder="添加简介..."
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
            onPress={closePanel}
            style={styles.cancelButton}
          >
            取消
          </Button>
        </View>
      </View>

      <ImageViewer
        visible={showImageViewer}
        imageUri={selectedImage}
        onClose={() => setShowImageViewer(false)}
      />
    </SlideUpModal>
  );
};

const styles = StyleSheet.create({
  modalHeader: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    padding: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  select: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  submitButton: {
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default ActionCompletionPanel;