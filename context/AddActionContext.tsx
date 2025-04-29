import React, { createContext, useContext, useState, lazy, Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';

const AddAction = lazy(() => import('@/components/addAction/add-action'));

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
            <Suspense fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>}>
                {visible && <AddAction />}
            </Suspense>
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