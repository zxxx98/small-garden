import React from 'react';
import { StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';

interface MessageProps {
    message: string;
    description?: string;
    type?: 'success' | 'warning' | 'error' | 'info';
    duration?: number;
}

export const showMessage = (props: MessageProps) => {
    Toast.show({
        type: props.type || 'info',
        text1: props.message,
        text2: props.description,
        position: 'top',
        visibilityTime: props.duration || 4000,
        autoHide: true,
        topOffset: 50,
        bottomOffset: 40,
    });
};

const styles = StyleSheet.create({}); 