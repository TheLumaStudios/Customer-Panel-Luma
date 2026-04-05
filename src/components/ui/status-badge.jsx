import { Badge } from '@/components/ui/badge'

const STATUS_STYLES = {
  active: { label: 'Aktif', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive: { label: 'Pasif', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  suspended: { label: 'Askıda', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  terminated: { label: 'Sonlandırıldı', className: 'bg-red-50 text-red-700 border-red-200' },
  pending: { label: 'Bekliyor', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid: { label: 'Ödendi', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  unpaid: { label: 'Ödenmedi', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  overdue: { label: 'Vadesi Geçmiş', className: 'bg-red-50 text-red-700 border-red-200' },
  refunded: { label: 'İade Edildi', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  cancelled: { label: 'İptal', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  open: { label: 'Açık', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'İşlemde', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  resolved: { label: 'Çözüldü', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'Kapatıldı', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  draft: { label: 'Taslak', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  published: { label: 'Yayında', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  archived: { label: 'Arşiv', className: 'bg-slate-50 text-slate-600 border-slate-200' },
  software: { label: 'Yazılım', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  host: { label: 'Host', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  low: { label: 'Düşük', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  medium: { label: 'Orta', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  high: { label: 'Yüksek', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  urgent: { label: 'Acil', className: 'bg-red-50 text-red-700 border-red-200' },
  expired: { label: 'Süresi Doldu', className: 'bg-red-50 text-red-700 border-red-200' },
  processing: { label: 'İşleniyor', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved: { label: 'Onaylandı', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Reddedildi', className: 'bg-red-50 text-red-700 border-red-200' },
  invoiced: { label: 'Faturalandı', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  completed: { label: 'Tamamlandı', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { label: 'Başarısız', className: 'bg-red-50 text-red-700 border-red-200' },
  running: { label: 'Çalışıyor', className: 'bg-blue-50 text-blue-700 border-blue-200' },
}

export function StatusBadge({ status, customLabel, className = '' }) {
  const config = STATUS_STYLES[status] || { label: status, className: 'bg-gray-50 text-gray-600 border-gray-200' }
  return (
    <Badge variant="outline" className={`${config.className} ${className}`}>
      {customLabel || config.label}
    </Badge>
  )
}
