import React, {useContext, useEffect, useState} from 'react';
import { AuthenticationContext } from "../context/AuthenticationContext.jsx";
import axios from "axios";

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const {isAuthenticated, setIsAuthenticated} = useContext(AuthenticationContext);

  useEffect(() => {
    axios.post('http://localhost:5700/login', {
      username: localStorage.getItem('username') || '',
      password: '',
      access_token: localStorage.getItem('access_token') || '',
      refresh_token: localStorage.getItem('refresh_token') || '',
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).then((res) => {
      console.log(res.data);
      if (res.data.status_code === 200) {
        localStorage.setItem('access_token', res.data.access_token);
        localStorage.setItem('refresh_token', res.data.refresh_token);
        localStorage.setItem('username', res.username);
        setIsAuthenticated(true);
      } else {
        console.log("error");
      }
    })
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }

    axios.post('http://localhost:5700/login', {
        username: username,
        password: password,
        access_token: localStorage.getItem('access_token') || '',
        refresh_token: localStorage.getItem('refresh_token') || '',
      }, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).then((res) => {
      if (res.data.status_code === 200) {
        localStorage.setItem('access_token', res.data.access_token);
        localStorage.setItem('refresh_token', res.data.refresh_token);
        localStorage.setItem('username', res.username);
        setIsAuthenticated(true);
      } else {
        setError(res.data.message);
      }
    })
  };

  if (isAuthenticated) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Welcome, {username}!</h2>
        <p>You are now logged in.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '5rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Login</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Username:</label>
          <input
            type="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            required
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            required
          />
        </div>
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}>
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
