import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server, Wifi, AlertTriangle, CheckCircle, XCircle, MinusCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const statusConfig = {
  operational: {
    label: 'Çalışıyor',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    icon: CheckCircle,
  },
  degraded: {
    label: 'Düşük Performans',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    icon: AlertTriangle,
  },
  partial_outage: {
    label: 'Kısmi Kesinti',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    icon: AlertTriangle,
  },
  major_outage: {
    label: 'Büyük Kesinti',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: XCircle,
  },
  outage: {
    label: 'Kesinti',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: XCircle,
  },
  maintenance: {
    label: 'Bakım',
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    icon: MinusCircle,
  },
}

const announcementTypeConfig = {
  info: { variant: 'default', className: '' },
  warning: { variant: 'secondary', className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
  critical: { variant: 'destructive', className: '' },
  maintenance: { variant: 'outline', className: '' },
}

const announcementTypeLabels = {
  info: 'Bilgi',
  warning: 'Uyarı',
  critical: 'Kritik',
  maintenance: 'Bakım',
}

export default function NetworkStatus() {
  const [servers, setServers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { data: announcements } = useAnnouncements()

  useEffect(() => {
    const fetchServers = async () => {
      const { data, error } = await supabase
        .from('server_status')
        .select('*')
        .order('server_name')
      if (!error) {
        setServers(data || [])
      }
      setIsLoading(false)
    }
    fetchServers()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  const allOperational = servers.length > 0 && servers.every((s) => s.status === 'operational')

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Ağ Durumu</h1>
        <p className="text-muted-foreground">
          Sunucu ve hizmet durumlarını anlık olarak takip edin
        </p>
      </div>

      {/* Overall Status */}
      <Card className={allOperational ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-3">
            {allOperational ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span className="text-lg font-medium text-green-800">
                  Tüm sistemler çalışıyor
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <span className="text-lg font-medium text-yellow-800">
                  Bazı sistemlerde sorun tespit edildi
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Server Status Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Server className="h-5 w-5" />
          Sunucu Durumları
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => {
            const config = statusConfig[server.status] || statusConfig.operational
            const StatusIcon = config.icon
            return (
              <Card key={server.id} className={`${config.bgColor} border`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${config.color}`} />
                      <div>
                        <div className="font-medium">{server.server_name}</div>
                        {server.message && (
                          <div className="text-sm text-muted-foreground">{server.message}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-5 w-5 ${config.textColor}`} />
                      <span className={`text-sm font-medium ${config.textColor}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        {servers.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Sunucu bilgisi bulunamadı.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active Announcements */}
      {announcements?.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Aktif Duyurular
          </h2>
          <div className="space-y-3">
            {announcements.map((announcement) => {
              const typeConfig = announcementTypeConfig[announcement.type] || announcementTypeConfig.info
              return (
                <Card key={announcement.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <Badge
                        variant={typeConfig.variant}
                        className={typeConfig.className}
                      >
                        {announcementTypeLabels[announcement.type]}
                      </Badge>
                    </div>
                    <CardDescription>{formatDate(announcement.starts_at)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{announcement.content}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
