import axios from 'axios';
import React, { createContext, useState, useRef, useEffect, useCallback } from 'react';
import { defaultNotificationPrefs } from '../lib/streamAlerts';

export const SettingsContext = createContext();

const NOTIF_PREFS_KEY = 'eagle_notification_prefs';
const PROFILE_PREFS_KEY = 'eagle_profile_prefs';

const defaultProfilePrefs = {
    displayName: '',
    notes: '',
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
};

function loadJsonPrefs(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return { ...fallback };
        return { ...fallback, ...JSON.parse(raw) };
    } catch {
        return { ...fallback };
    }
}

export const SettingsProvider = ({ children }) => {
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
    });

    const [inputSource, setInputSource] = useState(() => {
        const savedSource = localStorage.getItem('inputSource');
        return savedSource || "rtsp";
    });

    const saveSettings = async (newFps, newRtspLinks, newInputSource) => {
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
            if (errors.length === 0) {
                setRtspLinks(newRtspLinks || []);
                console.log('Saving RTSP links:', JSON.stringify(newRtspLinks));
                localStorage.setItem('rtspLinks', JSON.stringify(newRtspLinks) || []);
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
    const [ analyticsOpen, setAnalyticsOpen ] = useState(false);
    const [ profileOpen, setProfileOpen ] = useState(false);
    const [ notificationsOpen, setNotificationsOpen ] = useState(false);

    const [notificationPrefs, setNotificationPrefsState] = useState(() =>
        loadJsonPrefs(NOTIF_PREFS_KEY, defaultNotificationPrefs),
    );
    const setNotificationPrefs = useCallback((patch) => {
        setNotificationPrefsState((prev) => {
            const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
            localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const [profilePrefs, setProfilePrefsState] = useState(() =>
        loadJsonPrefs(PROFILE_PREFS_KEY, defaultProfilePrefs),
    );
    const setProfilePrefs = useCallback((patch) => {
        setProfilePrefsState((prev) => {
            const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
            localStorage.setItem(PROFILE_PREFS_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const toggleCamera = (newInputSource) => {
        setIsCameraEnabled(newInputSource === "webcam");
        inFlight.current = false;
    };

    return (
        <SettingsContext.Provider value={{ isCameraEnabled, setIsCameraEnabled, toggleCamera, inFlight, switchSource, setSwitchSource, fps, setFps, saveSettings, rtspLinks, setRtspLinks, inputSource, setInputSource, settingsOpen, setSettingsOpen, analyticsOpen, setAnalyticsOpen, profileOpen, setProfileOpen, notificationsOpen, setNotificationsOpen, notificationPrefs, setNotificationPrefs, profilePrefs, setProfilePrefs, selectedTab, setSelectedTab, enableAnnotationsRef }}>
            {children}
        </SettingsContext.Provider>
    );
}