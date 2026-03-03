import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/layout/Layout'

// Lazy load page components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Students = lazy(() => import('./pages/Students'))
const Sessions = lazy(() => import('./pages/Sessions'))
const Invoices = lazy(() => import('./pages/Invoices'))
const Insights = lazy(() => import('./pages/Insights'))
const More = lazy(() => import('./pages/More'))
const Login = lazy(() => import('./pages/Login'))

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
      <p className="text-slate-500">Loading...</p>
    </div>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="insights" element={<Insights />} />
              <Route path="students" element={<Students />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="more" element={<More />} />
            </Route>
          </Routes>
        </Suspense>
        <SpeedInsights />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
