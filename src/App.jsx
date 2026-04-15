import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth.jsx'
import { CartProvider } from '@/contexts/CartContext'
import { ProductCacheProvider } from '@/contexts/ProductCacheContext'
import { CustomerViewProvider } from '@/contexts/CustomerViewContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PublicRoute } from '@/components/auth/PublicRoute'
import MainLayout from '@/components/layout/MainLayout'
import ErrorBoundary from '@/components/ErrorBoundary'
import CookieConsent from '@/components/CookieConsent'

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
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy'
import TermsOfService from '@/pages/legal/TermsOfService'
import KVKK from '@/pages/legal/KVKK'
import DistanceSalesAgreement from '@/pages/legal/DistanceSalesAgreement'
import About from '@/pages/legal/About'
import DeliveryReturn from '@/pages/legal/DeliveryReturn'
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
import AdminTicketDetail from '@/pages/admin/TicketDetail'
import Tickets from '@/pages/admin/Tickets'
import Settings from '@/pages/admin/Settings'
import SystemSettings from '@/pages/admin/SystemSettings'
import BankAccounts from '@/pages/admin/BankAccounts'
import Contracts from '@/pages/admin/Contracts'
import Analytics from '@/pages/admin/Analytics'
import Employees from '@/pages/admin/Employees'
import Approvals from '@/pages/admin/Approvals'
import VdsOrders from '@/pages/admin/VdsOrders'
import MyDomains from '@/pages/customer/MyDomains'
import MyHosting from '@/pages/customer/MyHosting'
import MyVDS from '@/pages/customer/MyVDS'
import MyInvoices from '@/pages/customer/MyInvoices'
import InvoiceDetail from '@/pages/customer/InvoiceDetail'
import MyTickets from '@/pages/customer/MyTickets'
import Profile from '@/pages/customer/Profile'
import Wallet from '@/pages/customer/Wallet'
import BankInfo from '@/pages/customer/BankInfo'
import TicketDetail from '@/pages/customer/TicketDetail'
import PaymentSuccess from '@/pages/PaymentSuccess'
import PaymentFailed from '@/pages/PaymentFailed'
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
import PromoCodes from '@/pages/admin/PromoCodes'
import AdminIncidents from '@/pages/admin/Incidents'
import Referrals from '@/pages/customer/Referrals'
import NotificationPreferences from '@/pages/customer/NotificationPreferences'
import WalletRefunds from '@/pages/admin/WalletRefunds'

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
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/kvkk" element={<KVKK />} />
          <Route path="/distance-sales" element={<DistanceSalesAgreement />} />
          <Route path="/about" element={<About />} />
          <Route path="/delivery-return" element={<DeliveryReturn />} />
          <Route path="/vps" element={<VpsPage />} />
          <Route path="/vds" element={<VdsPage />} />
          <Route path="/dedicated" element={<DedicatedPage />} />
          <Route path="/linux-hosting" element={<LinuxHostingPage />} />
          <Route path="/wordpress-hosting" element={<WordPressHostingPage />} />
          <Route path="/plesk-hosting" element={<PleskHostingPage />} />
          <Route path="/reseller-hosting" element={<ResellerHostingPage />} />
          <Route path="/minecraft" element={<MinecraftPage />} />
          <Route path="/csgo" element={<CsgoPage />} />

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
            <Route path="domains" element={<Domains />} />
            <Route path="hosting" element={<Hosting />} />
            <Route path="hosting-packages" element={<HostingPackages />} />
            <Route path="product-packages" element={<ProductPackages />} />
            <Route path="vds" element={<VDS />} />
            <Route path="vds-orders" element={<VdsOrders />} />
            <Route path="servers" element={<Servers />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoice/:id" element={<AdminInvoiceDetail />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="tickets/:id" element={<AdminTicketDetail />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="settings" element={<Settings />} />
            <Route path="system-settings" element={<SystemSettings />} />
            <Route path="bank-accounts" element={<BankAccounts />} />
            <Route path="email-templates" element={<EmailTemplates />} />
            <Route path="ticket-departments" element={<TicketDepartments />} />
            <Route path="knowledge-base" element={<KnowledgeBaseAdmin />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="cloudflare" element={<CloudflareManager />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="revenue-split" element={<RevenueSplit />} />
            <Route path="project-milestones" element={<ProjectMilestones />} />
            <Route path="promo-codes" element={<PromoCodes />} />
            <Route path="incidents" element={<AdminIncidents />} />
            <Route path="wallet-refunds" element={<WalletRefunds />} />
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
            <Route path="tickets/:id" element={<AdminTicketDetail />} />
          </Route>

          {/* Customer routes - specific paths to avoid catching "/" */}
          <Route path="/dashboard" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<CustomerDashboard />} />
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
          <Route path="/tickets/:id" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<TicketDetail />} />
          </Route>
          <Route path="/profile" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<Profile />} />
          </Route>
          <Route path="/wallet" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<Wallet />} />
          </Route>
          <Route path="/bank-info" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<BankInfo />} />
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
          <Route path="/referrals" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<Referrals />} />
          </Route>
          <Route path="/notifications" element={<ProtectedRoute requiredRole="customer"><MainLayout /></ProtectedRoute>}>
            <Route index element={<NotificationPreferences />} />
          </Route>

          {/* Public routes */}
          <Route path="/status" element={<NetworkStatus />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* Catch-all redirects to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <CookieConsent />
        </CartProvider>
        </CustomerViewProvider>
        </ProductCacheProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
