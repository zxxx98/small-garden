import { types, Instance, flow } from 'mobx-state-tree';
import { ActionManager } from '@/models/ActionManager';

const ActionModel = types.model('Action', {
  id: types.identifier,
  name: types.string,
  plantId: types.string,
  time: types.number,
  remark: types.string,
  imgs: types.array(types.string)
});

export interface IActionModel extends Instance<typeof ActionModel> { }

export const ActionStore = types
  .model('ActionStore', {
    actions: types.array(ActionModel)
  })
  .views(self => {
    return {
      getActionsByTimeRange: (startTime: number, endTime: number) => {
        return self.actions.filter(action => action.time >= startTime && action.time <= endTime);
      }
    }
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
  }));

export type ActionStoreType = Instance<typeof ActionStore>; 