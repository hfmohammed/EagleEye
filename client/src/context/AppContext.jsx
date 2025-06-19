import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [fps, setFps] = useState(() => {
        const saved = localStorage.getItem('fps');
        return saved ? parseInt(saved) : 2;
    });

    const [rtspLink, setRtspLink] = useState(() => {
        return localStorage.getItem('rtspLink') || '';
    });

    const [inputSource, setInputSource] = useState(() => {
        return localStorage.getItem('inputSource') || 'webcam';
    });

    // Force a rerender when settings change
    useEffect(() => {
        console.log('Input source changed to:', inputSource);
    }, [inputSource]);

    const saveSettings = (newFps, newRtspLink, newInputSource) => {
        console.log('Saving settings:', { newFps, newRtspLink, newInputSource });
        
        // Validate and save FPS
        const parsedFps = parseInt(newFps);
        if (!isNaN(parsedFps) && parsedFps > 0) {
            setFps(parsedFps);
            localStorage.setItem('fps', parsedFps.toString());
        }

        // Save RTSP link
        setRtspLink(newRtspLink || '');
        localStorage.setItem('rtspLink', newRtspLink || '');

        // Save input source
        if (newInputSource) {
            setInputSource(newInputSource);
            localStorage.setItem('inputSource', newInputSource);
        }
    };

    return (
        <AppContext.Provider value={{
            fps,
            rtspLink,
            inputSource,
            saveSettings
        }}>
            {children}
        </AppContext.Provider>
    );
};
