import * as React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Layout, Text, Card, Icon } from '@ui-kitten/components';
import ContentLoader from 'react-content-loader';
import Timeline from '../../components/Timeline';
import { theme } from '@/theme/theme';
import { Action } from '@/types/action';
import { getIconAndColor } from '@/utils/action';
import { PlantManager } from '@/models/PlantManager';
import { Plant } from '@/types/plant';

const TimelinePage = () =>
{
    const timelineData: Action[] = [
        {
            id: 1,
            name: "浇水",
            plantId: "111",
            time: Date.now() - 24 * 60 * 60 * 1000,
            remark: "给绿萝浇了200ml温水",
            imgs: [],
            done: true
        },
        {
            id: 2,
            name: "施肥",
            plantId: "2",
            time: Date.now() - 2 * 24 * 60 * 60 * 1000,
            remark: "给多肉施加了稀释的复合肥",
            imgs: [],
            done: true
        },
        {
            id: 3,
            name: "修剪",
            plantId: "3",
            time: Date.now() - 3 * 24 * 60 * 60 * 1000,
            remark: "修剪了发黄的叶子",
            imgs: [],
            done: true
        },
        {
            id: 4,
            name: "换盆",
            plantId: "1",
            time: Date.now() - 4 * 24 * 60 * 60 * 1000,
            remark: "更换了大一号的花盆",
            imgs: [],
            done: true
        },
        {
            id: 5,
            name: "除虫",
            plantId: "4",
            time: Date.now() - 5 * 24 * 60 * 60 * 1000,
            remark: "发现叶子上有蚜虫，已喷洒除虫剂处理",
            imgs: [],
            done: true
        },
        {
            id: 6,
            name: "浇水",
            plantId: "5",
            time: Date.now() - 6 * 24 * 60 * 60 * 1000,
            remark: "给芦荟浇水",
            imgs: [],
            done: false
        },
        {
            id: 7,
            name: "晒太阳",
            plantId: "2",
            time: Date.now() - 7 * 24 * 60 * 60 * 1000,
            remark: "将多肉移到阳台晒太阳",
            imgs: [],
            done: true
        },
        {
            id: 8,
            name: "松土",
            plantId: "6",
            time: Date.now() - 8 * 24 * 60 * 60 * 1000,
            remark: "给绿植松土透气",
            imgs: [],
            done: true
        },
        {
            id: 9,
            name: "施肥",
            plantId: "3",
            time: Date.now() - 9 * 24 * 60 * 60 * 1000,
            remark: "补充氮肥促进生长",
            imgs: [],
            done: true
        },
        {
            id: 10,
            name: "浇水",
            plantId: "4",
            time: Date.now() - 10 * 24 * 60 * 60 * 1000,
            remark: "日常浇水",
            imgs: [],
            done: true
        }
    ];

    const renderCustomTime = (data: Action) =>
    {
        const date = new Date(Number(data.time));
        const dayOfMonth = date.getDate(); // 获取日期（1-31）
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const dayOfWeek = weekDays[date.getDay()];

        return (
            <View style={styles.customTime}>
                <Text category='h4' style={{ color: theme['color-purple-400'], ...styles.timeText }}>{dayOfMonth}</Text>
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
        return <Card style={styles.customContent}>
            {
                plant ? <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 90 }}>
                    <Image source={{ uri: plant.img }} style={{ width: 76, height: 76, borderRadius: 38, marginRight: 10 }} />
                    <View>
                        <Text category='h6' style={styles.contentText}>{plant?.name}</Text>
                        <Text category='p1' style={styles.contentText}>{data.name}</Text>
                        <Text category='s1' style={styles.contentText}>{data.remark}</Text>
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

    return (
        <Layout style={styles.container}>
            <Text category='h1' style={styles.title}>时间线</Text>
            <Timeline
                data={timelineData}
                renderTime={renderCustomTime}
                renderContent={renderCustomContent}
                renderIcon={renderCustomIcon}
                lineColor={theme['color-dark-400']}
                isDashed={true}
            />
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
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
    },
    contentText: {
        fontSize: 14,
        lineHeight: 20,
    },
    customIcon: {
        width: 16,
        height: 16,
        zIndex: 1, // 确保点在线的上面
        marginTop: 10,
    }
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