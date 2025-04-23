import { BottomNavigation, BottomNavigationTab, Icon } from '@ui-kitten/components';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import React from 'react';

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
    { name: 'addActionPage', title: '', iconName: 'plus-outline' },
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
                        if (index === 2) {
                            //打开添加行为面板
                        } else {
                            props.navigation.navigate(props.state.routeNames[index]);
                        }
                    }}
                    appearance='noIndicator'
                    style={{ height: 60 }}
                >
                    {tabData.map((tab, index) => {
                        const realIndex = props.state.index > 1 ? props.state.index + 1 : props.state.index;
                        let style:any = props.state.index === index ? styles.activeTab : styles.inactiveTab;
                        if(index === 2)
                        {
                            //  Object.assign(style, styles.circleTab);
                            style = styles.circleTab;
                        }
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
    circleTab: {
        height: 40,
        borderRadius: 15,
        backgroundColor: '#2B3A67',  // 深色背景
        margin: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    }
});