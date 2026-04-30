import { Routes, Route } from 'react-router'
import MobileLayout from './components/MobileLayout'
import Home from './pages/Home'
import SendMoney from './pages/SendMoney'
import ScanPay from './pages/ScanPay'
import Transactions from './pages/Transactions'
import Profile from './pages/Profile'
import AddMoney from './pages/AddMoney'
import BillPay from './pages/BillPay'
import Offers from './pages/Offers'
import Notifications from './pages/Notifications'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <MobileLayout>
            <Home />
          </MobileLayout>
        }
      />
      <Route
        path="/send"
        element={
          <MobileLayout>
            <SendMoney />
          </MobileLayout>
        }
      />
      <Route
        path="/scan"
        element={
          <MobileLayout>
            <ScanPay />
          </MobileLayout>
        }
      />
      <Route
        path="/transactions"
        element={
          <MobileLayout>
            <Transactions />
          </MobileLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <MobileLayout>
            <Profile />
          </MobileLayout>
        }
      />
      <Route
        path="/add-money"
        element={
          <MobileLayout>
            <AddMoney />
          </MobileLayout>
        }
      />
      <Route
        path="/bills"
        element={
          <MobileLayout>
            <BillPay />
          </MobileLayout>
        }
      />
      <Route
        path="/offers"
        element={
          <MobileLayout>
            <Offers />
          </MobileLayout>
        }
      />
      <Route
        path="/notifications"
        element={
          <MobileLayout>
            <Notifications />
          </MobileLayout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
