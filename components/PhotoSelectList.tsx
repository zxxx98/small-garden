import { View, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions, Text, Alert } from "react-native"
import * as ImagePicker from 'expo-image-picker'
import { useState, useEffect } from 'react'
import { Modal } from 'react-native'
import { Icon } from '@ui-kitten/components'

interface PhotoSelectListProps {
    photos: string[];
    onPhotosChange: (photos: string[]) => void;
    onPhotoPress?: (photo: string) => void;
    showRemoveButton?: boolean;
}

const PhotoSelectList = ({ photos, onPhotosChange, onPhotoPress, showRemoveButton = true }: PhotoSelectListProps) => {
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
    const [modalVisible, setModalVisible] = useState(false)

    const handleImagePicker = async () => {
        Alert.alert(
            "选择照片",
            "请选择照片来源",
            [
                {
                    text: "从相册选择",
                    onPress: async () => {
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsMultipleSelection: true,
                            quality: 0.8,
                        })

                        if (!result.canceled) {
                            const newPhotos = result.assets.map(asset => asset.uri)
                            onPhotosChange([...photos, ...newPhotos])
                        }
                    }
                },
                {
                    text: "拍照",
                    onPress: async () => {
                        const { status } = await ImagePicker.requestCameraPermissionsAsync()
                        if (status !== 'granted') {
                            Alert.alert('需要相机权限', '请允许访问相机以拍摄照片')
                            return
                        }

                        const result = await ImagePicker.launchCameraAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            quality: 0.8,
                        })

                        if (!result.canceled) {
                            onPhotosChange([...photos, result.assets[0].uri])
                        }
                    }
                },
                {
                    text: "取消",
                    style: "cancel"
                }
            ]
        )
    }

    const handlePhotoPress = (photo: string) => {
        if (onPhotoPress) {
            onPhotoPress(photo)
        } else {
            setSelectedPhoto(photo)
            setModalVisible(true)
        }
    }

    const removePhoto = (index: number) => {
        const newPhotos = [...photos]
        newPhotos.splice(index, 1)
        onPhotosChange(newPhotos)
    }

    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.photoList}>
                    {photos.map((photo, index) => (
                        <View key={index} style={{ position: 'relative' }}>
                            <TouchableOpacity
                                onPress={() => handlePhotoPress(photo)}
                            >
                                <Image
                                    source={{ uri: photo }}
                                    style={styles.photo}
                                />
                            </TouchableOpacity>
                            {showRemoveButton && (
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removePhoto(index)}
                                >
                                    <Icon name="close-circle" fill="#FF3D71" style={styles.removeIcon} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                    
                    {/* 添加照片按钮 */}
                    <TouchableOpacity
                        style={styles.addPhotoButton}
                        onPress={handleImagePicker}
                    >
                        <Icon name="plus-outline" style={styles.addIcon} fill="#8F9BB3" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal
                visible={modalVisible}
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalContainer}
                    onPress={() => setModalVisible(false)}
                >
                    <Image
                        source={{ uri: selectedPhoto || '' }}
                        style={styles.modalImage}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 0,
    },
    photoList: {
        flexDirection: 'row',
        paddingVertical: 10,
    },
    photo: {
        width: 100,
        height: 100,
        marginRight: 10,
        borderRadius: 8,
    },
    addPhotoButton: {
        width: 100,
        height: 100,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#8F9BB3',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(143, 155, 179, 0.1)',
    },
    addIcon: {
        width: 32,
        height: 32,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImage: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height * 0.8,
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    removeIcon: {
        width: 24,
        height: 24,
    },
})

export default PhotoSelectList