import * as React from 'react';
import { FlatList, Image, StyleSheet, View, Dimensions, TouchableOpacity } from 'react-native';
import { Layout, Text, Card, Icon, RangeCalendar, CalendarRange, Button, Modal, IconProps } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import ContentLoader from 'react-content-loader';
import Timeline from '../../components/Timeline';
import { theme } from '@/theme/theme';
import { Action } from '@/types/action';
import { getIconAndColor } from '@/utils/action';
import { PlantManager } from '@/models/PlantManager';
import { Plant } from '@/types/plant';
import { ActionManager } from '@/models/ActionManager';
import { useTheme } from '../../theme/themeContext';

function getRangeLabel(startDate?: Date, endDate?: Date)
{
    if (!startDate || !endDate) {
        return '';
    }
    if (!startDate) {
        return `${endDate.toLocaleDateString()}`;
    }
    if (!endDate) {
        return `${startDate.toLocaleDateString()}`;
    }
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
}

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

const Detail = ({ action, plant }: { action?: Action, plant?: Plant }) =>
{
    const screenHeight = Dimensions.get('window').height;
    const screenWidth = Dimensions.get('window').width;
    const imageHeight = screenHeight * 0.5 * 0.3;
    const [selectedImage, setSelectedImage] = React.useState('');
    const [showImageViewer, setShowImageViewer] = React.useState(false);

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
        </View>)
    }
    return (
        <Card style={[styles.detailCard, { width: screenWidth * 0.7 }]}>
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

    React.useEffect(() =>
    {
        ActionManager.getActionsByTimeRange(curTimeRange.start, curTimeRange.end).then((actions) =>
        {
            setTimelineData(actions);
        });
    }, [curTimeRange]);

    const onCntentClick = (action: Action, plant: Plant) =>
    {
        setDetailInfo({ show: true, action, plant });
    }

    const renderCustomTime = (data: Action) =>
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
    };

    const renderCustomContent = (data: Action) =>
    {
        const [plant, setPlant] = React.useState<Plant | null>(null);
        React.useEffect(() =>
        {
            PlantManager.getPlant(data.plantId).then((plant) =>
            {
                setPlant(plant);
            });
        })
        return <Card style={styles.customContent} onPress={() =>
        {
            if (plant) {
                onCntentClick(data, plant);
            }
        }}>
            {
                plant ? <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 90, flex: 1 }}>
                    <Image source={{ uri: plant.img }} style={{ width: 76, height: 76, borderRadius: 38, marginRight: 10, flexShrink: 0 }} />
                    <View style={{ flex: 1 }}>
                        <Text category='h6' style={styles.contentText} numberOfLines={1}>{plant?.name}</Text>
                        <Text category='p1' style={styles.contentText} numberOfLines={1}>{data.name}</Text>
                        <Text category='s1' style={styles.contentText} numberOfLines={2}>{data.remark}</Text>
                    </View>
                </View>
                    :
                    <PlantLoader></PlantLoader>
            }
        </Card>;
    };

    const renderCustomIcon = (data: Action) =>
    {
        const iconData = getIconAndColor(data.name);
        return <Icon name={iconData.iconName} style={styles.customIcon} fill={iconData.color} pack={iconData.pack} />
    }

    const onCalendarSelect = (range: CalendarRange<Date>) =>
    {
        setRangeDate(range);
        if (range.startDate && range.endDate) {
            setCurTimeRange({
                start: range.startDate.getTime(),
                end: range.endDate.getTime()
            });
            setShowCalendar(false);
        }
    }

    return (
        <LinearGradient
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
                <Detail action={detailInfo.action} plant={detailInfo.plant} />
            </Modal>
        </LinearGradient>
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
        lineHeight: 20,
        marginBottom: 4,
    },
    customIcon: {
        width: 20,
        height: 20,
        zIndex: 1, // 确保点在线的上面
        marginTop: 10,
    },
    detailCard: {
        height: '80%',
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
});

const PlantLoader = () =>
{
    return (
        <ContentLoader
            height={90}
            backgroundColor="#f5f5f5"
            foregroundColor="#dbdbdb"
        >
            <circle cx="38" cy="45" r="38" />
            <rect x="80" y="10" rx="5" ry="5" width="130" height="20" />
            <rect x="80" y="40" rx="5" ry="5" width="130" height="20" />
            <rect x="80" y="70" rx="5" ry="5" width="100" height="20" />
        </ContentLoader>
    )
}

export default TimelinePage;