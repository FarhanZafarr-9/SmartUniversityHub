import React from 'react';
import './App.css';
import './styles/tailwindComponents.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { CollapseProvider } from './Components/CollapseContext';
import Navbar from './Components/Navbar';
import Pages from './pages/Defaults/Pages';


export default function App() {

  return (

      <CollapseProvider>
        <Router>
          <div className="flex w-screen max-w-screen h-screen max-h-screen justify-center items-center">
            <Navbar />
            <Pages />
          </div>
        </Router>
      </CollapseProvider>

  );
}