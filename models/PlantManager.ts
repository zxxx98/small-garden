import { Platform } from 'react-native';
import { Plant } from '../types/plant';
import { database } from './watermelon/database';
import { Plant as WatermelonPlant } from './watermelon/Plant';

export class PlantManager
{
    static async addPlant(plant: Plant)
    {
        if (Platform.OS === 'web') {
            mock.push(plant);
            return true;
        }
        await database.write(async () =>
        {
            await database.get<WatermelonPlant>('plants').create(record =>
            {
                record._raw.id = plant.id;
                record.name = plant.name;
                record.type = plant.type;
                record.scientificName = plant.scientificName;
                record.remark = plant.remark;
                record.img = plant.img;
                record.isDead = plant.isDead;
            });
        });
        return true;
    }

    static async updatePlant(plant: Plant)
    {
        if (Platform.OS === 'web') {
            const index = mock.findIndex(item => item.id === plant.id);
            if (index !== -1) {
                mock[index] = plant;
            }
        }
        const record = await database.get<WatermelonPlant>('plants').find(plant.id);
        await database.write(async () =>
        {
            await record.update(item =>
            {
                item.name = plant.name;
                item.type = plant.type;
                item.scientificName = plant.scientificName;
                item.remark = plant.remark;
                item.img = plant.img;
                item.isDead = plant.isDead;
            });
        });
    }

    static async deletePlant(id: string)
    {
        if (Platform.OS === 'web') {
            const index = mock.findIndex(item => item.id === id);
            if (index !== -1) {
                mock.splice(index, 1);
            }
        }
        const record = await database.get<WatermelonPlant>('plants').find(id);
        await database.write(async () =>
        {
            await record.destroyPermanently();
        });
    }

    static async getPlant(id: string): Promise<Plant | null>
    {
        if (Platform.OS === 'web') {
            return mock.find(item => item.id === id) || null;
        }
        try {
            const record = await database.get<WatermelonPlant>('plants').find(id);
            return record.toJSON() as Plant;
        } catch (error) {
            return null;
        }
    }

    static async getAllPlants(): Promise<Plant[]>
    {
        if (Platform.OS === 'web') {
            return mock;
        }
        const records = await database.get<WatermelonPlant>('plants').query().fetch();
        return records.map(record => record.toJSON() as Plant);
    }
}

const mock: Plant[] = [
    {
        id: '1',
        name: '豌豆',
        type: '蔬菜',
        scientificName: 'Pisum sativum',
        remark: '常见豆类蔬菜，营养丰富',
        img: '',
        isDead: false
    },
    {
        id: '2',
        name: '月季',
        type: '灌木',
        scientificName: 'Rosa chinensis',
        remark: '中国传统观赏花卉',
        img: 'https://images.pexels.com/photos/12496756/pexels-photo-12496756.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        isDead: false
    },
    {
        id: '3',
        name: '绿萝',
        type: '观叶植物',
        scientificName: 'Epipremnum aureum',
        remark: '适合室内养护的耐阴植物',
        img: '',
        isDead: false
    },
    {
        id: '4',
        name: '番茄',
        type: '蔬菜',
        scientificName: 'Solanum lycopersicum',
        remark: '果实富含维生素C',
        img: '',
        isDead: true
    },
    {
        id: '5',
        name: '银杏',
        type: '乔木',
        scientificName: 'Ginkgo biloba',
        remark: '古老的孑遗植物',
        img: '',
        isDead: false
    },
    {
        id: '6',
        name: '仙人掌',
        type: '多肉植物',
        scientificName: 'Cactaceae',
        remark: '耐旱，适合沙漠环境',
        img: '',
        isDead: false
    },
    {
        id: '7',
        name: '薰衣草',
        type: '草本植物',
        scientificName: 'Lavandula',
        remark: '芳香植物，可制作精油',
        img: '',
        isDead: false
    },
    {
        id: '8',
        name: '向日葵',
        type: '一年生草本',
        scientificName: 'Helianthus annuus',
        remark: '花朵随太阳转动',
        img: '',
        isDead: true
    },
    {
        id: '9',
        name: '竹子',
        type: '禾本科植物',
        scientificName: 'Bambusoideae',
        remark: '生长迅速的多年生植物',
        img: '',
        isDead: false
    },
    {
        id: '10',
        name: '玫瑰',
        type: '灌木',
        scientificName: 'Rosa rugosa',
        remark: '象征爱情的观赏花卉',
        img: '',
        isDead: false
    }
]