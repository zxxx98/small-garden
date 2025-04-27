import * as React from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Layout, Text, Button, Input, Select, SelectItem, Icon, IconProps, IndexPath, Spinner, Toggle } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Plant } from '@/types/plant';
import { Action, ActionType } from '@/types/action';
import { generateId } from '@/utils/uuid';
import { ConfigManager } from '@/models/ConfigManager';
import { useTheme } from '../theme/themeContext';
import { theme } from '@/theme/theme';
import { showMessage } from "react-native-flash-message";
import { observer } from 'mobx-react-lite';
import { rootStore } from '@/stores/RootStore';
import { ActionManager } from '@/models/ActionManager';
import { PlantManager } from '@/models/PlantManager';
import LoadingModal from '@/components/LoadingModal';
import Datepicker from '@/components/Datepicker';
import PageHeader from '../components/PageHeader';

const TodoEditPage = observer(() => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { themeMode } = useTheme();
  
  // 从路由参数中获取待办ID，如果有则为编辑模式
  const todoId = params.id as string | undefined;
  const editingTodo = todoId ? rootStore.actionStore.actions.find(a => a.id === todoId) : null;
  
  // 状态管理
  const [plants, setPlants] = React.useState<Plant[]>([]);
  const [actionTypes, setActionTypes] = React.useState<ActionType[]>([]);
  const [selectedPlantIndex, setSelectedPlantIndex] = React.useState<IndexPath>();
  const [selectedActionTypeIndex, setSelectedActionTypeIndex] = React.useState<IndexPath>();
  const [todoDate, setTodoDate] = React.useState(new Date());
  const [todoRemark, setTodoRemark] = React.useState('');
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [recurringInterval, setRecurringInterval] = React.useState(1);
  const [recurringIntervalIndex, setRecurringIntervalIndex] = React.useState(new IndexPath(0));
  const [recurringStartDate, setRecurringStartDate] = React.useState(new Date());
  const [recurringEndDate, setRecurringEndDate] = React.useState(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    return endDate;
  });
  const [loading, setLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // 加载植物和操作类型数据
  const loadPlantsAndActionTypes = async () => {
    try {
      setLoading(true);
      // 加载所有植物
      const allPlants = await PlantManager.getAllPlants();
      setPlants(allPlants.filter(plant => !plant.isDead)); // 排除死亡的植物

      // 加载行为类型
      const types = await ConfigManager.getInstance().getActionTypes();
      setActionTypes(types);

      // 如果是编辑模式，设置初始值
      if (editingTodo) {
        const plantIndex = allPlants.findIndex(p => p.id === editingTodo.plantId);
        if (plantIndex !== -1) {
          setSelectedPlantIndex(new IndexPath(plantIndex));
        }

        const actionTypeIndex = types.findIndex(t => t.name === editingTodo.name);
        if (actionTypeIndex !== -1) {
          setSelectedActionTypeIndex(new IndexPath(actionTypeIndex));
        }

        setTodoDate(new Date(Number(editingTodo.time)));
        setTodoRemark(editingTodo.remark || '');
        
        if (editingTodo.isRecurring) {
          setIsRecurring(true);
          setRecurringInterval(editingTodo.recurringInterval || 1);
          setRecurringIntervalIndex(new IndexPath(editingTodo.recurringInterval ? editingTodo.recurringInterval - 1 : 0));
        }
      }
    } catch (error) {
      console.error("Error loading plants or action types:", error);
      showMessage({
        message: "加载数据失败，请重试",
        duration: 1000,
        type: "warning"
      });
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  React.useEffect(() => {
    loadPlantsAndActionTypes();
  }, []);

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

  // 创建循环任务
  const createRecurringTasks = async (baseAction: Action, recurringInterval: number, recurringPeriod: number) => {
    const tasks: Action[] = [];
    const maxDays = recurringPeriod; // 使用自定义的天数
    const startDate = new Date(baseAction.time);

    // 创建指定天数内所有的循环任务
    for (let i = 0; i < maxDays; i += recurringInterval) {
      const taskDate = new Date(startDate);
      taskDate.setDate(startDate.getDate() + i);

      // 创建新的待办事项
      const newAction: Action = {
        ...baseAction,
        id: i === 0 ? baseAction.id : generateId(), // 原始任务保持ID不变，其他任务生成新ID
        time: taskDate.getTime(),
        parentRecurringId: i === 0 ? undefined : baseAction.id, // 第一个任务是父任务
      };
      tasks.push(newAction);
    }

    return tasks;
  };

  // 处理提交
  const handleSubmit = async () => {
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

    setIsSubmitting(true);

    try {
      // 创建基础待办事项
      const baseAction: Action = {
        id: editingTodo?.id || generateId(),
        name: actionTypes[selectedActionTypeIndex.row].name,
        plantId: plants[selectedPlantIndex.row].id,
        time: todoDate.getTime(),
        remark: todoRemark,
        imgs: editingTodo?.imgs || [],
        done: editingTodo?.done || false,
        isRecurring: isRecurring,
        recurringInterval: isRecurring ? recurringIntervalOptions[recurringIntervalIndex.row].value : undefined
      };

      if (isRecurring) {
        // 计算开始日期和结束日期之间的天数
        const startDate = new Date(recurringStartDate);
        const endDate = new Date(recurringEndDate);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include end date

        // 使用计算的天数和开始日期创建循环任务
        baseAction.time = startDate.getTime(); // 使用指定的开始日期
        const recurringTasks = await createRecurringTasks(baseAction, recurringIntervalOptions[recurringIntervalIndex.row].value, diffDays);

        try {
          // 如果是编辑模式，先删除原有的循环任务
          if (editingTodo) {
            // 这里需要实现删除原有循环任务的逻辑
            // 可以通过parentRecurringId查找并删除
          }

          // 批量保存所有循环任务
          for (const task of recurringTasks) {
            if (task.id === baseAction.id) {
              // 更新现有任务
              await ActionManager.updateAction(task);
            } else {
              // 添加新任务
              await ActionManager.addAction(task);
            }
          }

          showMessage({
            message: `已创建${recurringTasks.length}个循环待办事项`,
            duration: 1000,
            type: "success"
          });
        } catch (error: any) {
          console.error("Error adding recurring tasks:", error);
          throw error;
        }
      } else {
        // 保存单个待办
        if (editingTodo) {
          await ActionManager.updateAction(baseAction);
        } else {
          await ActionManager.addAction(baseAction);
        }

        showMessage({
          message: editingTodo ? '待办事项已更新' : '待办事项已添加',
          duration: 1000,
          type: "success"
        });
      }

      // 返回上一页
      router.back();
    } catch (error) {
      console.error("Error saving todo:", error);
      showMessage({
        message: '保存待办事项失败，请重试',
        duration: 1000,
        type: "warning"
      });
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
      <PageHeader 
        title={editingTodo ? '编辑待办' : '添加待办'}
        onBack={() => router.back()}
        onSave={handleSubmit}
        isSubmitting={isSubmitting}
        themeMode={themeMode}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <Spinner size='large' />
          <Text category='s1' style={styles.loadingText}>加载中...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <Text category='s1' style={styles.formLabel}>选择植物:</Text>
          <Select
            style={styles.input}
            placeholder="选择植物"
            value={selectedPlantIndex !== undefined ? plants[selectedPlantIndex.row].name : ''}
            selectedIndex={selectedPlantIndex}
            onSelect={(index) => {
              const idx = index as IndexPath;
              setSelectedPlantIndex(idx);
            }}
          >
            {plants.map((plant, index) => (
              <SelectItem key={index.toString()} title={plant.name} />
            ))}
          </Select>

          <Text category='s1' style={styles.formLabel}>选择待办类型:</Text>
          <Select
            style={styles.input}
            placeholder="选择类型"
            value={selectedActionTypeIndex !== undefined ? actionTypes[selectedActionTypeIndex.row].name : ''}
            selectedIndex={selectedActionTypeIndex}
            onSelect={(index) => {
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
                style={styles.toggle}
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
                onSelect={(index) => {
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
        </ScrollView>
      )}

      {/* LoadingModal for static method rendering */}
      <LoadingModal />
    </LinearGradient>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  formLabel: {
    marginBottom: 4,
    color: theme['color-basic-600'],
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
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
  toggle: {
    marginLeft: 8,
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
});

export default TodoEditPage; 