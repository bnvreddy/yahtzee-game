import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import { GameProvider } from './context/GameContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SocketProvider>
      <AuthProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </AuthProvider>
    </SocketProvider>
  </React.StrictMode>,
)