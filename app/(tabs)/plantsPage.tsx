import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';

const PlantsPage = () =>
{
    return (
        <Layout style={styles.container}>
            <Text category='h1'>植物管理</Text>
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

export default PlantsPage;