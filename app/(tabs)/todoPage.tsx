import * as React from 'react';
import { StyleSheet, TouchableOpacity, View, Dimensions, ScrollView, Image } from 'react-native';
import { Layout, Text, Card, Icon, Modal, Button, Input, Spinner, Select, SelectItem, Datepicker, IndexPath, Toggle } from '@ui-kitten/components';
import { Action, ActionType } from '@/types/action';
import { Plant } from '@/types/plant';
import { theme } from '@/theme/theme';
import { getActionIconAsync } from '@/utils/action';
import { useTheme } from '../../theme/themeContext';
import SlideUpModal from '@/components/SlideUpModal';
import { showMessage } from "react-native-flash-message";
import { useRouter } from 'expo-router';
import GradientBackground from '@/components/GradientBackground';
import { rootStore } from '@/stores/RootStore';
import { ITodoModel } from '@/stores/PlantStore';
import { observer } from 'mobx-react-lite';
import { useActionCompletion } from '@/context/ActionCompletionContext';


// 待办事项列表项渲染组件 - 显示单个待办事项
const RenderTodoItem = ({ item, onPress }: { item: ITodoModel, onPress: () => void }) => {
    const { themeMode } = useTheme();
    const [iconData, setIconData] = React.useState<React.ReactNode>(null);
    React.useEffect(() => {
        getActionIconAsync(item.actionName).then(setIconData);
    }, [item.actionName]);
    const cardStyle = [
        styles.todoItem,
        { backgroundColor: themeMode === 'light' ? '#FFFFFF' : '#2E3A59' }
    ];
    const iconContainerStyle = [
        styles.iconContainer,
        { backgroundColor: themeMode === 'light' ? '#F7F9FC' : '#1A2138' }
    ];
    return (
        <TouchableOpacity>
            <Card style={cardStyle} onPress={onPress}>
                <View style={styles.todoItemContent}>
                    <View style={iconContainerStyle}>
                        {iconData}
                    </View>
                    <View style={styles.taskInfo}>
                        <Text category="h6" style={styles.plantName}>
                            {item.plant.name}
                        </Text>
                        <Text category="s1" style={styles.taskName}>
                            {item.actionName}
                        </Text>
                        {item ? (
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
interface TodoFormProps {
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
const TodoForm = ({ plants, actionTypes, onSubmit, onCancel, themeMode }: TodoFormProps) => {
    const [selectedPlantIndex, setSelectedPlantIndex] = React.useState<IndexPath>();
    const [selectedActionTypeIndex, setSelectedActionTypeIndex] = React.useState<IndexPath>();
    const [todoDate, setTodoDate] = React.useState(new Date());
    const [todoRemark, setTodoRemark] = React.useState('');
    const [isRecurring, setIsRecurring] = React.useState(false);  // 是否为循环任务
    const [recurringInterval, setRecurringInterval] = React.useState(1);  // 循环间隔天数，默认为1（每天）
    const [recurringIntervalIndex, setRecurringIntervalIndex] = React.useState(new IndexPath(0));  // 循环间隔的索引
    const [recurringStartDate, setRecurringStartDate] = React.useState(new Date());  // 循环开始日期
    const [recurringEndDate, setRecurringEndDate] = React.useState(() => {
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
    React.useEffect(() => {
        if (selectedPlantIndex) {
            setTodoDate(new Date());
            setTodoRemark('');
        }
    }, [selectedPlantIndex]);

    const handleSubmit = () => {
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

    const items = React.useMemo(() => {
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
                    onSelect={(index) => {
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

// 空状态组件
const EmptyState = () => {
    const { themeMode } = useTheme();
    return (
        <View style={styles.emptyContainer}>
            <Image
                source={require('@/assets/images/todofinish.png')}
                style={styles.emptyIcon}
                resizeMode="contain"
            />
            <Text category="h6" style={[styles.emptyText, { color: themeMode === 'light' ? theme['color-basic-800'] : theme['color-basic-100'] }]}>
                暂无待办事项
            </Text>
            <Text category="p1" style={[styles.emptySubtext, { color: themeMode === 'light' ? theme['color-basic-600'] : theme['color-basic-400'] }]}>
                非常棒，你已经完成了所有待办事项！
            </Text>
        </View>
    );
};

// 主页面组件 - 待办事项管理页面
const TodoPage = observer(() => {
    // 状态管理
    const { themeMode } = useTheme(); // 主题模式
    const router = useRouter(); // 路由

    const { show } = useActionCompletion();

    // 滚动视图引用，用于监听滚动事件
    const scrollViewRef = React.useRef<ScrollView>(null);


    // 处理任务点击事件
    const handleTaskPress = async (todo: ITodoModel) => {
        show(todo);
    };


    // 渲染分区标题
    const renderSectionHeader = (title: string) => (
        <View style={styles.sectionHeader}>
            <Text category="h6" style={styles.sectionTitle}>{title}</Text>
        </View>
    );

    return (
        <GradientBackground
            colors={themeMode === 'light'
                ? ['#F5F5F5', '#E8F5E9', '#F5F5F5']
                : ['#222B45', '#1A2138', '#222B45']}
            style={styles.container}
        >
            <Layout style={styles.header}>
                <Text category="h1">待办</Text>
            </Layout>
            <Layout style={styles.content}>
                {(
                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={styles.listContainer}
                        scrollEventThrottle={400}
                    >
                        {rootStore.plantStore.separateTodoItems.todayItems.length === 0 &&
                         rootStore.plantStore.separateTodoItems.tomorrowItems.length === 0 &&
                         rootStore.plantStore.separateTodoItems.afterTomorrowItems.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <>
                                {rootStore.plantStore.separateTodoItems.todayItems.length > 0 && (
                                    <>
                                        {renderSectionHeader('今日待办')}
                                        {rootStore.plantStore.separateTodoItems.todayItems.map((item, index) => (
                                            <RenderTodoItem
                                                key={index}
                                                item={item}
                                                onPress={() => handleTaskPress(item)}
                                            />
                                        ))}
                                    </>
                                )}

                                {rootStore.plantStore.separateTodoItems.tomorrowItems.length > 0 && (
                                    <>
                                        {renderSectionHeader('明日待办')}
                                        {rootStore.plantStore.separateTodoItems.tomorrowItems.map((item, index) => (
                                            <RenderTodoItem
                                                key={index}
                                                item={item}
                                                onPress={() => handleTaskPress(item)}
                                            />
                                        ))}
                                    </>
                                )}

                                {rootStore.plantStore.separateTodoItems.afterTomorrowItems.length > 0 && (
                                    <>
                                        {renderSectionHeader('后日待办')}
                                        {rootStore.plantStore.separateTodoItems.afterTomorrowItems.map((item, index) => (
                                            <RenderTodoItem
                                                key={index}
                                                item={item}
                                                onPress={() => handleTaskPress(item)}
                                            />
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                    </ScrollView>
                )}
            </Layout>
        </GradientBackground>
    );
});

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
        minHeight: 400,
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