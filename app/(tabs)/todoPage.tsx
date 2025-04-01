import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';

const TodoPage = () =>
{
    return (
        <LinearGradient
            colors={['#F5F5F5', '#FFF3E0', '#F5F5F5']}
            style={styles.container}
        >
            <Layout style={styles.header}>
                <Text category="h1">今日待办</Text>
            </Layout>
            <Layout style={styles.content}>
                {/* 待办内容将在这里添加 */}
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

export default TodoPage;