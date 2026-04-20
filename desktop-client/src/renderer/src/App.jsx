import React, { useState, useEffect, useRef, useCallback } from 'react'
import TitleBar from './components/TitleBar'
import LoginScreen from './components/LoginScreen'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import CrystalEditor from './components/CrystalEditor'
import MemoryVault from './components/MemoryVault'

export default function App() {
  const [username, setUsername] = useState(null)
  const [activeChannel, setActiveChannel] = useState('general')
  const [serverStatus, setServerStatus] = useState('connecting')
  const [messages, setMessages] = useState({})
  const [onlineUsers, setOnlineUsers] = useState([])
  const [currentView, setCurrentView] = useState('chat') // 'chat' | 'crystal' | 'memories'
  const [crystals, setCrystals] = useState([])
  const [activeCrystal, setActiveCrystal] = useState(null)
  const wsRef = useRef(null)

  // Ping server on mount
  useEffect(() => {
    fetch('http://localhost:8080/api/v1/ping', {
      headers: { 'X-User-Name': username || 'guest' }
    })
      .then(r => r.json())
      .then(d => { if (d.status === 'UP') setServerStatus('connected') })
      .catch(() => setServerStatus('offline'))
  }, [username]) // Re-ping when identity changes

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
    fetch(`http://localhost:8080/api/v1/messages?channel=${activeChannel}`, {
      headers: { 'X-User-Name': username }
    })
      .then(r => {
        if (!r.ok) throw new Error("History fetch failed")
        return r.json()
      })
      .then(d => {
        if (d.messages) {
          setMessages(prev => ({ ...prev, [activeChannel]: d.messages }))
        }
      })
      .catch(e => console.error("History fetch error:", e))
  }, [activeChannel, username])

  // Fetch Crystals
  const loadCrystals = useCallback(() => {
    fetch('http://localhost:8080/api/v1/crystals', {
      headers: { 'X-User-Name': username }
    })
      .then(r => {
        if (!r.ok) throw new Error("Crystals fetch failed")
        return r.json()
      })
      .then(d => {
        if (Array.isArray(d)) setCrystals(d)
      })
      .catch(e => console.error("Crystals fetch error:", e))
  }, [username])

  useEffect(() => {
    if (username) loadCrystals()
  }, [username, loadCrystals])

  // Create Crystal
  const handleCreateCrystal = async (initialContent = '') => {
    try {
      console.log("[Crystals] Creating new crystal...");
      const res = await fetch('http://localhost:8080/api/v1/crystals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Name': username
        },
        body: JSON.stringify({ 
          title: initialContent ? 'Extracted Idea' : 'New Crystal', 
          content: initialContent ? `<p>${initialContent}</p>` : '' 
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to Crystallize')
      }

      console.log("[Crystals] Creation successful:", data);
      setCrystals(prev => {
        // Only prepend if not already there
        if (prev.some(c => c.slug === data.slug)) return prev
        return [data, ...prev]
      })
      setActiveCrystal(data.slug)
      setCurrentView('crystal')
    } catch (e) {
      console.error("[Crystals] Creation error:", e)
      alert(`创建失败: ${e.message}`)
    }
  }

  const handleDeleteCrystal = async (slug) => {
    if (!slug || !username) return

    const target = crystals.find((item) => item.slug === slug)
    const confirmed = window.confirm(`Delete crystal "${target?.title || 'Untitled Crystal'}"? This will also remove its extracted memories and links.`)
    if (!confirmed) return

    try {
      const res = await fetch(`http://localhost:8080/api/v1/crystals/${slug}`, {
        method: 'DELETE',
        headers: { 'X-User-Name': username }
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete crystal')
      }

      setCrystals((prev) => prev.filter((item) => item.slug !== slug))

      if (activeCrystal === slug) {
        setActiveCrystal(null)
        setCurrentView('chat')
      }
    } catch (e) {
      console.error('[Crystals] Delete error:', e)
      alert(`删除失败: ${e.message}`)
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
      fetch('http://localhost:8080/api/v1/online', {
        headers: { 'X-User-Name': username }
      })
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
            onDeleteCrystal={handleDeleteCrystal}
            activeMode={currentView === 'chat' ? 'flow' : currentView === 'memories' ? 'memories' : 'crystals'}
            onModeChange={(mode) => {
              if (mode === 'flow') {
                setCurrentView('chat')
                return
              }
              if (mode === 'memories') {
                setCurrentView('memories')
                setActiveCrystal(null)
                return
              }
              setCurrentView('crystal')
            }}
          />
        </div>
        
        {/* Main Floating Canvas */}
        <div className="flex-1 flex flex-col glass-panel relative overflow-hidden z-10 w-full h-full border border-white/[0.06]">
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
          ) : currentView === 'memories' ? (
            <MemoryVault
              currentUser={username}
              onNavigateToCrystal={(slug) => {
                setActiveCrystal(slug)
                setCurrentView('crystal')
              }}
            />
          ) : (
            <CrystalEditor 
              key={activeCrystal || 'new'} 
              currentCrystalSlug={activeCrystal}
              currentUser={username}
              onBack={() => setCurrentView('chat')}
              onNavigate={(slug) => setActiveCrystal(slug)}
              onCrystalSaved={loadCrystals}
              onDeleteCrystal={handleDeleteCrystal}
              onOpenMemoryVault={() => {
                setCurrentView('memories')
                setActiveCrystal(null)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
