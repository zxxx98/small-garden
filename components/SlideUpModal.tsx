import * as React from 'react';
import { StyleSheet, TouchableOpacity, View, Animated, Dimensions, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';

interface SlideUpModalProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    themeMode: 'light' | 'dark';
}

const SlideUpModal = ({ visible, onClose, children, themeMode }: SlideUpModalProps) => {
    // Animation value for sliding up
    const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;

    // Start slide-up animation when component becomes visible
    React.useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 70,
                friction: 12
            }).start();
        }
    }, [visible]);

    const handleClose = () => {
        // Slide down animation
        Animated.timing(slideAnim, {
            toValue: Dimensions.get('window').height,
            duration: 300,
            useNativeDriver: true
        }).start(() => {
            onClose();
        });
    };

    if (!visible) return null;

    const backgroundColor = themeMode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(43, 50, 65, 0.98)';
    const blurIntensity = themeMode === 'light' ? 50 : 80;

    return (
        <View style={styles.overlay}>
            {/* Blur background */}
            <BlurView
                intensity={blurIntensity}
                tint={themeMode === 'light' ? 'light' : 'dark'}
                style={StyleSheet.absoluteFill}
            />

            <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={handleClose}
            />

            <Animated.View
                style={[
                    styles.animatedContainer,
                    { transform: [{ translateY: slideAnim }] }
                ]}
            >
                <ScrollView
                    style={[styles.container, { backgroundColor }]}
                    contentContainerStyle={styles.contentContainer}
                >
                    {/* Drag indicator */}
                    <View style={styles.dragIndicator} />

                    {children}
                </ScrollView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9,
        justifyContent: 'flex-end',
    },
    animatedContainer: {
        maxHeight: '90%',
        width: '100%',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    contentContainer: {
        padding: 24,
        paddingBottom: 40,
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(150, 150, 150, 0.3)',
        alignSelf: 'center',
        borderRadius: 5,
        marginBottom: 20,
        marginTop: -10,
    },
});

export default SlideUpModal; 