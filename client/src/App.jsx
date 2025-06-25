import './index.css'
import Header from './components/header'
import Settings from './components/settings'
import Main from './components/main'
import Footer from './components/footer'
import React, { useContext } from 'react'
import { DataProvider } from './context/DataContext';
import { SettingsProvider } from './context/SettingsContext';


function App() {  
  return (
    <>
    <SettingsProvider>
      <Header />

      <DataProvider>
        <Settings />
        <Main />
      </DataProvider>

      <Footer />
    </SettingsProvider>
    </>
  )
}

export default App;