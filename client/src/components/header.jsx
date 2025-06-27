import React, { useContext, useState, useEffect, useRef } from 'react';
import { SettingsContext } from '../context/SettingsContext';

const Header = () => {
    const { settingsOpen, setSettingsOpen } = useContext(SettingsContext);

    return (
        <header className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
            {/* Logo Section */}
            <section>
                <h1 className="text-2xl font-bold text-gray-800">EagleEye</h1>
            </section>

            <section className="flex items-center space-x-4">
                {/* Settings Button */}
                <button className='bg-gray-300 text-white rounded-full cursor-pointer px-3 py-2 hover:bg-gray-400' onClick={() => {
                    setSettingsOpen(true);
                    localStorage.setItem('settingsOpen', JSON.stringify(true))
                }}>
                    ⚙
                </button>

                {/* Sign Out Button */}
                <button className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 hover:cursor-pointer">
                    Sign out
                </button>
            </section>
        </header>
    );
};

export default Header;
