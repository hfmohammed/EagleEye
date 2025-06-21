import React, { useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';

const Header = () => {
    const { isCameraEnabled, setIsCameraEnabled, toggleCamera, inflight } = useContext(SettingsContext);
    
    return (
        <>
            <header className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
                {/* Logo Section */}
                <h1 className="text-2xl font-bold text-gray-800">EagleEye</h1>

                {/* Sign Out Button */}
                <button className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 hover:cursor-pointer">
                    Sign out
                </button>
            </header>

            <button
            onClick={toggleCamera}
            className={`px-4 py-2 rounded-lg font-semibold 
                ${isCameraEnabled
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }
            `}>

                {isCameraEnabled ? 'Switch to pre-recorded input or livestream' : 'Switch to Webcam'}

            </button>
        </>
    );
};

export default Header;
