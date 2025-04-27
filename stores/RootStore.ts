import { types, Instance } from 'mobx-state-tree';
import { PlantStore } from './PlantStore';
import { ActionStore } from './ActionStore';
import { SettingStore } from './SettingStore';

const RootStore = types
  .model('RootStore', {
    plantStore: types.optional(PlantStore, {}),
    actionStore: types.optional(ActionStore, {}),
    settingStore: types.optional(SettingStore, {}),
  })
  .actions((self) => ({
    afterCreate() {
      // 初始化时加载数据
      self.plantStore.loadPlants();
      self.actionStore.loadActions();
      self.settingStore.fetchAreas();
      self.settingStore.fetchCategories();
      self.settingStore.fetchActionTypes();
    },
  }));

export type RootStoreType = Instance<typeof RootStore>;


export let rootStore: RootStoreType;

export function initRootStore() {
  rootStore = RootStore.create();
}