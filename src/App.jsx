import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth.jsx'
import { CartProvider } from '@/contexts/CartContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PublicRoute } from '@/components/auth/PublicRoute'
import MainLayout from '@/components/layout/MainLayout'
import { Toaster } from '@/components/ui/toaster'

import LandingPage from '@/pages/LandingPage'
import FeaturesPage from '@/pages/FeaturesPage'
import PricingPage from '@/pages/PricingPage'
import ContactPage from '@/pages/ContactPage'
import VpsPage from '@/pages/VpsPage'
import VdsPage from '@/pages/VdsPage'
import DedicatedPage from '@/pages/DedicatedPage'
import LinuxHostingPage from '@/pages/LinuxHostingPage'
import WordPressHostingPage from '@/pages/WordPressHostingPage'
import MinecraftPage from '@/pages/MinecraftPage'
import CsgoPage from '@/pages/CsgoPage'
import DomainPage from '@/pages/DomainPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import AdminDashboard from '@/pages/admin/Dashboard'
import CustomerDashboard from '@/pages/customer/Dashboard'
import EmployeeDashboard from '@/pages/employee/Dashboard'
import Customers from '@/pages/admin/Customers'
import CustomerDetails from '@/pages/admin/CustomerDetails'
import Domains from '@/pages/admin/Domains'
import Hosting from '@/pages/admin/Hosting'
import HostingPackages from '@/pages/admin/HostingPackages'
import VDS from '@/pages/admin/VDS'
import Servers from '@/pages/admin/Servers'
import Invoices from '@/pages/admin/Invoices'
import AdminInvoiceDetail from '@/pages/admin/InvoiceDetail'
import Tickets from '@/pages/admin/Tickets'
import Settings from '@/pages/admin/Settings'
import SystemSettings from '@/pages/admin/SystemSettings'
import Contracts from '@/pages/admin/Contracts'
import Analytics from '@/pages/admin/Analytics'
import Employees from '@/pages/admin/Employees'
import Approvals from '@/pages/admin/Approvals'
import MyDomains from '@/pages/customer/MyDomains'
import MyHosting from '@/pages/customer/MyHosting'
import MyVDS from '@/pages/customer/MyVDS'
import MyInvoices from '@/pages/customer/MyInvoices'
import InvoiceDetail from '@/pages/customer/InvoiceDetail'
import MyTickets from '@/pages/customer/MyTickets'
import Profile from '@/pages/customer/Profile'
import PaymentSuccess from '@/pages/PaymentSuccess'
import PaymentFailed from '@/pages/PaymentFailed'
import DomainSearch from '@/pages/DomainSearch'
import DomainCheckout from '@/pages/DomainCheckout'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Routes>
          {/* Landing pages - accessible to everyone */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/vps" element={<VpsPage />} />
          <Route path="/vds" element={<VdsPage />} />
          <Route path="/dedicated" element={<DedicatedPage />} />
          <Route path="/linux-hosting" element={<LinuxHostingPage />} />
          <Route path="/wordpress-hosting" element={<WordPressHostingPage />} />
          <Route path="/minecraft" element={<MinecraftPage />} />
          <Route path="/csgo" element={<CsgoPage />} />
          <Route path="/domain" element={<DomainPage />} />

          {/* Auth pages - redirect authenticated users */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Payment callback pages - full screen layout, no auth required for callback */}
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />
          <Route path="/payment-callback" element={<PaymentSuccess />} />

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
            <Route path="analytics" element={<Analytics />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetails />} />
            <Route path="employees" element={<Employees />} />
            <Route path="domain-search" element={<DomainSearch />} />
            <Route path="domain-checkout" element={<DomainCheckout />} />
            <Route path="domains" element={<Domains />} />
            <Route path="hosting" element={<Hosting />} />
            <Route path="hosting-packages" element={<HostingPackages />} />
            <Route path="vds" element={<VDS />} />
            <Route path="servers" element={<Servers />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoice/:id" element={<AdminInvoiceDetail />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="settings" element={<Settings />} />
            <Route path="system-settings" element={<SystemSettings />} />
          </Route>

          {/* Employee routes */}
          <Route
            path="/employee/*"
            element={
              <ProtectedRoute requiredRole="employee">
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetails />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoice/:id" element={<AdminInvoiceDetail />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="hosting" element={<Hosting />} />
            <Route path="domains" element={<Domains />} />
            <Route path="tickets" element={<Tickets />} />
          </Route>

          {/* Customer routes - specific paths to avoid catching "/" */}
          <Route path="/dashboard" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<CustomerDashboard />} />
          </Route>
          <Route path="/domain-search" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<DomainSearch />} />
          </Route>
          <Route path="/domain-checkout" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<DomainCheckout />} />
          </Route>
          <Route path="/domains" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<MyDomains />} />
          </Route>
          <Route path="/hosting" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<MyHosting />} />
          </Route>
          <Route path="/vds" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<MyVDS />} />
          </Route>
          <Route path="/invoices" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<MyInvoices />} />
          </Route>
          <Route path="/invoice/:id" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<InvoiceDetail />} />
          </Route>
          <Route path="/tickets" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<MyTickets />} />
          </Route>
          <Route path="/profile" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<Profile />} />
          </Route>

          {/* Catch-all redirects to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
