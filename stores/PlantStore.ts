import { types, Instance, flow, getParentOfType, IAnyModelType } from 'mobx-state-tree';
import { PlantManager } from '@/models/PlantManager';
import { rootStore } from './RootStore';
import { addDays } from 'date-fns';
import { endOfDay } from 'date-fns';

const TodoModel = types.model('Todo', {
  plantId: types.string,
  isRecurring: types.boolean,
  actionName: types.string,
  recurringUnit: types.string,
  recurringInterval: types.number,
  nextRemindTime: types.number,
  remark: types.string,
}).views(self => {
  return {
    get plant(): IPlantModel {
      return getParentOfType(self, PlantModel);
    }
  }
})
export interface ITodoModel extends Instance<typeof TodoModel> { }

const PlantModel = types.model('Plant', {
  id: types.identifier,
  name: types.string,
  type: types.string,
  scientificName: types.maybeNull(types.string),
  description: types.string,
  img: types.string,
  isDead: types.boolean,
  todos: types.array(TodoModel),
  areaId: types.string,
}).views(self => {
  const getActions = () => {
    return rootStore.actionStore.actions.filter(action => action.plantId === self.id);
  };
  // 按nextRemindTime排序 离当前时间越近的越靠前
  const getSortTodos = () => {
    return self.todos.slice().sort((a, b) => a.nextRemindTime - b.nextRemindTime);
  }
  return {
    get actions() {
      return getActions();
    },
    get sortTodos() {
      return getSortTodos();
    },

    get lastActionAndNextAction() {
      const actions = getActions();
      const lastAction = actions[actions.length - 1];
      const nextTodo = getSortTodos()[0];
      return {
        last: lastAction ? {
          name: lastAction.name,
          time: lastAction.time,
        } : null,
        next: nextTodo ? {
          name: nextTodo.actionName,
          time: nextTodo.nextRemindTime,
        } : null
      }
    }
  }
}).actions((self) => ({
  addTodo: flow(function* (todo: ITodoModel) {
    self.todos.push(todo);
    const success = yield PlantManager.updatePlant(self);
    return success;
  }),
  updateTodo: flow(function* (todo: ITodoModel) {
    const index = self.todos.findIndex(t => t.actionName === todo.actionName);
    if (index !== -1) {
      // 更新todo
      self.todos.splice(index, 1, todo);
      const success = yield PlantManager.updatePlant(self);
      return success;
    }
    return false;
  }),
  deleteTodo: flow(function* (todo: ITodoModel) {
    const index = self.todos.findIndex(t => t.actionName === todo.actionName);
    if (index !== -1) {
      self.todos.splice(index, 1);
      const success = yield PlantManager.updatePlant(self);
      return success;
    }
    return false;
  })
}));

export interface IPlantModel extends Instance<typeof PlantModel> { }

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
    // 将待办分为今天/明天/后天
    get separateTodoItems() {
      const today = endOfDay(new Date());
      const todayTime = today.getTime();
      const tomorrow = addDays(today, 1);
      const tomorrowTime = tomorrow.getTime();
      const afterTomorrow = addDays(today, 2);
      const afterTomorrowTime = afterTomorrow.getTime();

      const todayItems: ITodoModel[] = [];
      const tomorrowItems: ITodoModel[] = [];
      const afterTomorrowItems: ITodoModel[] = [];

      for (let i = 0; i < self.plants.length; i++) {
        const plant = self.plants[i];
        for (let j = 0; j < plant.todos.length; j++) {
          const todo = plant.todos[j];
          if (todo.nextRemindTime < todayTime) {
            todayItems.push(todo);
          }
          else if (todo.nextRemindTime < tomorrowTime) {
            tomorrowItems.push(todo);
          }
          else if (todo.nextRemindTime < afterTomorrowTime) {
            afterTomorrowItems.push(todo);
          }
        }
      }
      return { todayItems, tomorrowItems, afterTomorrowItems };
    }
  }))
  .actions((self) => ({
    loadPlants: flow(function* () {
      try {
        yield PlantManager.deletePlant("d602f8424adf08c105fd4");
        const plants = yield PlantManager.getAllPlants();
        self.plants.replace(plants);
      } catch (error) {
        console.error('加载植物失败:', error);
      }
    }),

    addPlant: flow(function* (plant: IPlantModel) {
      try {
        plant.scientificName = '';
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
        plant.scientificName = '';
        const success = yield PlantManager.updatePlant(plant);
        if (success) {
          const index = self.plants.findIndex(p => p.id === plant.id);
          if (index !== -1) {
            self.plants.splice(index, 1, plant);
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