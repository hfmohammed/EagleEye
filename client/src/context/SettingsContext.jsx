import React, { createContext, useState, useRef } from 'react';
export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [fps, setFps] = useState(() => {
        const saved = localStorage.getItem('fps');
        return saved ? parseInt(saved) : 2;
    });

    const [rtspLink, setRtspLink] = useState(() => {
        return localStorage.getItem('rtspLink') || 'http://47.51.131.147/-wvhttp-01-/GetOneShot?image_size=1280x720&frame_count=1000000000';
    });

    const [inputSource, setInputSource] = useState(() => {
        const savedSource = localStorage.getItem('inputSource');
        return savedSource || 'webcam'; // Default to 'webcam' if no source
    });

    const saveSettings = (newFps, newRtspLink, newInputSource) => {
        if (newInputSource !== inputSource) {
            toggleCamera(); // Toggle camera if input source changes
        }
        if (newInputSource === "webcam") localStorage.setItem('rtspLink', '')
        
        console.log('Saving settings:', { newFps, newRtspLink, newInputSource });
        
        // Validate and save FPS
        const parsedFps = parseInt(newFps);
        if (!isNaN(parsedFps) && parsedFps > 0) {
            console.log('Setting FPS to:', parsedFps);
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


    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const [switchSource, setSwitchSource] = useState(false);
    const inFlight = useRef(false);

    const toggleCamera = () => {
        setIsCameraEnabled(prev => !prev);
        inFlight.current = false;
    };

    return (
        <SettingsContext.Provider value={{ isCameraEnabled, setIsCameraEnabled, toggleCamera, inFlight, switchSource, setSwitchSource, fps, setFps, saveSettings, rtspLink, setRtspLink, inputSource, setInputSource }}>
            {children}
        </SettingsContext.Provider>
    );
}