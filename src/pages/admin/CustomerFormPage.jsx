import { useNavigate, useParams } from 'react-router-dom'
import { useCustomers, useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers'
import { FormPageLayout } from '@/components/shared/FormPageLayout'
import CustomerForm from '@/components/customers/CustomerForm'
import { toast } from '@/lib/toast'

export default function CustomerFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data: customers } = useCustomers()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()

  const customer = id ? customers?.find(c => c.id === id) : null
  const isEdit = !!id

  const handleSubmit = async (data) => {
    try {
      const customerData = {
        customer_code: data.customer_code,
        status: data.status,
        customer_type: data.customer_type || 'host',
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        company_name: data.company_name || null,
        tc_no: data.tc_no || null,
        vkn: data.vkn || null,
        tax_office: data.tax_office || null,
        fax: data.fax || null,
        website: data.website || null,
        billing_address: data.billing_address || null,
        billing_city: data.billing_city || null,
        billing_district: data.billing_district || null,
        billing_postal_code: data.billing_postal_code || null,
        billing_country: data.billing_country || 'Türkiye',
        notes: data.notes || null,
      }

      if (isEdit) {
        await updateCustomer.mutateAsync({ id, data: customerData })
        toast.success('Müşteri güncellendi')
      } else {
        await createCustomer.mutateAsync(customerData)
        toast.success('Müşteri oluşturuldu')
      }
      navigate('/admin/customers')
    } catch (error) {
      toast.error('İşlem başarısız', { description: error.message })
    }
  }

  return (
    <FormPageLayout
      title={isEdit ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
      description={isEdit ? `${customer?.full_name || ''} bilgilerini düzenleyin` : 'Sisteme yeni müşteri ekleyin'}
    >
      <CustomerForm
        open={true}
        onOpenChange={() => navigate('/admin/customers')}
        customer={customer}
        onSubmit={handleSubmit}
        embedded={true}
      />
    </FormPageLayout>
  )
}
