import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { SpeedInsights } from '@vercel/speed-insights/react'

// Lazy load page components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Students = lazy(() => import('./pages/Students'))
const Sessions = lazy(() => import('./pages/Sessions'))
const Invoices = lazy(() => import('./pages/Invoices'))
const Insights = lazy(() => import('./pages/Insights'))

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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="insights" element={<Insights />} />
            <Route path="students" element={<Students />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="invoices" element={<Invoices />} />
          </Route>
        </Routes>
      </Suspense>
      <SpeedInsights />
    </BrowserRouter>
  )
}

export default App
