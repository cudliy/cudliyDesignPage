import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DesignPage from './pages/DesignPage'
import DesignView from './pages/DesignView'

function App() {
  return (
    <Router>
      <div className="h-screen w-screen bg-white">
        <Routes>
          <Route path="/" element={<DesignPage />} />
          <Route path="/design/:designId" element={<DesignView />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
