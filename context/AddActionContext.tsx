import React, { createContext, useContext, useState } from 'react';

interface AddActionContextType {
    visible: boolean;
    open: () => void;
    hide: () => void;
}

const AddActionContext = createContext<AddActionContextType | undefined>(undefined);

export const AddActionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [visible, setVisible] = useState(false);

    const open = () => {
        setVisible(true);
    };

    const hide = () => {
        setVisible(false);
    };

    return (
        <AddActionContext.Provider value={{ visible, open, hide }}>
            {children}
        </AddActionContext.Provider>
    );
};

export const useAddAction = () => {
    const context = useContext(AddActionContext);
    if (context === undefined) {
        throw new Error('useAddAction must be used within a AddActionProvider');
    }
    return context;
}; 