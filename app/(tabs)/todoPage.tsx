import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';

const TodoPage = () =>
{
    return (
        <Layout style={styles.container}>
            <Text category='h1'>今日待办</Text>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default TodoPage;