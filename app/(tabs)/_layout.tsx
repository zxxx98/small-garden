import { BottomNavigation, BottomNavigationTab, Icon } from '@ui-kitten/components';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import React from 'react';

// 定义标签数据接口
interface TabDataItem
{
    name: string;
    title: string;
    iconName: string;
    iconPack?: string;
}

// 标签数据
const tabData: TabDataItem[] = [
    { name: 'timelinePage', title: '时间线', iconName: 'clock-outline' },
    { name: 'todoPage', title: '今日待办', iconName: 'list-outline' },
    { name: 'plantsPage', title: '花园', iconName: 'flower-outline', iconPack: 'ionicons' },
    { name: 'settingsPage', title: '设置', iconName: 'settings-2-outline' }
];

export default function TabLayout()
{
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
            }}
            initialRouteName="timelinePage"
            tabBar={props => (
                <BottomNavigation
                    selectedIndex={props.state.index}
                    onSelect={index =>
                    {
                        props.navigation.navigate(props.state.routeNames[index]);
                    }}
                    appearance='noIndicator'
                    style={{ height: 60 }}
                >
                    {tabData.map((tab, index) => (
                        <BottomNavigationTab
                            key={tab.name}
                            icon={(props) => (
                                <Icon
                                    {...props}
                                    pack={tab.iconPack || 'eva'}
                                    name={tab.iconName}
                                    animation={'pulse'} // 使用UI Kitten内置的animation属性
                                />
                            )}
                            title={tab.title}
                            style={props.state.index === index ? styles.activeTab : styles.inactiveTab}
                        />
                    ))}
                </BottomNavigation>
            )}
        >
            {tabData.map(tab => (
                <Tabs.Screen key={tab.name} name={tab.name} />
            ))}
        </Tabs>
    );
}

const styles = StyleSheet.create({
    activeTab: {
        opacity: 1,
        flex: 1,
    },
    inactiveTab: {
        opacity: 0.5,
        flex: 1,
    },
});