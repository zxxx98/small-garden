import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Timeline from '../../../components/Timeline';

const tabs = [
  { id: 'all', label: '全部' },
  { id: 'fertilize', label: '施肥' },
  { id: 'repot', label: '换盆' },
];

const mockRecords = [
  {
    date: '2024-04-27',
    type: 'repot' as const,
    title: '换盆',
    description: '更换了新的花盆',
  },
  {
    date: '2024-04-27',
    type: 'fertilize' as const,
    title: '施肥',
    description: '使用有机肥料',
  },
];

export default function PlantDetail() {
  const [activeTab, setActiveTab] = React.useState('all');

  return (
    <View className="flex-1 bg-white">
      {/* 顶部返回按钮 */}
      <View className="p-4">
        <TouchableOpacity>
          <Text>←</Text>
        </TouchableOpacity>
      </View>

      {/* 植物基本信息 */}
      <View className="flex-row items-center px-4 pb-4">
        <View className="w-20 h-20 bg-green-100 rounded-lg overflow-hidden">
          <Image
            source={{ uri: 'https://placeholder.com/150' }}
            className="w-full h-full"
          />
        </View>
        <View className="ml-4">
          <Text className="text-xl font-bold">Coqui</Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-gray-600">土培</Text>
            <Text className="ml-2 px-2 py-1 bg-green-50 text-green-600 rounded">阳台</Text>
          </View>
        </View>
      </View>

      {/* 标签页 */}
      <View className="flex-row border-b border-gray-200">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 ${
              activeTab === tab.id ? 'border-b-2 border-green-500' : ''
            }`}
          >
            <Text
              className={`text-center ${
                activeTab === tab.id ? 'text-green-500' : 'text-gray-600'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 养护记录时间线 */}
      <View className="flex-1 px-4 pt-4">
        {/* <Timeline records={mockRecords} /> */}
      </View>

      {/* 底部操作按钮 */}
      <View className="p-4 flex-row justify-between">
        <TouchableOpacity className="flex-1 mr-2 bg-green-500 rounded-full py-3">
          <Text className="text-center text-white">浇水</Text>
        </TouchableOpacity>
        <TouchableOpacity className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
          <Text>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 