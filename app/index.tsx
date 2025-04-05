import init from '@/init';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    image: {
        width: 100,
        height: 100,
        resizeMode: 'contain'
    }
});

export default function Index()
{
    const [loading, setLoading] = useState(true);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() =>
    {
        Promise.all([
            init(),
            new Promise(resolve => Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true
            }).start(() =>
            {
                resolve(void 0);
            }))
        ]).then(() =>
        {
            setLoading(false);
        });
    }, [])
    if (!loading) {
        return <Redirect href="/(tabs)/timelinePage" />;
    }

    return (
        <View style={styles.container}>
            <Animated.Image
                resizeMode={'contain'}
                source={require('../assets/images/flower.png')}
                style={[styles.image, { opacity: fadeAnim }]}
            />
        </View>
    );
}