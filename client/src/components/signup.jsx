import React, { useState, useContext, useEffect } from 'react';
import { AuthenticationContext } from "../context/AuthenticationContext.jsx";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthenticationContext);
  const navigate = useNavigate();  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const oAuthSignIn = () => {
    window.location.href = `${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/auth/login`;
  };

  useEffect(() => {
    axios.post(`${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/login`, {
      username: localStorage.getItem('username') || '',
      password: '',
      access_token: localStorage.getItem('access_token') || '',
      refresh_token: localStorage.getItem('refresh_token') || '',
    }, {
      headers: { 'Content-Type': 'application/json' }
    }).then((res) => {
      if (res.data.status_code === 200) {
        localStorage.setItem('access_token', res.data.access_token);
        localStorage.setItem('refresh_token', res.data.refresh_token);
        localStorage.setItem('username', res.data.username);
        setIsAuthenticated(true);
        setErrorMessage('');
        navigate('/');
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await axios.post(`${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/signup`, {
        username, password, email,
    }).then((res) => {
      if (res.data.status_code === 201) {
        setIsAuthenticated(true);
        setErrorMessage('');
        localStorage.setItem('access_token', res.data.access_token);
        localStorage.setItem('refresh_token', res.data.refresh_token);
        localStorage.setItem('username', res.data.username);
        navigate('/');
      } else {
        setErrorMessage(res.data.message);
      }
    }).catch((error) => {
      setErrorMessage('Signup failed. Please try again.');
    })
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 border border-gray-300 rounded-2xl shadow-md bg-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
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
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition duration-200"
        >
          Sign Up
        </button>

        <button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition duration-200"
          onClick={oAuthSignIn}
        >
          Continue with Google
        </button>


        <p className="text-center text-sm mt-3">
          Already have an account?{" "}
          <span
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default Signup;