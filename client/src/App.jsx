import './index.css'
import Header from './components/header'
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
        <Main />
      </DataProvider>

      <Footer />
    </SettingsProvider>
    </>
  )
}

export default App;