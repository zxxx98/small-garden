import * as React from 'react';
import { FlatList, Image, StyleSheet, View, Dimensions, TouchableOpacity } from 'react-native';
import { Layout, Text, Card, Icon, RangeCalendar, CalendarRange, Button, Modal, IconProps } from '@ui-kitten/components';
import Timeline from '../../components/Timeline';
import { theme } from '@/theme/theme';
import { Action } from '@/types/action';
import { PlantManager } from '@/models/PlantManager';
import { Plant } from '@/types/plant';
import { ActionManager } from '@/models/ActionManager';
import { useTheme } from '../../theme/themeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import GradientBackground from '@/components/GradientBackground';

// Create a separate TimelineContent component to handle plant loading
const TimelineContent = React.memo(({ data, onContentClick }: {
    data: Action,
    onContentClick: (action: Action, plant: Plant) => void
}) =>
{
    const [plant, setPlant] = React.useState<Plant | null>(null);

    React.useEffect(() =>
    {
        PlantManager.getPlant(data.plantId).then((plant) =>
        {
            setPlant(plant);
        });
    }, [data.plantId]);
    return (
        <View>
            <Card style={styles.customContent} onPress={() =>
            {
                if (plant) {
                    onContentClick(data, plant);
                }
            }}>
                {plant ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 90, flex: 1 }}>
                        <Image
                            source={{ uri: plant.img }}
                            style={{ width: 76, height: 76, borderRadius: 38, marginRight: 10, flexShrink: 0 }}
                        />
                        <View style={{ flex: 1, paddingLeft: 10, paddingTop: 10 }}>
                            <Text category='p1' style={styles.contentText} numberOfLines={1}>🌱 {plant?.name}</Text>
                            {/* <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {getActionIcon(data.name)}
                            </View> */}
                            <Text category='p1' style={styles.contentText} numberOfLines={1}>🙌 {data.name}</Text>
                            <Text category='p1' style={styles.contentText} numberOfLines={2}>{data.remark ? `🎉 ${data.remark}` : ""}</Text>
                        </View>
                    </View>
                ) : (
                    <View></View>
                )}
            </Card>
            <Text category='c1' style={styles.timeStamp}>
                {new Date(Number(data.time)).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                })}
            </Text>
        </View>
    );
});

// Define interface for ImageViewer props
interface ImageViewerProps
{
    visible: boolean;
    imageUri: string;
    onClose: () => void;
}

// Image viewer for full-screen display with rotation
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

const Detail = ({ action, plant, onDelete }: { action?: Action, plant?: Plant, onDelete?: (action: Action) => void }) =>
{
    const screenHeight = Dimensions.get('window').height;
    const screenWidth = Dimensions.get('window').width;
    const imageHeight = screenHeight * 0.5 * 0.3;
    const [selectedImage, setSelectedImage] = React.useState('');
    const [showImageViewer, setShowImageViewer] = React.useState(false);
    const { themeMode } = useTheme();

    let content = null;
    if (action && plant) {
        const date = new Date(Number(action.time));
        content = (<View style={styles.detailContent}>
            <Text category='h5' style={styles.detailDate}>
                {date.toLocaleDateString()}
            </Text>
            <View style={styles.detailActionContainer}>
                <Text category='p1' style={styles.detailAction}>
                    给
                </Text>
                <Text category='h6' style={[styles.detailAction, styles.boldText, { color: theme['color-primary-600'] }]}>
                    {plant?.name}
                </Text>
                <Text category='h6' style={[styles.detailAction, styles.boldText, { color: theme['color-purple-200'] }]}>
                    {action?.name}
                </Text>
                <Text category='p1' style={styles.detailAction}>
                    完成！！！
                </Text>
            </View>
            <Text category='p1' style={styles.detailAction}>
                给自己点个赞吧👍
            </Text>
            {action?.remark && (
                <Text category='s1' style={styles.detailRemark}>
                    {action.remark}
                </Text>
            )}
            {action?.imgs && action.imgs.length > 0 && (
                <View style={styles.imageContainer}>
                    <FlatList
                        style={{ width: '100%' }}
                        data={action.imgs}
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
                                    style={[styles.thumbnailImage]}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item, index) => index.toString()}
                        ItemSeparatorComponent={() => <View style={{ width: 5 }} />}
                    />
                </View>
            )}

            <ImageViewer
                visible={showImageViewer}
                imageUri={selectedImage}
                onClose={() => setShowImageViewer(false)}
            />
            
            {onDelete && (
                <Button 
                    status="danger" 
                    accessoryLeft={(props) => <Icon {...props} name="trash-outline" />}
                    onPress={() => onDelete(action)}
                    style={styles.deleteButton}
                >
                    删除记录
                </Button>
            )}
        </View>)
    }
    const cardStyle = [
        styles.detailCard,
        {
            width: screenWidth * 0.8,
            backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(43, 50, 65, 0.98)'
        }
    ];
    return (
        <Card style={cardStyle}>
            {content}
        </Card>
    );
}

const CalendarIcon = (props: IconProps) => (
    <Icon {...props} name="calendar-outline" />
);

const TimelinePage = () =>
{
    const [timelineData, setTimelineData] = React.useState<Action[]>([]);
    const [showCalendar, setShowCalendar] = React.useState(false);
    //当前时间线的时间戳范围
    const [curTimeRange, setCurTimeRange] = React.useState<{ start: number, end: number }>({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0, 0).getTime(),
        end: new Date(new Date().setHours(23, 59, 59, 999)).getTime()
    });
    //当前日期选择器的数据
    const [rangeDate, setRangeDate] = React.useState<CalendarRange<Date>>({ startDate: new Date(), endDate: new Date() });
    const [detailInfo, setDetailInfo] = React.useState<{ show: boolean, action?: Action, plant?: Plant }>({ show: false });
    const calendarButtonRef = React.useRef(null);
    const { themeMode } = useTheme();

    const updateTimelineData = React.useCallback(() =>
    {
        ActionManager.getActionsByTimeRange(curTimeRange.start, curTimeRange.end).then((actions) =>
        {
            //过滤掉还没完成的action
            const filteredActions = actions.filter((action) => action.done);
            setTimelineData(filteredActions);
        });
    }, [curTimeRange]);

    // Remove duplicate useEffect and just use useFocusEffect
    useFocusEffect(
        React.useCallback(() =>
        {
            updateTimelineData();
            return () => { };
        }, [updateTimelineData])
    );

    const onCntentClick = React.useCallback((action: Action, plant: Plant) =>
    {
        setDetailInfo({ show: true, action, plant });
    }, []);

    // 添加删除功能
    const handleDeleteAction = React.useCallback(async (action: Action) => {
        try {
            await ActionManager.deleteAction(action.id);
            // 从时间线数据中移除已删除的操作
            setTimelineData(prev => prev.filter(item => item.id !== action.id));
            // 关闭详情弹窗
            setDetailInfo({ show: false });
        } catch (error) {
            console.error("删除操作失败:", error);
        }
    }, []);

    const renderCustomTime = React.useCallback((data: Action) =>
    {
        const date = new Date(Number(data.time));
        const dayOfMonth = date.getDate(); // 获取日期（1-31）
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const dayOfWeek = weekDays[date.getDay()];

        return (
            <View style={styles.customTime}>
                <Text category='h4' style={{ color: theme['color-primary-500'], ...styles.timeText }}>{dayOfMonth}</Text>
                <Text category='s1' style={{ color: theme['color-dark-400'], ...styles.weekText }}>{dayOfWeek}</Text>
            </View>
        );
    }, []);

    // Use the new TimelineContent component instead of inline function with hooks
    const renderCustomContent = React.useCallback((data: Action) =>
    {
        return <TimelineContent data={data} onContentClick={onCntentClick} />;
    }, [onCntentClick]);

    // Define renderCustomIcon with useCallback to ensure stability
    const renderCustomIcon = React.useCallback((data: Action) =>
    {
        return data.done ?
            <MaterialIcons name='sentiment-very-satisfied' size={24} color={theme['color-primary-500']} />
            : <MaterialIcons name='sentiment-neutral' size={24} color={theme['color-dark-400']} />;
    }, []);

    const onCalendarSelect = React.useCallback((range: CalendarRange<Date>) =>
    {
        setRangeDate(range);
        if (range.startDate && range.endDate) {
            setCurTimeRange({
                start: range.startDate.getTime(),
                end: range.endDate.getTime()
            });
            setShowCalendar(false);
        }
    }, []);

    return (
        <GradientBackground
            colors={themeMode === 'light'
                ? ['#F5F5F5', '#E3F2FD', '#F5F5F5']
                : ['#222B45', '#1A2138', '#222B45']}
            style={styles.container}
        >
            <Layout style={styles.header}>
                <Text category="h1">时间线</Text>
                <View style={styles.calendarButtonContainer}>
                    <Button
                        ref={calendarButtonRef}
                        size="small"
                        accessoryLeft={CalendarIcon}
                        onPress={() => setShowCalendar(!showCalendar)}
                    />

                    {showCalendar && (
                        <RangeCalendar
                            range={rangeDate}
                            onSelect={onCalendarSelect}
                            style={styles.calendar}
                        />
                    )}
                </View>
            </Layout>

            <Layout style={styles.content}>
                <Timeline
                    data={timelineData}
                    renderTime={renderCustomTime}
                    renderContent={renderCustomContent}
                    renderIcon={renderCustomIcon}
                />
            </Layout>

            <Modal
                visible={detailInfo.show}
                backdropStyle={styles.backdrop}
                onBackdropPress={() => setDetailInfo({ show: false })}
            >
                <Detail 
                    action={detailInfo.action} 
                    plant={detailInfo.plant} 
                    onDelete={handleDeleteAction}
                />
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
        zIndex: 2,
    },
    content: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingTop: 10
    },
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
    },
    calendarCard: {
        margin: 8,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 1,
    },
    modalTitle: {
        marginBottom: 20,
        textAlign: 'center',
        color: '#2C3E50'
    },
    calendarButtonContainer: {
        position: 'relative',
    },
    calendar: {
        position: 'absolute',
        top: '100%',
        right: 0,
        zIndex: 99,
        backgroundColor: theme['color-basic-100'],
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    customTime: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    weekText: {
        fontSize: 12,
    },
    customContent: {
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        elevation: 3,
        marginLeft: 10,
    },
    contentText: {
        fontSize: 14,
        marginBottom: 4,
    },
    customIcon: {
        width: 20,
        height: 20,
        zIndex: 1, // 确保点在线的上面
        marginTop: 10,
    },
    detailCard: {
        alignSelf: 'center',
        backgroundColor: theme['color-basic-100'],
        borderRadius: 20,
        elevation: 4,
        overflow: 'hidden',
    },
    detailContent: {
        flex: 1,
        padding: 20,
        justifyContent: 'flex-start',
        gap: 15,
    },
    detailDate: {
        color: theme['color-primary-400'],
        fontWeight: 'bold',
    },
    detailActionContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 4,
    },
    detailAction: {
        fontSize: 16,
        lineHeight: 24,
    },
    boldText: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    detailRemark: {
        color: theme['color-dark-400'],
    },
    imageContainer: {
        marginTop: 10,
    },
    thumbnailImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
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
    timeStamp: {
        position: 'absolute',
        bottom: -10,
        left: 10,
        color: theme['color-dark-500'],
    },
    deleteButton: {
        marginTop: 20,
        alignSelf: 'center',
    },
});

export default TimelinePage;