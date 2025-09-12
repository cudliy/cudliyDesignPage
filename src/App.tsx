import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DesignPage from './pages/DesignPage'
import DesignView from './pages/DesignView'
import Dashboard from './pages/Dashboard'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'

function App() {
  return (
    <Router>
      <div className="h-screen w-screen bg-white">
        <Routes>
          <Route path="/" element={<DesignPage />} />
          <Route path="/design" element={<DesignPage />} />
          <Route path="/design/:designId" element={<DesignView />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/checkout/:designId" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
