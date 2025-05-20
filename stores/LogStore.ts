import { types, Instance, flow } from 'mobx-state-tree';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LogEntry = types.model('LogEntry', {
  id: types.identifier,
  timestamp: types.number,
  type: types.string,
  message: types.string,
  details: types.optional(types.frozen(), {}),
});

export interface ILogEntry extends Instance<typeof LogEntry> {}

export const LogStore = types
  .model('LogStore', {
    logs: types.array(LogEntry),
  })
  .actions((self) => {
    const saveLogs = flow(function* () {
      try {
        const logsJson = JSON.stringify(self.logs);
        yield AsyncStorage.setItem('logs', logsJson);
      } catch (error) {
        console.error('Failed to save logs:', error);
      }
    });

    return {
      addLog: flow(function* (type: string, message: string, details?: any) {
        const logEntry = LogEntry.create({
          id: Date.now().toString(),
          timestamp: Date.now(),
          type,
          message,
          details,
        });

        self.logs.unshift(logEntry);
        yield saveLogs();
      }),

      clearLogs: flow(function* () {
        self.logs.clear();
        yield saveLogs();
      }),

      loadLogs: flow(function* () {
        try {
          const logsJson = yield AsyncStorage.getItem('logs');
          if (logsJson) {
            const logs = JSON.parse(logsJson);
            self.logs.replace(logs);
          }
        } catch (error) {
          console.error('Failed to load logs:', error);
        }
      }),
    };
  })
  .views((self) => ({
    getLogsByType: (type: string) => {
      return self.logs.filter((log) => log.type === type);
    },
  }));

export interface ILogStore extends Instance<typeof LogStore> {} 