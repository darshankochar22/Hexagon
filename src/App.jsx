import Navbar from './components/Navbar/Navbar.jsx'
import Footer from './components/Footer/Footer.jsx'
import Header from './components/Header/Header.jsx'
import { GlowingEffectDemo } from './components/GlowingEffectDemo.jsx'
import About from './components/pages/About.jsx'
import Jobs from './components/pages/Jobs.jsx'
import Interview from './components/pages/Interview.jsx'
import Login from './components/pages/Login.jsx'
import Signup from './components/pages/Signup.jsx'
import Profile from './components/pages/Profile.jsx'
import Schedule from './components/pages/Schedule.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AppleCardsCarouselDemo } from './components/ui/Applecards.jsx'
import { Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Outlet />
        {isHomePage && (
          <>
            {/* Apple Cards Carousel Section - comes right after the hero */}
            <section className="w-full bg-white dark:bg-black">
              <AppleCardsCarouselDemo />
            </section>
            
            {/* Glowing Effect Section */}
            <section className="w-full py-16">
              <GlowingEffectDemo />
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Header component should be the full-screen hero section */}
          <Route index element={<Header />} />
          <Route path="about" element={<About />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="interview" element={<Interview />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="*" element={<></>} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App