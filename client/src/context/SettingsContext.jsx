<<<<<<< HEAD
import axios from 'axios';
=======
>>>>>>> origin/main
import React, { createContext, useState, useRef, useEffect } from 'react';
export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
<<<<<<< HEAD
    const [selectedTab, setSelectedTab] = useState('camera 0');
    const enableAnnotationsRef = useRef(
    localStorage.getItem('enableAnnotationsRef') === null
        ? true
        : JSON.parse(localStorage.getItem('enableAnnotationsRef'))
    );
    localStorage.setItem('enableAnnotationsRef', JSON.stringify(enableAnnotationsRef.current));
      
    const [fps, setFps] = useState(() => {
        const saved = localStorage.getItem('fps');
        return saved ? parseInt(saved) : 2;
    });

    const [rtspLinks, setRtspLinks] = useState(() => {
        const storedRtspLinks = localStorage.getItem('rtspLinks');
        console.log("storedRtspLinks", storedRtspLinks)
        try {
            return storedRtspLinks ? JSON.parse(storedRtspLinks) : [];
        } catch (error) {
            // If parsing fails (e.g., invalid JSON), return the default value
            console.error('Error parsing rtspLinks from localStorage:', error);
            return [];
        }
=======
    const [ settingsOpen, setSettingsOpen ] = useState(() => {
        const saved = localStorage.getItem('settingsOpen');
        if (saved === null) {
            localStorage.setItem('settingsOpen', JSON.stringify(false))
        }
        return JSON.parse(localStorage.getItem('settingsOpen'));
    });

    const [selectedTab, setSelectedTab] = useState(() => {
        const saved = localStorage.getItem('selectedTab');
        if (saved === null) {
            localStorage.setItem('selectedTab', 'camera 0');
        }
        return localStorage.getItem('selectedTab');
    });

    const enableAnnotationsRef = useRef(
        JSON.parse(localStorage.getItem('enableAnnotationsRef')) ?? true
    );

    // Persist the value on first load
    useEffect(() => {
        if (localStorage.getItem('enableAnnotationsRef') === null) {
            localStorage.setItem('enableAnnotationsRef', JSON.stringify(enableAnnotationsRef.current));
        }
    }, []);
  
            
    const [fps, setFps] = useState(() => {
        const saved = localStorage.getItem('fps');
        if (saved === null) {
            localStorage.setItem('fps', JSON.stringify(2));
        }
        return JSON.parse(localStorage.getItem('fps'));
    });

    const [rtspLinks, setRtspLinks] = useState(() => {
        const saved = localStorage.getItem('rtspLinks')
        if (saved === null) {
            localStorage.setItem('rtspLinks', JSON.stringify(['http://47.51.131.147/-wvhttp-01-/GetOneShot?image_size=1280x720&frame_count=1000000000', 'resources/construction.mp4', 'resources/people.mp4']))
        }
        return JSON.parse(localStorage.getItem('rtspLinks'));
>>>>>>> origin/main
    });

    const [inputSource, setInputSource] = useState(() => {
        const savedSource = localStorage.getItem('inputSource');
<<<<<<< HEAD
        return savedSource || "rtsp";
    });

    const saveSettings = async (newFps, newRtspLinks, newInputSource) => {
        setSelectedTab('camera 0')
=======
        if (savedSource === null) {
            localStorage.setItem('inputSource', "rtsp")
        }
        return localStorage.getItem('inputSource');
    });

    const saveSettings = (newFps, newRtspLinks, newInputSource) => {
        setSelectedTab('camera 0');
        localStorage.setItem('selectedTab', 'camera 0');
>>>>>>> origin/main
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
<<<<<<< HEAD
            if (errors.length === 0) {
                setRtspLinks(newRtspLinks || []);
                console.log('Saving RTSP links:', JSON.stringify(newRtspLinks));
                localStorage.setItem('rtspLinks', JSON.stringify(newRtspLinks) || []);
=======
            if (newRtspLinks.length !== 0 && errors.length === 0) {
                setRtspLinks(newRtspLinks || []);
                console.log('Saving RTSP links:', JSON.stringify(newRtspLinks));
                localStorage.setItem('rtspLinks', JSON.stringify(newRtspLinks) || []);
            } else {
                if (newRtspLinks.length === 0) {
                    console.log('No RTSP links set');
                    errors.push('At least one RTSP link must be set');
                }
>>>>>>> origin/main
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

<<<<<<< HEAD
        if (errors.length === 0) {
            console.log("calllinnng....")
            console.log({newFps, newRtspLinks, newInputSource})
            axios.put(`${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/saveSettings`, {
                username: localStorage.getItem("username"), newFps, newRtspLinks, newInputSource
            }, {
                headers: { 'Content-Type': 'application/json' }
            }).then((res) => {
                if (res.data.status_code === 200) {
                    console.log(res.data.message);
                } else {
                    throw new Error("unable to save settings");
                }
            }).catch((error) => console.log(error));
        }
        
=======
>>>>>>> origin/main
        if (newInputSource !== inputSource && errors.length === 0) {
            toggleCamera(newInputSource); // Toggle camera if input source changes
        }
        // if (newInputSource === "webcam") localStorage.setItem('rtspLinks', JSON.stringify([]));

        return errors;
    };


    const [isCameraEnabled, setIsCameraEnabled] = useState(inputSource === "webcam");
    const [switchSource, setSwitchSource] = useState(false);
    const inFlight = useRef(false);
<<<<<<< HEAD
    const [ settingsOpen, setSettingsOpen ] = useState(false);
=======
>>>>>>> origin/main

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