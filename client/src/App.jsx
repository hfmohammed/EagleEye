import './index.css'
import Header from './components/header'
import Main from './components/main'
import Footer from './components/footer'
import React from 'react'
import { DataProvider } from './context/DataContext';

function App() {
  return (
    <>
      <Header />
      <DataProvider>
        <Main />
      </DataProvider>
      <Footer />
    </>
  )
}

export default App;