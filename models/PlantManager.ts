import { Platform } from 'react-native';
import { Plant } from '../types/plant';
import { Plant as SQLitePlant } from './sqlite/Plant';

export class PlantManager
{
    static async addPlant(plant: Plant)
    {
        if (Platform.OS === 'web') {
            mock.push(plant);
            return true;
        }
        return await SQLitePlant.create(plant);
    }

    static async updatePlant(plant: Plant)
    {
        if (Platform.OS === 'web') {
            const index = mock.findIndex(item => item.id === plant.id);
            if (index !== -1) {
                mock[index] = plant;
            }
            return true;
        }
        return await SQLitePlant.update(plant);
    }

    static async updatePlants(plants: Plant[])
    {
        if (Platform.OS === 'web') {
            plants.forEach(plant => {
                const index = mock.findIndex(item => item.id === plant.id);
                if (index !== -1) {
                    mock[index] = plant;
                }
            });
            return true;
        }
        return await SQLitePlant.updates(plants);
    }

    static async deletePlant(id: string)
    {
        if (Platform.OS === 'web') {
            const index = mock.findIndex(item => item.id === id);
            if (index !== -1) {
                mock.splice(index, 1);
            }
            return true;
        }
        return await SQLitePlant.delete(id);
    }

    static async deletePlants(ids: string[])
    {
        if (Platform.OS === 'web') {
            ids.forEach(id =>
            {
                const index = mock.findIndex(item => item.id === id);
                if (index !== -1) {
                    mock.splice(index, 1);
                }
            });
            return true;
        }
        return await SQLitePlant.deletes(ids);
    }

    static async getPlant(id: string): Promise<Plant | null>
    {
        if (Platform.OS === 'web') {
            return mock.find(item => item.id === id) || null;
        }
        return await SQLitePlant.findById(id);
    }

    static async getAllPlants(): Promise<Plant[]>
    {
        if (Platform.OS === 'web') {
            return mock;
        }
        return await SQLitePlant.findAll();
    }
}

const mock: Plant[] = [
    {
        id: '1',
        name: '豌豆',
        type: '蔬菜',
        scientificName: 'Pisum sativum',
        description: '常见豆类蔬菜，营养丰富',
        img: '',
        isDead: false,
        areaId: '0',
        todos: []
    },
    {
        id: '2',
        name: '月季',
        type: '灌木',
        scientificName: 'Rosa chinensis',
        description: '中国传统观赏花卉',
        img: 'https://images.pexels.com/photos/12496756/pexels-photo-12496756.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        isDead: false,
        areaId: '0',
        todos: []
    },
    {
        id: '3',
        name: '绿萝',
        type: '观叶植物',
        scientificName: 'Epipremnum aureum',
        description: '适合室内养护的耐阴植物',
        img: '',
        isDead: false,
        areaId: '0',
        todos: []
    },
    {
        id: '4',
        name: '番茄',
        type: '蔬菜',
        scientificName: 'Solanum lycopersicum',
        description: '果实富含维生素C',
        img: '',
        isDead: true,
        areaId: '0',
        todos: []
    },
    {
        id: '5',
        name: '银杏',
        type: '乔木',
        scientificName: 'Ginkgo biloba',
        description: '古老的孑遗植物',
        img: '',
        isDead: false,
        areaId: '0',
        todos: []
    },
    {
        id: '6',
        name: '仙人掌',
        type: '多肉植物',
        scientificName: 'Cactaceae',
        description: '耐旱，适合沙漠环境',
        img: '',
        isDead: false,
        areaId: '0',
        todos: []
    },
    {
        id: '7',
        name: '薰衣草',
        type: '草本植物',
        scientificName: 'Lavandula',
        description: '芳香植物，可制作精油',
        img: '',
        isDead: false,
        areaId: '0',
        todos: []
    },
    {
        id: '8',
        name: '向日葵',
        type: '一年生草本',
        scientificName: 'Helianthus annuus',
        description: '花朵随太阳转动',
        img: '',
        isDead: true,
        areaId: '0',
        todos: []
    },
    {
        id: '9',
        name: '竹子',
        type: '禾本科植物',
        scientificName: 'Bambusoideae',
        description: '生长迅速的多年生植物',
        img: '',
        isDead: false,
        areaId: '0',
        todos: []
    },
    {
        id: '10',
        name: '玫瑰',
        type: '灌木',
        scientificName: 'Rosa rugosa',
        description: '象征爱情的观赏花卉',
        img: '',
        isDead: false,
        areaId: '0',
        todos: []
    }
]