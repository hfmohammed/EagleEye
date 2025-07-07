import React, { useContext, useState, useEffect, useRef } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import axios from "axios";
import {AuthenticationContext} from "../context/AuthenticationContext.jsx";

const Header = () => {
    const { settingsOpen, setSettingsOpen } = useContext(SettingsContext);
    const { isAuthenticated, setIsAuthenticated } = useContext(AuthenticationContext);

    const signout = () => {
      axios.post('http://localhost:5700/logout', {
        access_token: localStorage.getItem('access_token') || '',
        refresh_token: localStorage.getItem('refresh_token') || '',
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      }).then((res) => {
        if (res.data.status_code === 200) {
          setIsAuthenticated(false);
          localStorage.setItem('access_token', '');
          localStorage.setItem('refresh_token', '');
          localStorage.setItem('username', '');
        } else {
          setIsAuthenticated(false);
          localStorage.setItem('access_token', '');
          localStorage.setItem('refresh_token', '');
          localStorage.setItem('username', '');
          console.log("Logout failed:", res.data.message);
        }
      }).catch((err) => {
        setIsAuthenticated(false);
        localStorage.setItem('access_token', '');
        localStorage.setItem('refresh_token', '');
        localStorage.setItem('username', '');
        console.error("Logout error:", err);
      });
    }

    return (
        <header className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
            {/* Logo Section */}
            <section>
                <h1 className="text-2xl font-bold text-gray-800">EagleEye</h1>
            </section>

            <section className="flex items-center space-x-4">
                {/* Settings Button */}
                <button className='bg-gray-300 text-white rounded-full cursor-pointer px-3 py-2 hover:bg-gray-400' onClick={() => setSettingsOpen(!settingsOpen)}>
                    ⚙
                </button>

                {/* Sign Out Button */}
                <button className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 hover:cursor-pointer" onClick={() => signout()}>
                    Sign out
                </button>
            </section>
        </header>
    );
};

export default Header;
