import React, { useContext, useState, useEffect, useRef } from 'react';
import { SettingsContext } from '../context/SettingsContext';
<<<<<<< HEAD
import axios from "axios";
import {AuthenticationContext} from "../context/AuthenticationContext.jsx";

const Header = () => {
    const { settingsOpen, setSettingsOpen } = useContext(SettingsContext);
    const { isAuthenticated, setIsAuthenticated } = useContext(AuthenticationContext);

    const signout = () => {
    axios.post(`${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/logout`, {
        access_token: localStorage.getItem('access_token') || '',
        refresh_token: localStorage.getItem('refresh_token') || '',
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      }).then((res) => {
        if (res.data.status_code === 200) {
          setIsAuthenticated(false);
          localStorage.clear();
        } else {
          setIsAuthenticated(false);
          console.log("Logout failed:", res.data.message);
        }
      }).catch((err) => {
        setIsAuthenticated(false);
        console.error("Logout error:", err);
      });
    }
=======

const Header = () => {
    const { settingsOpen, setSettingsOpen } = useContext(SettingsContext);
>>>>>>> origin/main

    return (
        <header className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
            {/* Logo Section */}
            <section>
                <h1 className="text-2xl font-bold text-gray-800">EagleEye</h1>
            </section>

            <section className="flex items-center space-x-4">
                {/* Settings Button */}
<<<<<<< HEAD
                <button className='bg-gray-300 text-white rounded-full cursor-pointer px-3 py-2 hover:bg-gray-400' onClick={() => setSettingsOpen(!settingsOpen)}>
=======
                <button className='bg-gray-300 text-white rounded-full cursor-pointer px-3 py-2 hover:bg-gray-400' onClick={() => {
                    setSettingsOpen(true);
                    localStorage.setItem('settingsOpen', JSON.stringify(true))
                }}>
>>>>>>> origin/main
                    ⚙
                </button>

                {/* Sign Out Button */}
<<<<<<< HEAD
                <button className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 hover:cursor-pointer" onClick={() => signout()}>
=======
                <button className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 hover:cursor-pointer">
>>>>>>> origin/main
                    Sign out
                </button>
            </section>
        </header>
    );
};

export default Header;
