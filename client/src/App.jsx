import './index.css';
import Header from './components/enhanced-header';
import Settings from './components/enhanced-settings';
import Main from './components/enhanced-main';
import Footer from './components/enhanced-footer';
import Login from './components/enhanced-login';
import Signup from './components/enhanced-signup';
import OAuthCallback from './context/OAuthCallback';
import { DataProvider } from './context/DataContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthenticationContext } from './context/AuthenticationContext.jsx';

import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useContext(AuthenticationContext);
  console.log(isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <SettingsProvider>

      <DataProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/oauth" element={<OAuthCallback />} />

          {/* Protected route */}
          <Route path="/" element={
            <PrivateRoute>
              <>
                <Header />
                <Settings />
                <Main />
                <Footer />
              </>
            </PrivateRoute>
          } />
        </Routes>
      </DataProvider>

    </SettingsProvider>
  );
}

export default App;
