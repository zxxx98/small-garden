import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Spinner, Text } from '@ui-kitten/components';

interface LoadingModalProps
{
    visible?: boolean;
    message?: string;
}

interface LoadingModalState
{
    visible: boolean;
    message: string;
}

class LoadingModal extends Component<LoadingModalProps, LoadingModalState>
{
    private static instance: LoadingModal | null = null;

    constructor(props: LoadingModalProps)
    {
        super(props);
        this.state = {
            visible: props.visible || false,
            message: props.message || '加载中...',
        };
        LoadingModal.instance = this;
    }

    static show(message: string = '加载中...')
    {
        if (LoadingModal.instance) {
            LoadingModal.instance.setState({ visible: true, message });
        }
    }

    static hide()
    {
        if (LoadingModal.instance) {
            LoadingModal.instance.setState({ visible: false });
        }
    }

    render()
    {
        return (
            <Modal
                visible={this.state.visible}
                backdropStyle={styles.backdrop}
            >
                <View style={styles.container}>
                    <Spinner size="large" status='success' />
                    <Text style={styles.message}>{this.state.message}</Text>
                </View>
            </Modal>
        );
    }
}

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