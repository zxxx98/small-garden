import { types, Instance, flow } from 'mobx-state-tree';
import { ActionManager } from '@/models/ActionManager';
import { Action } from '@/types/action';

const ActionModel = types.model('Action', {
  id: types.identifier,
  name: types.string,
  plantId: types.string,
  time: types.number,
  remark: types.string,
  imgs: types.array(types.string),
  done: types.boolean,
  isRecurring: types.maybe(types.boolean),
  recurringInterval: types.maybe(types.number),
  parentRecurringId: types.maybe(types.string),
});

interface IActionModel extends Instance<typeof ActionModel> { }

export const ActionStore = types
  .model('ActionStore', {
    actions: types.array(ActionModel)
  })
  .actions((self) => ({
    loadActions: flow(function* () {
      try {
        const actions = yield ActionManager.getAllActions();
        self.actions.replace(actions);
      } catch (error) {
        console.error('加载行为失败:', error);
      }
    }),

    addAction: flow(function* (action: IActionModel) {
      try {
        const success = yield ActionManager.addAction(action);
        if (success) {
          self.actions.push(action);
        }
        return success;
      } catch (error) {
        console.error('添加行为失败:', error);
      }
    }),

    updateAction: flow(function* (action: IActionModel) {
      try {
        const success = yield ActionManager.updateAction(action);
        if (success) {
          const index = self.actions.findIndex(a => a.id === action.id);
          if (index !== -1) {
            self.actions[index] = action;
          }
        }
        return success;
      } catch (error) {
        console.error('更新行为失败:', error);
      }
    }),

    deleteAction: flow(function* (actionId: string) {
      try {
        const success = yield ActionManager.deleteAction(actionId);
        if (success) {
          const index = self.actions.findIndex(a => a.id === actionId);
          if (index !== -1) {
            self.actions.splice(index, 1);
          }
        }
        return success;
      } catch (error) {
        console.error('删除行为失败:', error);
      }
    }),

    getActionsByPlantId: flow(function* (plantId: string) {
      try {
        const actions = yield ActionManager.getActionsByPlantId(plantId);
        return actions;
      } catch (error) {
        console.error('获取植物行为失败:', error);
        return [];
      }
    }),

    getLastAndNextAction: flow(function* (plantId: string) {
      try {
        const result = yield ActionManager.getLastAndNextAction(plantId);
        return result;
      } catch (error) {
        console.error('获取植物最近行为失败:', error);
        return { lastAction: null, nextAction: null };
      }
    }),
  }));

export type ActionStoreType = Instance<typeof ActionStore>; 