import React, { createContext, useState, useRef, useEffect } from 'react';
export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [selectedTab, setSelectedTab] = useState('camera 0');
    const enableAnnotationsRef = useRef(() => {
        const stored = localStorage.getItem('enableAnnotationsRef');
        if (stored === null) {
            localStorage.setItem('enableAnnotationsRef', JSON.stringify(true));
        }
        return stored !== null ? JSON.parse(stored) : true;
      });
      
    const [fps, setFps] = useState(() => {
        const saved = localStorage.getItem('fps');
        return saved ? parseInt(saved) : 2;
    });

    const [rtspLinks, setRtspLinks] = useState(() => {
        return JSON.parse(localStorage.getItem('rtspLinks')) || ['http://47.51.131.147/-wvhttp-01-/GetOneShot?image_size=1280x720&frame_count=1000000000', 'resources/cars.mp4', 'resources/people.mp4'];
    });

    const [inputSource, setInputSource] = useState(() => {
        const savedSource = localStorage.getItem('inputSource');
        return savedSource || 'rtsp'; // Default to 'rtsp' if no source
    });

    const saveSettings = (newFps, newRtspLinks, newInputSource) => {
        setSelectedTab('camera 0')
        const errors = [];
        console.log('Saving settings:', { newFps, newRtspLinks, newInputSource });
        
        // Validate and save FPS
        const parsedFps = parseInt(newFps);
        if (errors.length === 0 && !isNaN(parsedFps) && parsedFps > 0) {
            console.log('Setting FPS to:', parsedFps);
            setFps(Number(newFps));
            localStorage.setItem('fps', parsedFps.toString());
        } else {
            console.log(errors)
            console.log('Invalid FPS:', parsedFps);
            errors.push(isNaN(parsedFps) ? 'FPS must be set' : 'Invalid FPS');
        }
        
        if (newInputSource === "rtsp") {
            // Save RTSP link
            newRtspLinks = newRtspLinks.filter(link => link.trim())
            if (newRtspLinks.length !== 0 && errors.length === 0) {
                setRtspLinks(newRtspLinks || []);
                console.log('Saving RTSP links:', JSON.stringify(newRtspLinks));
                localStorage.setItem('rtspLinks', JSON.stringify(newRtspLinks) || []);
            } else {
                if (newRtspLinks.length === 0) {
                    console.log('No RTSP links set');
                    errors.push('At least one RTSP link must be set');
                }
            }
        }

        // Save input source
        if (newInputSource && errors.length === 0) {
            setInputSource(newInputSource);
            localStorage.setItem('inputSource', newInputSource);
        } else {
            if (!newInputSource) {
                console.log('Invalid input source:', newInputSource);
                errors.push('Invalid input source');
            }
        }

        if (newInputSource !== inputSource && errors.length === 0) {
            toggleCamera(newInputSource); // Toggle camera if input source changes
        }
        // if (newInputSource === "webcam") localStorage.setItem('rtspLinks', JSON.stringify([]));

        return errors;
    };


    const [isCameraEnabled, setIsCameraEnabled] = useState(inputSource === "webcam");
    const [switchSource, setSwitchSource] = useState(false);
    const inFlight = useRef(false);
    const [ settingsOpen, setSettingsOpen ] = useState(false);

    const toggleCamera = (newInputSource) => {
        setIsCameraEnabled(newInputSource === "webcam");
        inFlight.current = false;
    };

    return (
        <SettingsContext.Provider value={{ isCameraEnabled, setIsCameraEnabled, toggleCamera, inFlight, switchSource, setSwitchSource, fps, setFps, saveSettings, rtspLinks, setRtspLinks, inputSource, setInputSource, settingsOpen, setSettingsOpen, selectedTab, setSelectedTab, enableAnnotationsRef }}>
            {children}
        </SettingsContext.Provider>
    );
}