import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DesignPage from './pages/DesignPage'
import DesignView from './pages/DesignView'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Router>
      <div className="h-screen w-screen bg-white">
        <Routes>
          <Route path="/" element={<DesignPage />} />
          <Route path="/design/:designId" element={<DesignView />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
