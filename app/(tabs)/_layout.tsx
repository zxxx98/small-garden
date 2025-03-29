
import { Tabs } from 'expo-router';

export default function TabLayout() {
    return (
        <Tabs>
            <Tabs.Screen name='timelinePage' options={{ headerShown: false,title: "时间线" }}></Tabs.Screen>
            <Tabs.Screen name='todoPage' options={{ headerShown: false,title: "今日待办" }}></Tabs.Screen>
            <Tabs.Screen name='plantsPage' options={{ headerShown: false,title: "植物管理" }}></Tabs.Screen>
            <Tabs.Screen name='settingsPage' options={{ headerShown: false,title: "设置" }}></Tabs.Screen>
        </Tabs>
    );
}