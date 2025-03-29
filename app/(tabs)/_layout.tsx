
import { BottomNavigation, BottomNavigationTab, Icon } from '@ui-kitten/components';
import { Tabs } from 'expo-router';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
            }}
            initialRouteName="timelinePage"
            tabBar={props => (
                <BottomNavigation
                    selectedIndex={props.state.index}
                    onSelect={index => props.navigation.navigate(props.state.routeNames[index])}
                    appearance='noIndicator'
                >
                    <BottomNavigationTab icon={<Icon name='clock-outline'/>} title='时间线'/>
                    <BottomNavigationTab icon={<Icon name='list-outline'/>} title='今日待办'/>
                    <BottomNavigationTab icon={<Icon pack='ionicons' name='flower-outline'/>} title='植物管理'/>
                    <BottomNavigationTab icon={<Icon name='settings-2-outline'/>} title='设置'/>
                </BottomNavigation>
            )}
        >
            <Tabs.Screen name='timelinePage'/>
            <Tabs.Screen name='todoPage'/>
            <Tabs.Screen name='plantsPage'/>
            <Tabs.Screen name='settingsPage'/>
        </Tabs>
    );
}