import React, { createContext, useState, useRef } from 'react';
export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const inFlight = useRef(false);

    const toggleCamera = () => {
        setIsCameraEnabled(prev => !prev);
    };

    return (
        <SettingsContext.Provider value={{ isCameraEnabled, setIsCameraEnabled, toggleCamera, inFlight }}>
            {children}
        </SettingsContext.Provider>
    );
}