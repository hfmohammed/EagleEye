import './index.css'
import Header from './components/header'
import Main from './components/main'
import Footer from './components/footer'
import React from 'react'
import { DataProvider } from './context/DataContext';
import { AppProvider } from './context/AppContext';

function App() {
  return (
    <AppProvider>

      <Header />

      <DataProvider>
        <Main />
      </DataProvider>

      <Footer />

    </AppProvider>
  )
}

export default App;
