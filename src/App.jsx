import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth.jsx'
import { CartProvider } from '@/contexts/CartContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import MainLayout from '@/components/layout/MainLayout'
import { Toaster } from '@/components/ui/toaster'

import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import AdminDashboard from '@/pages/admin/Dashboard'
import CustomerDashboard from '@/pages/customer/Dashboard'
import Customers from '@/pages/admin/Customers'
import CustomerDetails from '@/pages/admin/CustomerDetails'
import Domains from '@/pages/admin/Domains'
import Hosting from '@/pages/admin/Hosting'
import HostingPackages from '@/pages/admin/HostingPackages'
import VDS from '@/pages/admin/VDS'
import Servers from '@/pages/admin/Servers'
import Invoices from '@/pages/admin/Invoices'
import Tickets from '@/pages/admin/Tickets'
import Settings from '@/pages/admin/Settings'
import MyDomains from '@/pages/customer/MyDomains'
import MyHosting from '@/pages/customer/MyHosting'
import MyVDS from '@/pages/customer/MyVDS'
import MyInvoices from '@/pages/customer/MyInvoices'
import InvoiceDetail from '@/pages/customer/InvoiceDetail'
import MyTickets from '@/pages/customer/MyTickets'
import Profile from '@/pages/customer/Profile'
import PaymentSuccess from '@/pages/customer/PaymentSuccess'
import PaymentFailed from '@/pages/customer/PaymentFailed'
import DomainSearch from '@/pages/DomainSearch'
import DomainCheckout from '@/pages/DomainCheckout'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Payment callback pages - full screen layout */}
          <Route
            path="/payment-success"
            element={
              <ProtectedRoute requiredRole="customer">
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-failed"
            element={
              <ProtectedRoute requiredRole="customer">
                <PaymentFailed />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetails />} />
            <Route path="domain-search" element={<DomainSearch />} />
            <Route path="domain-checkout" element={<DomainCheckout />} />
            <Route path="domains" element={<Domains />} />
            <Route path="hosting" element={<Hosting />} />
            <Route path="hosting-packages" element={<HostingPackages />} />
            <Route path="vds" element={<VDS />} />
            <Route path="servers" element={<Servers />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route
            path="/*"
            element={
              <ProtectedRoute requiredRole="customer">
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="domain-search" element={<DomainSearch />} />
            <Route path="domain-checkout" element={<DomainCheckout />} />
            <Route path="domains" element={<MyDomains />} />
            <Route path="hosting" element={<MyHosting />} />
            <Route path="vds" element={<MyVDS />} />
            <Route path="invoices" element={<MyInvoices />} />
            <Route path="invoice/:id" element={<InvoiceDetail />} />
            <Route path="tickets" element={<MyTickets />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
