import React, { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TitleBar from './components/TitleBar'
import LoginScreen from './components/LoginScreen'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import CrystalEditor from './components/CrystalEditor'

export default function App() {
  const [username, setUsername] = useState(null)
  const [activeChannel, setActiveChannel] = useState('general')
  const [serverStatus, setServerStatus] = useState('connecting')
  const [messages, setMessages] = useState({})
  const [onlineUsers, setOnlineUsers] = useState([])
  const [currentView, setCurrentView] = useState('chat') // 'chat' | 'crystal'
  const [crystals, setCrystals] = useState([])
  const [activeCrystal, setActiveCrystal] = useState(null)
  const wsRef = useRef(null)

  // Ping server on mount
  useEffect(() => {
    fetch('http://localhost:8080/api/v1/ping')
      .then(r => r.json())
      .then(d => { if (d.status === 'UP') setServerStatus('connected') })
      .catch(() => setServerStatus('offline'))
  }, [])

  // WebSocket management
  const connectWS = useCallback((user) => {
    const ws = new WebSocket(`ws://localhost:8080/ws?username=${encodeURIComponent(user)}`)
    wsRef.current = ws

    ws.onopen = () => setServerStatus('live')
    ws.onclose = () => {
      setServerStatus('reconnecting')
      setTimeout(() => { if (wsRef.current === ws) connectWS(user) }, 3000)
    }
    ws.onerror = () => setServerStatus('error')

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data)
        const ch = msg.channel || '_global'
        setMessages(prev => {
          const existing = prev[ch] || []
          if (existing.some(m => m.id === msg.id)) return prev
          return { ...prev, [ch]: [...existing, { ...msg, id: msg.id || Date.now() + Math.random() }] }
        })
      } catch { /* ignore non-json */ }
    }
  }, [])

  // Fetch History for active channel
  useEffect(() => {
    if (!username) return
    fetch(`http://localhost:8080/api/v1/messages?channel=${activeChannel}`)
      .then(r => r.json())
      .then(d => {
        if (d.messages) {
          setMessages(prev => ({ ...prev, [activeChannel]: d.messages }))
        }
      })
      .catch(e => console.error("History fetch error:", e))
  }, [activeChannel, username])

  // Fetch Crystals
  const loadCrystals = useCallback(() => {
    fetch('http://localhost:8080/api/v1/crystals')
      .then(r => r.json())
      .then(d => setCrystals(d || []))
      .catch(e => console.error("Crystals fetch error:", e))
  }, [])

  useEffect(() => {
    if (username) loadCrystals()
  }, [username, loadCrystals])

  // Create Crystal
  const handleCreateCrystal = async (initialContent = '') => {
    try {
      const res = await fetch('http://localhost:8080/api/v1/crystals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: initialContent ? 'Extracted Idea' : 'New Crystal', 
          content: initialContent ? `<p>${initialContent}</p>` : '' 
        })
      })
      const newCrystal = await res.json()
      setCrystals(prev => [newCrystal, ...prev])
      setActiveCrystal(newCrystal.slug)
      setCurrentView('crystal')
    } catch (e) {
      console.error(e)
    }
  }

  // Login handler
  const handleLogin = (name) => {
    setUsername(name)
    connectWS(name)
  }

  // Send message
  const handleSend = (text) => {
    if (!text.trim() || !wsRef.current) return
    const msg = {
      type: 'chat',
      sender: username,
      channel: activeChannel,
      text: text.trim(),
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }
    wsRef.current.send(JSON.stringify(msg))
  }

  // Poll online users
  useEffect(() => {
    if (!username) return
    const poll = () => {
      fetch('http://localhost:8080/api/v1/online')
        .then(r => r.json())
        .then(d => setOnlineUsers(d.online || []))
        .catch(() => {})
    }
    poll()
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [username])

  // Not logged in — show login
  if (!username) {
    return (
      <div className="w-full h-full flex flex-col relative overflow-hidden bg-[#050508]">
        <div className="ambient-mesh"></div>
        <TitleBar serverStatus={serverStatus} />
        <div className="flex-1">
          <LoginScreen onLogin={handleLogin} serverOnline={serverStatus === 'connected' || serverStatus === 'live'} />
        </div>
      </div>
    )
  }

  const channelMessages = messages[activeChannel] || []
  const globalMessages = messages['_global'] || []
  const combinedMessages = [...globalMessages, ...channelMessages].sort((a, b) => (a.id || 0) - (b.id || 0))

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-[#050508]">
      
      {/* The Global Environment Glow */}
      <div className="ambient-mesh"></div>

      <TitleBar serverStatus={serverStatus} />

      {/* Separated Floating Glass Architecture */}
      <div className="flex flex-1 overflow-hidden px-4 pb-4 gap-4">
        
        <div className="h-full shrink-0">
          <Sidebar
            activeChannel={activeChannel}
            onChannelSelect={(ch) => {
              setActiveChannel(ch)
              setCurrentView('chat')
              setActiveCrystal(null)
            }}
            onlineUsers={onlineUsers}
            currentUser={username}
            crystals={crystals}
            activeCrystal={activeCrystal}
            onCrystalSelect={(slug) => {
              setActiveCrystal(slug)
              setCurrentView('crystal')
            }}
            onCreateCrystal={handleCreateCrystal}
            activeMode={currentView === 'chat' ? 'flow' : 'crystals'}
            onModeChange={(mode) => setCurrentView(mode === 'flow' ? 'chat' : 'crystal')}
          />
        </div>
        
        {/* Main Floating Canvas */}
        <div className="flex-1 flex flex-col glass-panel relative overflow-hidden z-10 w-full h-full">
          <AnimatePresence mode="wait">
            {currentView === 'chat' ? (
              <ChatPanel
                key={activeChannel}
                channelName={activeChannel}
                messages={combinedMessages}
                onSend={handleSend}
                wsStatus={serverStatus}
                currentUser={username}
                onCrystalize={(text) => handleCreateCrystal(text)}
              />
            ) : (
              <CrystalEditor 
                key={activeCrystal || 'new'} 
                currentCrystalSlug={activeCrystal}
                onBack={() => setCurrentView('chat')}
                onNavigate={(slug) => setActiveCrystal(slug)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
