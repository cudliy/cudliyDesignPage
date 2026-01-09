import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DesignPage from './pages/DesignPage'
// @ts-ignore
import DesignView from './pages/DesignView'
import DownloadPage from './pages/DownloadPage'
import Dashboard from './pages/Dashboard'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import AdminOrders from './pages/AdminOrders'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import NotFound from './pages/NotFound'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import BlogPage from './pages/BlogPage'
import PricingPage from './pages/PricingPage'
import Toaster from '@/components/ui/Toaster'
import SpotifyWrapDemo from './components/SpotifyWrapDemo'
import SendGiftPage from './pages/SendGiftPage'
import GiftViewPage from './pages/GiftViewPage'
import ImageSharePage from './pages/ImageSharePage'
import ImageGiftViewPage from './pages/ImageGiftViewPage'
import ImageUploadTest from './pages/ImageUploadTest'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ImageUploadDemo from './pages/ImageUploadDemo'

function App() {
  return (
    <Router>
      <div className="h-screen w-screen bg-white">
        <Toaster />
        <Routes>
          <Route path="/design" element={<DesignPage />} />
          <Route path="/design/:designId" element={<DesignView />} />
          <Route path="/download/:designId" element={<DownloadPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/checkout/:designId" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
          <Route path="/" element={<SignInPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/demo/spotify-wrap" element={<SpotifyWrapDemo />} />
          <Route path="/demo/image-upload" element={<ImageUploadDemo />} />
          <Route path="/test/image-upload" element={<ImageUploadTest />} />
          <Route path="/send-gift/:designId" element={<SendGiftPage />} />
          <Route path="/gift/:giftId" element={<GiftViewPage />} />
          <Route path="/share/images" element={<ImageSharePage />} />
          <Route path="/gift/images/:giftId" element={<ImageGiftViewPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
