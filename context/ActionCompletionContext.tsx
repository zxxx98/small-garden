import { ITodoModel } from '@/stores/PlantStore';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ActionCompletionContextType {
  visible: boolean;
  show: (todo?: ITodoModel) => void;
  hide: () => void;
  todo?: ITodoModel;
}

const ActionCompletionContext = createContext<ActionCompletionContextType>({
  visible: false,
  show: (todo?: ITodoModel) => {},
  hide: () => {},
  todo: undefined,
});

export const useActionCompletion = () => useContext(ActionCompletionContext);

interface ActionCompletionProviderProps {
  children: ReactNode;
}

export const ActionCompletionProvider = ({ children }: ActionCompletionProviderProps) => {
  const [visible, setVisible] = useState(false);
  const [todo, setTodo] = useState<ITodoModel | undefined>(undefined);

  const show = (todo?: ITodoModel) => {
    setVisible(true);
    setTodo(todo);
  };
  const hide = () => setVisible(false);

  return (
    <ActionCompletionContext.Provider value={{ visible, show, hide, todo }}>
      {children}
    </ActionCompletionContext.Provider>
  );
};