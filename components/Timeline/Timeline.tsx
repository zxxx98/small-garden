import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon, Text } from '@ui-kitten/components';
import { ScrollView } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { theme } from '@/theme/theme';

export interface TimelineItemProps
{
    time: number;
    name: string;
}

export interface TimelineProps
{
    data: TimelineItemProps[];
    renderTime?: (data: TimelineItemProps | any) => React.ReactNode;
    renderContent?: (data: TimelineItemProps | any) => React.ReactNode;
    renderIcon?: (data: TimelineItemProps | any) => React.ReactNode;
    lineColor?: string;
    isDashed?: boolean;
}

const Timeline: React.FC<TimelineProps> = memo(({
    data,
    renderTime,
    renderContent,
    renderIcon,
    lineColor = '#E4E9F2',
    isDashed = false,
}) =>
{
    const renderDefaultTime = (data: TimelineItemProps) => (
        <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{data.time}</Text>
        </View>
    );

    const renderDefaultContent = (data: TimelineItemProps) => (
        <View style={styles.contentContainer}>
            <Text>{data.name}</Text>
        </View>
    );

    const renderDefaultIcon = (data: TimelineItemProps) => (
        <Icon name="radio-button-on-outline" style={styles.dot} fill={theme["color-purple-400"]} />
    );

    return (
        <ScrollView style={styles.container}>
            {data.map((item, index) => (
                <View key={index} style={styles.itemContainer}>
                    <View style={styles.timeWrapper}>
                        {renderTime ? renderTime(item) : renderDefaultTime(item)}
                    </View>
                    <View style={styles.lineContainer}>
                        {index < data.length - 1 && (
                            <Svg style={[styles.line, { top: 26 }]} height="100%" width="1">
                                <Line
                                    x1="0.5"
                                    y1="0"
                                    x2="0.5"
                                    y2="100%"
                                    stroke={lineColor}
                                    strokeWidth="1"
                                    strokeDasharray={isDashed ? '4, 4' : undefined}
                                />
                            </Svg>
                        )}
                        {renderIcon ? renderIcon(item) : renderDefaultIcon(item)}
                    </View>
                    <View style={styles.contentWrapper}>
                        {renderContent ? renderContent(item) : renderDefaultContent(item)}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    itemContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        marginLeft: 20,
    },
    timeWrapper: {
        flex: 1,
        alignItems: 'flex-end',
        paddingRight: 12,
    },
    timeContainer: {
        padding: 8,
    },
    timeText: {
        fontSize: 14,
        color: '#8F9BB3',
    },
    lineContainer: {
        width: 24,
        alignItems: 'center',
        position: 'relative',
    },
    line: {
        position: 'absolute',
        left: '50%',
        marginLeft: -0.5,
    },
    dot: {
        width: 16,
        height: 16,
        zIndex: 1, // 确保点在线的上面
        marginTop: 10,
    },
    contentWrapper: {
        flex: 5,
        paddingLeft: 12,
    },
    contentContainer: {
        padding: 12,
        backgroundColor: '#F7F9FC',
        borderRadius: 8,
    },
});

export default Timeline;