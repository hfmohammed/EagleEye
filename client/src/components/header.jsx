import React, { useContext, useState, useEffect } from 'react';
import { SettingsContext } from '../context/SettingsContext';

const Header = () => {
    const { isCameraEnabled, setIsCameraEnabled, toggleCamera, inflight, switchSource, fps, setFps, rtspLink, setRtspLink, inputSource, setInputSource, saveSettings } = useContext(SettingsContext);
    const [ settingsOpen, setSettingsOpen ] = useState(false);
    const [ currentFps, setCurrentFps ] = useState(fps);
    const [ currentRtspLink, setCurrentRtspLink ] = useState(rtspLink || '');
    const [ selectedSource, setSelectedSource ] = useState(inputSource);

    // Update local state when context values change
    useEffect(() => {
        setSelectedSource(inputSource);
        setCurrentFps(fps);
        setCurrentRtspLink(rtspLink || '');
    }, [inputSource, fps, rtspLink]);

    const handleSourceChange = (event) => {
        const newSource = event.target.value;
        console.log('Source changed to:', newSource);
        setSelectedSource(newSource);
    };

    const _saveSettings = () => {
        if (selectedSource === "webcam") {
            setCurrentRtspLink(''); // Clear RTSP link if webcam is selected
        }
        console.log('Saving settings:', { currentFps, currentRtspLink, selectedSource });
        saveSettings(currentFps, currentRtspLink, selectedSource);
        setSettingsOpen(false);
    }

    return (
        <>
            <header className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
                {/* Logo Section */}
                <section>
                    <h1 className="text-2xl font-bold text-gray-800">EagleEye</h1>
                </section>

                <section className="flex items-center space-x-4">
                    {/* Settings Button */}
                    <button className='bg-gray-300 text-white rounded-full cursor-pointer px-3 py-2 hover:bg-gray-400' onClick={() => setSettingsOpen(!settingsOpen)}>
                        ⚙️
                    </button>

                    {/* Sign Out Button */}
                    <button className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 hover:cursor-pointer">
                        Sign out
                    </button>
                </section>
            </header>
            
            {/* {!switchSource && (            
                <button
                    onClick={() => {
                        toggleCamera();
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold hover:cursor-pointer
                        ${isCameraEnabled
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }
                    `}>

                    {isCameraEnabled ? 'Switch to pre-recorded input or livestream' : 'Switch to Webcam'}

                </button>
            )} */}

            {/* Settings popup */}
            {settingsOpen && 
                <section className="bg-gray-300 fixed top-0 left-0 z-50 w-1/2 h-1/2 transform translate-x-1/2 translate-y-1/2 rounded-lg shadow-lg px-6 py-4 settings-popup">
                    <div className="flex items-start justify-between h-auto my-2">
                        <h1 className="text-2xl font-bold text-gray-800">
                            Settings
                        </h1>

                        <button className="rounded-lg cursor-pointer bg-white px-4 py-2" onClick={() => setSettingsOpen(false)}>x</button>
                    </div>

                    <div className="flex flex-col space-y-4 my-4">
                        <div className="flex items-center fps-input-section">
                            <label className="mx-1">FPS:</label>
                            <input 
                                className="mx-2 px-1 bg-white rounded border-gray-600 border-1 fps-input" 
                                type="number" 
                                value={currentFps}
                                onChange={(e) => setCurrentFps(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="mx-1">Input Source:</label>
                            <input 
                                className="ml-2" 
                                type="radio" 
                                name="input-source" 
                                id="webcam-input-source" 
                                value="webcam" 
                                checked={selectedSource === "webcam"}
                                onChange={handleSourceChange}
                            />
                            <label className="mx-1" htmlFor="webcam-input-source">Webcam</label>

                            <input 
                                className="ml-2" 
                                type="radio" 
                                name="input-source" 
                                id="rtsp-input-source" 
                                value="rtsp" 
                                checked={selectedSource === "rtsp"}
                                onChange={handleSourceChange}
                            />
                            <label className="mx-1" htmlFor="rtsp-input-source">RTSP</label>
                        </div>

                        {selectedSource === "rtsp" && (
                            <>
                                <div className="flex items-center">
                                    <label className="mx-1">RTSP link:</label>
                                    <input 
                                        className="mx-2 px-1 bg-white rounded border-gray-600 border-1" 
                                        type="text" 
                                        placeholder="RTSP link" 
                                        value={currentRtspLink}
                                        onChange={(e) => setCurrentRtspLink(e.target.value)}
                                    />
                                </div>

                                {
                                    
                                }

                                <div className='flex items-center justify-center mt-2'>
                                    <button className='bg-gray-100 rounded-lg px-4 py-1 hover:cursor-pointer hover:bg-gray-200 '> Add item </button>
                                </div>


                            </>
                        )}
                    </div>

                    <div className="flex items-center justify-end">
                        <button 
                            className="bg-gray-200 rounded px-4 py-1 cursor-pointer hover:bg-gray-400 transition duration-200" 
                            onClick={_saveSettings}
                        >
                            Save
                        </button>
                    </div>
                </section>
            }
        </>
    );
};

export default Header;
