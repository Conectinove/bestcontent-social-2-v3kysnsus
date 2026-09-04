import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/context/AuthContext'
import { SocialProvider } from '@/context/SocialContext'

import Layout from './components/Layout'
import Index from './pages/Index'
import LandingPage from './pages/LandingPage'
import NotFound from './pages/NotFound'

import Feed from './pages/Feed'
import Brands from './pages/Brands'
import BrandDetail from './pages/BrandDetail'
import CreatePost from './pages/CreatePost'
import PostEditor from './pages/PostEditor'
import GuidedCreator from './pages/GuidedCreator'
import CreateHub from './pages/CreateHub'
import ImageCreator from './pages/ImageCreator'
import FlyerCreator from './pages/FlyerCreator'
import CalendarPage from './pages/CalendarPage'
import Library from './pages/Library'
import Discover from './pages/Discover'
import Dashboard from './pages/Dashboard'
import VisaoGeral from './pages/VisaoGeral'
import ClientPortal from './pages/ClientPortal'
import Settings from './pages/Settings'
import Subscription from './pages/Subscription'
import CommunityDashboard from './pages/community/CommunityDashboard'
import TopicDetail from './pages/community/TopicDetail'

import Onboarding from './pages/Onboarding'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <SocialProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public routes — no auth required */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/waitlist" element={<LandingPage />} />

            {/* Authenticated routes inside Layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/app/feed" element={<VisaoGeral />} />
              <Route path="/app/feed-comunidade" element={<Feed />} />
              <Route path="/app/visao-geral" element={<VisaoGeral />} />
              <Route path="/app/portal-cliente" element={<ClientPortal />} />
              <Route path="/app/onboarding" element={<Onboarding />} />
              <Route path="/app/criar" element={<CreateHub />} />
              <Route path="/app/criar/imagens" element={<ImageCreator />} />
              <Route path="/app/criar/flyers" element={<FlyerCreator />} />
              <Route path="/app/criar/videos" element={<GuidedCreator />} />
              <Route path="/app/brands" element={<Brands />} />
              <Route path="/app/brands/:id" element={<BrandDetail />} />
              <Route path="/app/library" element={<Library />} />
              <Route path="/app/content/new" element={<CreatePost />} />
              <Route path="/app/editor/:postId" element={<PostEditor />} />
              <Route path="/app/calendar" element={<CalendarPage />} />
              <Route path="/app/community" element={<CommunityDashboard />} />
              <Route path="/app/community/topic/:id" element={<TopicDetail />} />
              <Route path="/app/dashboard" element={<Dashboard />} />
              <Route path="/app/discover" element={<Discover />} />
              <Route path="/app/settings" element={<Settings />} />
              <Route path="/app/subscription" element={<Subscription />} />
              <Route path="/app/assinatura" element={<Subscription />} />
            </Route>

            {/* Public Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </SocialProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
