import React, { createContext, useState, useRef } from 'react';
export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [isCameraEnabled, setIsCameraEnabled] = useState(true);
    const inFlight = useRef(false);

    const toggleCamera = () => {
        setIsCameraEnabled(prev => !prev);
        inFlight.current = false;
    };

    return (
        <SettingsContext.Provider value={{ isCameraEnabled, setIsCameraEnabled, toggleCamera, inFlight }}>
            {children}
        </SettingsContext.Provider>
    );
}