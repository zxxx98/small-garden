import { types, Instance, flow } from 'mobx-state-tree';
import { PlantStore, PlantStoreType } from './PlantStore';
import { ActionStore, ActionStoreType } from './ActionStore';
import { SettingStore, SettingStoreType } from './SettingStore';
import { LogStore } from './LogStore';

export const RootStore = types
  .model('RootStore', {
    plantStore: types.optional(PlantStore, {}),
    actionStore: types.optional(ActionStore, {}),
    settingStore: types.optional(SettingStore, {}),
    logStore: LogStore,
  })
  .actions(self=>{
    return {
      init: flow(function* (){
      // 初始化时加载数据
      self.plantStore.loadPlants();
      self.actionStore.loadActions();
      self.settingStore.fetchAreas();
      self.settingStore.fetchCategories();
      self.settingStore.fetchActionTypes();
      })
    }
  });

export type RootStoreType = {
  plantStore: PlantStoreType;
  actionStore: ActionStoreType;
  settingStore: SettingStoreType;
  logStore: any;
  init: () => Promise<void>;
};

export let rootStore: RootStoreType;

export function initRootStore() {
  if (!rootStore) {
    console.log('initRootStore');
    rootStore = RootStore.create({
      plantStore: {},
      settingStore: {},
      logStore: {},
    });
    (globalThis as any).rootStore = rootStore;
  }
}