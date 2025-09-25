import Navbar from './components/Navbar/Navbar.jsx'
import Footer from './components/Footer/Footer.jsx'
import Header from './components/Header/Header.jsx'
import About from './components/pages/About.jsx'
import Jobs from './components/pages/jobs.jsx'
import Interview from './components/pages/Interview.jsx'
import Login from './components/pages/Login.jsx'
import Signup from './components/pages/Signup.jsx'
import Profile from './components/pages/Profile.jsx'
import Schedule from './components/pages/Schedule.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <div className="page-spacer" />
      <Footer />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
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
