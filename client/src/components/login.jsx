import React, { useContext, useEffect, useState } from 'react';
import { AuthenticationContext } from "../context/AuthenticationContext.jsx";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { SettingsContext } from '../context/SettingsContext.jsx';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthenticationContext);
  const { isCameraEnabled, setIsCameraEnabled, toggleCamera, inFlight, switchSource, setSwitchSource, fps, setFps, saveSettings, rtspLinks, setRtspLinks, inputSource, setInputSource, settingsOpen, setSettingsOpen, selectedTab, setSelectedTab, enableAnnotationsRef } = useContext(SettingsContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    axios.post(`${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/login`, {
      username: localStorage.getItem('username') || '',
      password: '',
      access_token: localStorage.getItem('access_token') || '',
      refresh_token: localStorage.getItem('refresh_token') || '',
    }, {
      headers: { 'Content-Type': 'application/json' }
    }).then((res) => {
      console.log(res.data)
      if (res.data && res.data.status_code === 200) {
        localStorage.setItem('access_token', res.data.access_token);
        localStorage.setItem('refresh_token', res.data.refresh_token);
        localStorage.setItem('username', res.data.username);
        
        setFps(res.data.fps);
        localStorage.setItem('fps', res.data.fps);
        
        setInputSource(res.data.inputSource);
        localStorage.setItem('inputSource', res.data.inputSource);
        
        enableAnnotationsRef.current = JSON.parse(localStorage.getItem("enableAnnotationsRef") || "false");

        localStorage.setItem('enableAnnotationsRef', JSON.stringify(enableAnnotationsRef.current));
        
        setRtspLinks(res.data.rtspLinks);
        localStorage.setItem('rtspLinks', JSON.stringify(res.data.rtspLinks));
        
        setErrorMessage('');
        setIsAuthenticated(true);
        navigate('/');
      }
    });
  }, []);

  const oAuthSignIn = () => {
    window.location.href = `${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/auth/login`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMessage('Username and password are required.');
      return;
    }

    axios.post(`${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/login`, {
      username, password,
      access_token: localStorage.getItem('access_token') || '',
      refresh_token: localStorage.getItem('refresh_token') || '',
    }, {
      headers: { 'Content-Type': 'application/json' }
    }).then((res) => {
      if (res.data.status_code === 200) {
        console.log(res.data);
        
        localStorage.setItem('access_token', res.data.access_token);
        localStorage.setItem('refresh_token', res.data.refresh_token);
        localStorage.setItem('username', res.data.username);
        
        setFps(res.data.fps);
        localStorage.setItem('fps', res.data.fps);
        
        setInputSource(res.data.inputSource);
        localStorage.setItem('inputSource', res.data.inputSource);
        
        enableAnnotationsRef.current = res.data.enableAnnotationsRef
        localStorage.setItem('enableAnnotationsRef', JSON.stringify(enableAnnotationsRef.current));
        
        setRtspLinks(res.data.rtspLinks);
        localStorage.setItem('rtspLinks', JSON.stringify(res.data.rtspLinks));

        setErrorMessage('');
        setIsAuthenticated(true);
        navigate('/');
      } else {
        setErrorMessage(res.data.message);
      }
    }).catch((error) => {
        setErrorMessage('Login failed. Please try again.');
    })
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 border border-gray-300 rounded-2xl shadow-md bg-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-gray-700">Username</label>
          <input
            type="text"
            className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-200"
        >
          Login
        </button>

        <button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition duration-200"
          onClick={oAuthSignIn}
        >
          Continue with Google
        </button>

        <p className="text-center text-sm mt-3">
          Don't have an account?{" "}
          <span
            onClick={() => navigate('/signup')}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            Sign up
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
