import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from './components/Header'
import SiteHeader from './components/SiteHeader'
import Home from './pages/Home'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import SiteHome from './pages/SiteHome'
import SitePost from './pages/SitePost'
import SiteAbout from './pages/SiteAbout'
import api from './api/client'


function useIsSubSite() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  if (segments.length === 0) return { isSubSite: false }
  const [username, ...rest] = segments
  if (rest.length === 0 && !['register', 'dashboard'].includes(username)) {
    return { isSubSite: true, username }
  }
  if (rest[0] === 'posts' || rest[0] === 'about') {
    return { isSubSite: true, username }
  }
  return { isSubSite: false }
}


function HeaderWrapper({ isSubSite, username }) {
  if (isSubSite && username) {
    return <SiteHeader username={username} />
  }
  return <Header />
}


function AppRoutes() {
  const { isSubSite, username } = useIsSubSite()

  return (
    <>
      <HeaderWrapper isSubSite={isSubSite} username={username} />
      <main className="main-content">
        <Routes>
          {/* Main site routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Sub-site routes */}
          <Route path="/:username" element={<SiteHome />} />
          <Route path="/:username/posts/:slug" element={<SitePost />} />
          <Route path="/:username/about" element={<SiteAbout />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}


function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}


export default App
