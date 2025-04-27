import { BottomNavigation, BottomNavigationTab, Icon } from '@ui-kitten/components';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import React from 'react';
import { useAddAction } from '@/context/AddActionContext';

// 定义标签数据接口
interface TabDataItem {
    name: string;
    title: string;
    iconName: string;
    iconPack?: string;
}

// 标签数据
const tabData: TabDataItem[] = [
    { name: 'timelinePage', title: '时间线', iconName: 'clock-outline' },
    { name: 'todoPage', title: '待办', iconName: 'list-outline' },
    { name: 'plantsPage', title: '花园', iconName: 'flower-outline', iconPack: 'ionicons' },
    { name: 'settingsPage', title: '设置', iconName: 'settings-2-outline' }
];

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
            }}
            initialRouteName="timelinePage"
            tabBar={(props: any) => (
                <BottomNavigation
                    selectedIndex={props.state.index}
                    onSelect={index => {
                        props.navigation.navigate(props.state.routeNames[index]);
                    }}
                    appearance='noIndicator'
                    style={{ height: 60 }}
                >
                    {tabData.map((tab, index) => {
                        let style:any = props.state.index === index ? styles.activeTab : styles.inactiveTab;
                        return (
                            <BottomNavigationTab
                                key={tab.name}
                                icon={(props) => (
                                    <Icon
                                        {...props}
                                        pack={tab.iconPack || 'eva'}
                                        name={tab.iconName}
                                    />
                                )}
                                title={tab.title}
                                style={style}
                            />
                        )
                    })}
                </BottomNavigation>
            )}
        >
            {tabData.map((tab, index) => (
                <Tabs.Screen
                    key={index}
                    name={tab.name}
                    options={{
                        title: tab.title,
                    }}
                />
            ))}
        </Tabs>
    );
}

const styles = StyleSheet.create({
    activeTab: {
        opacity: 1,
        flex: 1,
        minWidth: "12%",
        alignItems: 'center',
    },
    inactiveTab: {
        opacity: 0.5,
        flex: 1,
        minWidth: "12%",
        alignItems: 'center',
    },
    circleTab: {
        aspectRatio: 1,
        borderRadius: 9999,
        backgroundColor: '#2B3A67',
        margin: 8,
        shadowColor: "#000", 
        elevation: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
});