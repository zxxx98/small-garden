import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';

const SettingsPage = () =>
{
    return (
        <LinearGradient
            colors={['#F5F5F5', '#F3E5F5', '#F5F5F5']}
            style={styles.container}
        >
            <Layout style={styles.header}>
                <Text category="h1">设置</Text>
            </Layout>
            <Layout style={styles.content}>
                {/* 设置内容将在这里添加 */}
            </Layout>
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
    },
    content: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});

export default SettingsPage;