import { types, Instance, flow } from 'mobx-state-tree';
import { PlantManager } from '@/models/PlantManager';

const PlantModel = types.model('Plant', {
  id: types.identifier,
  name: types.string,
  type: types.string,
  scientificName: types.maybeNull(types.string),
  remark: types.string,
  img: types.string,
  isDead: types.boolean,
});

interface IPlantModel extends Instance<typeof PlantModel> { }

export const PlantStore = types
  .model('PlantStore', {
    plants: types.array(PlantModel),
  })
  .views((self) => ({
    get deadPlants() {
      return self.plants.filter(plant => plant.isDead);
    },
    get alivePlants() {
      return self.plants.filter(plant => !plant.isDead);
    },
  }))
  .actions((self) => ({
    loadPlants: flow(function* () {
      try {
        const plants = yield PlantManager.getAllPlants();
        self.plants.replace(plants);
      } catch (error) {
        console.error('加载植物失败:', error);
      }
    }),

    addPlant: flow(function* (plant: IPlantModel) {
      try {
        const success = yield PlantManager.addPlant(plant);
        if (success) {
          self.plants.push(plant);
        }
        return success;
      } catch (error) {
        console.error('添加植物失败:', error);
      }
    }),

    updatePlant: flow(function* (plant: IPlantModel) {
      try {
        const success = yield PlantManager.updatePlant(plant);
        if (success) {
          const index = self.plants.findIndex(p => p.id === plant.id);
          if (index !== -1) {
            self.plants[index] = plant;
          }
        }
        return success;
      } catch (error) {
        console.error('更新植物失败:', error);
      }
    }),

    deletePlants: flow(function* (plantIds: string[]) {
      try {
        const success = yield PlantManager.deletePlants(plantIds);
        if (success) {
          self.plants.replace(self.plants.filter(p => !plantIds.includes(p.id)));
        }
        return success;
      } catch (error) {
        console.error('删除植物失败:', error);
      }
    }),

    moveToCemeterys: flow(function* (plantIds: string[]) {
      const plants = self.plants.filter(p => plantIds.includes(p.id));
      const success = yield PlantManager.updatePlants(plants.map(p => ({ ...p, isDead: true })));
      if (success) {
        self.plants.replace(self.plants.filter(p => !plantIds.includes(p.id)));
      }
      return success;
    }), 
  }));

export type PlantStoreType = Instance<typeof PlantStore>; 