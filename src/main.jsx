// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'; // 引入 BrowserRouter
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 將 App 包裹起來 */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)