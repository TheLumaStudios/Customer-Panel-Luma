import { useAuth } from '@/hooks/useAuth.jsx'
import { useCustomers } from '@/hooks/useCustomers'
import { DeployHooks } from '@/components/shared/DeployHooks'
import { BrandingSettings } from '@/components/shared/BrandingSettings'
import SEO from '@/components/SEO'

export default function Developer() {
  const { profile } = useAuth()
  const { data: customers } = useCustomers()
  const currentCustomer = customers?.find(c => c.email === profile?.email)

  if (!currentCustomer) return <div className="page-container"><p className="text-muted-foreground">Yükleniyor...</p></div>

  return (
    <div className="page-container">
      <SEO title="Geliştirici" noIndex />
      <div className="page-header">
        <div>
          <h1 className="page-title">Geliştirici Araçları</h1>
          <p className="page-description">API, deploy hooks ve marka ayarları</p>
        </div>
      </div>

      <div className="grid gap-6">
        <DeployHooks customerId={currentCustomer.id} />
        <BrandingSettings customerId={currentCustomer.id} />
      </div>
    </div>
  )
}
