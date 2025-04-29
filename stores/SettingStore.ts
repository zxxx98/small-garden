import { types, flow, Instance } from 'mobx-state-tree';
import { ConfigManager } from '../models/ConfigManager';
import { PlantManager } from '../models/PlantManager';
import { Area } from '../types/config';
import { Category } from '../context/CategoryContext';
import { ActionType } from '../types/action';
import { Plant } from '../types/plant';

// 区域模型
const AreaModel = types.model('Area', {
  id: types.identifier,
  name: types.string,
});

// 分类模型
const CategoryModel = types.model('Category', {
  id: types.identifier,
  name: types.string,
});

// 操作类型模型
const ActionTypeModel = types.model('ActionType', {
  name: types.string,
  iconName: types.string,
  color: types.string,
  pack: types.maybe(types.string),
  useCustomImage: types.boolean,
});

// 设置存储
export const SettingStore = types
  .model('SettingStore', {
    areas: types.array(AreaModel),
    categories: types.array(CategoryModel),
    actionTypes: types.array(ActionTypeModel),
  })
  .actions((self) => ({
    fetchAreas: flow(function* () {
      try {
        const areas:Area[] = yield ConfigManager.getInstance().getAreas();
        self.areas.replace(areas.map(area => ({
          id: area.id,
          name: area.name,
        })));
      } catch (error) {
        console.error('获取区域失败:', error);
      }
    }),

    addArea: flow(function* (area: Area) {
      try {
        yield ConfigManager.getInstance().addArea(area);
        self.areas.push({
          id: area.id,
          name: area.name,
        });
      } catch (error) {
        console.error('添加区域失败:', error);
      }
    }),

    updateArea: flow(function* (area: Area) {
      try {
        yield ConfigManager.getInstance().updateArea(area);
        const index = self.areas.findIndex(a => a.id === area.id);
        if (index !== -1) {
          self.areas[index] = {
            id: area.id,
            name: area.name,
          };
        }
      } catch (error) {
        console.error('更新区域失败:', error);
      }
    }),

    deleteArea: flow(function* (areaId: string) {
      try {
        yield ConfigManager.getInstance().deleteArea(areaId);
        const index = self.areas.findIndex(a => a.id === areaId);
        if (index !== -1) {
          self.areas.splice(index, 1);
        }
      } catch (error) {
        console.error('删除区域失败:', error);
      }
    }),

    fetchCategories: flow(function* () {
      try {
        const categories:Category[] = yield ConfigManager.getInstance().getCategories();
        self.categories.replace(categories.map(category => ({
          id: category.id,
          name: category.name,
        })));
      } catch (error) {
        console.error('获取分类失败:', error);
      }
    }),

    addCategory: flow(function* (category: Category) {
      try {
        yield ConfigManager.getInstance().addCategory(category);
        self.categories.push({
          id: category.id,
          name: category.name,
        });
      } catch (error) {
        console.error('添加分类失败:', error);
      }
    }),

    updateCategory: flow(function* (category: Category) {
      try {
        yield ConfigManager.getInstance().updateCategory(category);
        const index = self.categories.findIndex(c => c.id === category.id);
        if (index !== -1) {
          self.categories[index] = {
            id: category.id,
            name: category.name,
          };
        }
      } catch (error) {
        console.error('更新分类失败:', error);
      }
    }),

    deleteCategory: flow(function* (categoryId: string) {
      try {
        yield ConfigManager.getInstance().deleteCategory(categoryId);
        const index = self.categories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
          self.categories.splice(index, 1);
        }
      } catch (error) {
        console.error('删除分类失败:', error);
      }
    }),

    fetchActionTypes: flow(function* () {
      try {
        const actionTypes:ActionType[] = yield ConfigManager.getInstance().getActionTypes();
        self.actionTypes.replace(actionTypes.map(actionType => ({
          name: actionType.name,
          iconName: actionType.iconName || '',
          color: actionType.color,
          pack: actionType.pack,
          useCustomImage: Boolean(actionType.useCustomImage),
        })));
      } catch (error) {
        console.error('获取操作类型失败:', error);
      }
    }),

    addActionType: flow(function* (actionType: ActionType) {
      try {
        yield ConfigManager.getInstance().addActionType(actionType);
        self.actionTypes.push({
          name: actionType.name,
          iconName: actionType.iconName || '',
          color: actionType.color,
          pack: actionType.pack,
          useCustomImage: Boolean(actionType.useCustomImage),
        });
      } catch (error) {
        console.error('添加操作类型失败:', error);
      }
    }),

    updateActionType: flow(function* (actionType: ActionType) {
      try {
        yield ConfigManager.getInstance().updateActionType(actionType);
        const index = self.actionTypes.findIndex(a => a.name === actionType.name);
        if (index !== -1) {
          self.actionTypes[index] = {
            name: actionType.name,
            iconName: actionType.iconName || '',
            color: actionType.color,
            pack: actionType.pack,
            useCustomImage: Boolean(actionType.useCustomImage),
          };
        }
      } catch (error) {
        console.error('更新操作类型失败:', error);
      }
    }),

    deleteActionType: flow(function* (actionTypeName: string) {
      try {
        yield ConfigManager.getInstance().deleteActionType(actionTypeName);
        const index = self.actionTypes.findIndex(a => a.name === actionTypeName);
        if (index !== -1) {
          self.actionTypes.splice(index, 1);
        }
      } catch (error) {
        console.error('删除操作类型失败:', error);
      }
    }),
  }));

export type SettingStoreType = Instance<typeof SettingStore>;