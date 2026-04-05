import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth.jsx'
import { CartProvider } from '@/contexts/CartContext'
import { ProductCacheProvider } from '@/contexts/ProductCacheContext'
import { CustomerViewProvider } from '@/contexts/CustomerViewContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PublicRoute } from '@/components/auth/PublicRoute'
import MainLayout from '@/components/layout/MainLayout'
import ErrorBoundary from '@/components/ErrorBoundary'

import LandingPage from '@/pages/LandingPage'
import FeaturesPage from '@/pages/FeaturesPage'
import PricingPage from '@/pages/PricingPage'
import ContactPage from '@/pages/ContactPage'
import VpsPage from '@/pages/VpsPage'
import VdsPage from '@/pages/VdsPage'
import DedicatedPage from '@/pages/DedicatedPage'
import LinuxHostingPage from '@/pages/LinuxHostingPage'
import WordPressHostingPage from '@/pages/WordPressHostingPage'
import PleskHostingPage from '@/pages/PleskHostingPage'
import ResellerHostingPage from '@/pages/ResellerHostingPage'
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
import CloudflareManager from '@/pages/admin/CloudflareManager'
import EmailTemplates from '@/pages/admin/EmailTemplates'
import TicketDepartments from '@/pages/admin/TicketDepartments'
import KnowledgeBaseAdmin from '@/pages/admin/KnowledgeBaseAdmin'
import Announcements from '@/pages/admin/Announcements'
import ProductPackages from '@/pages/admin/ProductPackages'
import KnowledgeBase from '@/pages/KnowledgeBase'
import KnowledgeBaseArticle from '@/pages/KnowledgeBaseArticle'
import NetworkStatus from '@/pages/NetworkStatus'
import ApiKeys from '@/pages/customer/ApiKeys'
import Developer from '@/pages/customer/Developer'
import AuditLogs from '@/pages/admin/AuditLogs'
import RevenueSplit from '@/pages/admin/RevenueSplit'
import CustomerFormPage from '@/pages/admin/CustomerFormPage'
import ProjectMilestones from '@/pages/admin/ProjectMilestones'
import Checkout from '@/pages/Checkout'

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <ProductCacheProvider>
        <CustomerViewProvider>
        <CartProvider>
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
          <Route path="/plesk-hosting" element={<PleskHostingPage />} />
          <Route path="/reseller-hosting" element={<ResellerHostingPage />} />
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
            <Route path="customers/new" element={<CustomerFormPage />} />
            <Route path="customers/:id/edit" element={<CustomerFormPage />} />
            <Route path="customers/:id" element={<CustomerDetails />} />
            <Route path="employees" element={<Employees />} />
            <Route path="domain-search" element={<DomainSearch />} />
            <Route path="domain-checkout" element={<DomainCheckout />} />
            <Route path="domains" element={<Domains />} />
            <Route path="hosting" element={<Hosting />} />
            <Route path="hosting-packages" element={<HostingPackages />} />
            <Route path="product-packages" element={<ProductPackages />} />
            <Route path="vds" element={<VDS />} />
            <Route path="servers" element={<Servers />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoice/:id" element={<AdminInvoiceDetail />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="settings" element={<Settings />} />
            <Route path="system-settings" element={<SystemSettings />} />
            <Route path="email-templates" element={<EmailTemplates />} />
            <Route path="ticket-departments" element={<TicketDepartments />} />
            <Route path="knowledge-base" element={<KnowledgeBaseAdmin />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="cloudflare" element={<CloudflareManager />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="revenue-split" element={<RevenueSplit />} />
            <Route path="project-milestones" element={<ProjectMilestones />} />
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
          <Route path="/my-vds" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
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
          <Route path="/knowledge-base" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<KnowledgeBase />} />
          </Route>
          <Route path="/knowledge-base/:slug" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<KnowledgeBaseArticle />} />
          </Route>
          <Route path="/api-keys" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<ApiKeys />} />
          </Route>
          <Route path="/developer" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<Developer />} />
          </Route>
          <Route path="/network-status" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<NetworkStatus />} />
          </Route>

          {/* Public routes */}
          <Route path="/status" element={<NetworkStatus />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* Catch-all redirects to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </CartProvider>
        </CustomerViewProvider>
        </ProductCacheProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
