import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Spinner, Text } from '@ui-kitten/components';

interface LoadingModalProps
{
    visible: boolean;
    message?: string;
}

const LoadingModal = ({ visible, message = '加载中...' }: LoadingModalProps) =>
{
    return (
        <Modal
            visible={visible}
            backdropStyle={styles.backdrop}
        >
            <View style={styles.container}>
                <Spinner size="large" status='success' />
                <Text style={styles.message}>{message}</Text>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
    },
    container: {

        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 150,
        minHeight: 150,
    },
    message: {
        marginTop: 16,
        textAlign: 'center',
    },
});

export default LoadingModal; 