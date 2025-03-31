import * as React from 'react';
import { FlatList, Image, StyleSheet, View, Dimensions } from 'react-native';
import { Layout, Text, Card, Icon, RangeCalendar, CalendarRange, Button, Modal } from '@ui-kitten/components';
import ContentLoader from 'react-content-loader';
import Timeline from '../../components/Timeline';
import { theme } from '@/theme/theme';
import { Action } from '@/types/action';
import { getIconAndColor } from '@/utils/action';
import { PlantManager } from '@/models/PlantManager';
import { Plant } from '@/types/plant';
import { ActionManager } from '@/models/ActionManager';

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


const Detail = ({ action, plant }: { action?: Action, plant?: Plant }) =>
{
    const screenHeight = Dimensions.get('window').height;
    const imageHeight = screenHeight * 0.5 * 0.3; // 取较小值，确保在小屏幕上不会太大

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
                            <Image
                                source={{ uri: item }}
                                style={[styles.detailImage, { height: imageHeight }]}
                                resizeMode="contain"
                            />
                        )}
                        keyExtractor={(item, index) => index.toString()}
                        ItemSeparatorComponent={() => <View style={{ width: 5 }} />}
                    />
                </View>
            )}
        </View>)
    }
    return (
        <Card style={styles.detailCard}>
            {content}
        </Card>
    );
}

const TimelinePage = () =>
{
    const [timelineData, setTimelineData] = React.useState<Action[]>([]);
    const [showCalendar, setShowCalendar] = React.useState(false);
    const [rangeDate, setRangeDate] = React.useState<CalendarRange<Date>>({ startDate: new Date(), endDate: new Date() });
    const [selectRangeDate, setSelectRangeDate] = React.useState<CalendarRange<Date>>({ startDate: new Date(), endDate: new Date() });
    const [detailInfo, setDetailInfo] = React.useState<{ show: boolean, action?: Action, plant?: Plant }>({ show: false });
    React.useEffect(() =>
    {
        ActionManager.getAllActions().then((actions) =>
        {
            setTimelineData(actions);
        });
    }, []);

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
        if (range.startDate && range.endDate) {
            setShowCalendar(false);
        }
        setSelectRangeDate(range);
    }

    React.useEffect(() =>
    {
        if (selectRangeDate.startDate && selectRangeDate.endDate) {
            setRangeDate(selectRangeDate);
        }
    }, [selectRangeDate]);

    return (
        <Layout style={styles.container}>
            <Button
                style={styles.title}
                size='large'
                appearance='ghost'
                status='primary'
                onPress={() => setShowCalendar(!showCalendar)}
            >
                {getRangeLabel(rangeDate.startDate, rangeDate.endDate)}
            </Button>
            <Modal visible={showCalendar} style={{ width: "100%", height: "50%" }} backdropStyle={styles.detailBackground} onBackdropPress={() =>
            {
                setShowCalendar(false);
            }}>
                <RangeCalendar style={styles.calendar} range={selectRangeDate} onSelect={onCalendarSelect} />
            </Modal>
            <Timeline
                data={timelineData}
                renderTime={renderCustomTime}
                renderContent={renderCustomContent}
                renderIcon={renderCustomIcon}
                lineColor={theme['color-dark-400']}
                isDashed={true}
            />
            {/**当前点击的时间线卡片的详细信息 */}
            <Modal visible={detailInfo.show} style={{ width: "100%", height: "50%" }} backdropStyle={styles.detailBackground} onBackdropPress={() =>
            {
                setDetailInfo({ show: false });
            }}>
                <Detail action={detailInfo.action} plant={detailInfo.plant} />
            </Modal>
        </Layout>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
    },
    title: {
        marginBottom: 10,
        width: '60%',
        alignSelf: 'center',
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
    calendar: {

        alignSelf: 'center',
        backgroundColor: theme['color-primary-500'],
        borderRadius: 30,
        padding: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 1000,
    },
    detailCard: {
        height: '100%',
        width: '80%',
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
    },
    detailImage: {
        width: 80,
    },
    detailBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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