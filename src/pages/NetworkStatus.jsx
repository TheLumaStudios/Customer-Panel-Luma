import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server, Wifi, AlertTriangle, CheckCircle, XCircle, MinusCircle, Clock, Activity } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { useLocation } from 'react-router-dom'

const statusConfig = {
  operational: {
    label: 'Çalışıyor',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    darkBgColor: 'bg-green-950/30',
    darkTextColor: 'text-green-400',
    icon: CheckCircle,
  },
  degraded: {
    label: 'Düşük Performans',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    darkBgColor: 'bg-yellow-950/30',
    darkTextColor: 'text-yellow-400',
    icon: AlertTriangle,
  },
  partial_outage: {
    label: 'Kısmi Kesinti',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    darkBgColor: 'bg-orange-950/30',
    darkTextColor: 'text-orange-400',
    icon: AlertTriangle,
  },
  major_outage: {
    label: 'Büyük Kesinti',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    darkBgColor: 'bg-red-950/30',
    darkTextColor: 'text-red-400',
    icon: XCircle,
  },
  outage: {
    label: 'Kesinti',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    darkBgColor: 'bg-red-950/30',
    darkTextColor: 'text-red-400',
    icon: XCircle,
  },
  maintenance: {
    label: 'Bakım',
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    darkBgColor: 'bg-gray-800/30',
    darkTextColor: 'text-gray-400',
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

const incidentStatusConfig = {
  investigating: { label: 'Araştırılıyor', color: 'bg-yellow-500' },
  identified: { label: 'Tespit Edildi', color: 'bg-orange-500' },
  monitoring: { label: 'İzleniyor', color: 'bg-blue-500' },
  resolved: { label: 'Çözüldü', color: 'bg-green-500' },
}

function UptimeBar({ checks, days = 30 }) {
  // Group checks by day
  const now = new Date()
  const bars = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().slice(0, 10)
    const dayChecks = checks.filter(c => c.checked_at?.slice(0, 10) === dateStr)
    const hasDown = dayChecks.some(c => c.status === 'down')
    const hasDegraded = dayChecks.some(c => c.status === 'degraded')
    const color = hasDown ? 'bg-red-500' : hasDegraded ? 'bg-yellow-500' : dayChecks.length > 0 ? 'bg-green-500' : 'bg-slate-700'
    bars.push(
      <div
        key={dateStr}
        className={`flex-1 h-8 rounded-sm ${color} min-w-[3px]`}
        title={`${dateStr}: ${hasDown ? 'Kesinti' : hasDegraded ? 'Performans sorunu' : dayChecks.length > 0 ? 'Çalışıyor' : 'Veri yok'}`}
      />
    )
  }

  const totalChecks = checks.length
  const upChecks = checks.filter(c => c.status === 'up').length
  const uptimePercent = totalChecks > 0 ? ((upChecks / totalChecks) * 100).toFixed(2) : '100.00'

  return (
    <div>
      <div className="flex gap-[2px]">{bars}</div>
      <div className="flex justify-between mt-1 text-xs text-slate-500">
        <span>{days} gün önce</span>
        <span className="font-medium text-green-400">{uptimePercent}% uptime</span>
        <span>Bugün</span>
      </div>
    </div>
  )
}

export default function NetworkStatus() {
  const [servers, setServers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [incidents, setIncidents] = useState([])
  const [uptimeChecks, setUptimeChecks] = useState([])
  const { data: announcements } = useAnnouncements()
  const location = useLocation()

  // Detect if rendered at /status (public) or /network-status (customer panel)
  const isPublic = location.pathname === '/status'

  useEffect(() => {
    const fetchData = async () => {
      // Fetch server status
      const { data: serverData } = await supabase
        .from('server_status')
        .select('*')
        .order('server_name')
      setServers(serverData || [])

      // Fetch uptime checks (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data: checks } = await supabase
        .from('uptime_checks')
        .select('server_id, status, response_time_ms, checked_at')
        .gte('checked_at', thirtyDaysAgo)
        .order('checked_at', { ascending: true })
      setUptimeChecks(checks || [])

      // Fetch recent incidents
      const { data: incidentData } = await supabase
        .from('incidents')
        .select('*, incident_updates(*)')
        .order('created_at', { ascending: false })
        .limit(10)
      setIncidents(incidentData || [])

      setIsLoading(false)
    }
    fetchData()
  }, [])

  const allOperational = servers.length > 0 && servers.every((s) => s.status === 'operational')

  // Compute overall uptime
  const totalChecks = uptimeChecks.length
  const upChecks = uptimeChecks.filter(c => c.status === 'up').length
  const overallUptime = totalChecks > 0 ? ((upChecks / totalChecks) * 100).toFixed(2) : '99.99'

  const content = (
    <div className={isPublic ? 'min-h-screen bg-slate-950 text-white' : ''}>
      <div className={`max-w-4xl mx-auto ${isPublic ? 'px-4 py-12' : ''} space-y-8`}>
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className={`text-3xl font-bold ${isPublic ? 'text-white' : ''}`}>Sistem Durumu</h1>
          <p className={isPublic ? 'text-slate-400' : 'text-muted-foreground'}>
            Sunucu ve hizmet durumlarını anlık olarak takip edin
          </p>
        </div>

        {/* Overall Status Badge */}
        <div className={`rounded-xl p-5 text-center ${isPublic
          ? (allOperational ? 'bg-green-950/40 border border-green-800' : 'bg-yellow-950/40 border border-yellow-800')
          : (allOperational ? 'border-green-200 bg-green-50 border' : 'border-yellow-200 bg-yellow-50 border')
        }`}>
          <div className="flex items-center justify-center gap-3">
            {allOperational ? (
              <>
                <CheckCircle className={`h-7 w-7 ${isPublic ? 'text-green-400' : 'text-green-600'}`} />
                <div>
                  <span className={`text-lg font-semibold ${isPublic ? 'text-green-300' : 'text-green-800'}`}>
                    Tüm sistemler çalışıyor
                  </span>
                  <p className={`text-sm ${isPublic ? 'text-green-400/70' : 'text-green-600'}`}>
                    Son 30 gün uptime: {overallUptime}%
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className={`h-7 w-7 ${isPublic ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <span className={`text-lg font-semibold ${isPublic ? 'text-yellow-300' : 'text-yellow-800'}`}>
                  Bazı sistemlerde sorun tespit edildi
                </span>
              </>
            )}
          </div>
        </div>

        {/* Server Status with Uptime Bars */}
        <div>
          <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isPublic ? 'text-white' : ''}`}>
            <Server className="h-5 w-5" />
            Sunucu Durumları
          </h2>
          <div className="space-y-4">
            {servers.map((server) => {
              const config = statusConfig[server.status] || statusConfig.operational
              const StatusIcon = config.icon
              const serverChecks = uptimeChecks.filter(c => c.server_id === server.server_id || c.server_id === server.id)

              return (
                <div key={server.id} className={`rounded-lg p-4 ${isPublic ? 'bg-slate-900 border border-slate-800' : `${config.bgColor} border`}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${config.color}`} />
                      <div>
                        <div className={`font-medium ${isPublic ? 'text-white' : ''}`}>{server.server_name}</div>
                        {server.message && (
                          <div className={`text-sm ${isPublic ? 'text-slate-400' : 'text-muted-foreground'}`}>{server.message}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-5 w-5 ${isPublic ? config.darkTextColor : config.textColor}`} />
                      <span className={`text-sm font-medium ${isPublic ? config.darkTextColor : config.textColor}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                  {serverChecks.length > 0 && <UptimeBar checks={serverChecks} days={30} />}
                </div>
              )
            })}
          </div>
          {servers.length === 0 && (
            <div className={`rounded-lg p-8 text-center ${isPublic ? 'bg-slate-900 border border-slate-800 text-slate-400' : 'border text-muted-foreground'}`}>
              Sunucu bilgisi bulunamadı.
            </div>
          )}
        </div>

        {/* Incidents Timeline */}
        {incidents.length > 0 && (
          <div>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isPublic ? 'text-white' : ''}`}>
              <Activity className="h-5 w-5" />
              Son Olaylar
            </h2>
            <div className="space-y-3">
              {incidents.map((incident) => {
                const statusCfg = incidentStatusConfig[incident.status] || incidentStatusConfig.investigating
                return (
                  <div key={incident.id} className={`rounded-lg p-4 ${isPublic ? 'bg-slate-900 border border-slate-800' : 'border bg-card'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-medium ${isPublic ? 'text-white' : ''}`}>{incident.title}</h3>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${statusCfg.color}`} />
                        <span className={`text-xs ${isPublic ? 'text-slate-400' : 'text-muted-foreground'}`}>{statusCfg.label}</span>
                      </div>
                    </div>
                    {incident.description && (
                      <p className={`text-sm mb-2 ${isPublic ? 'text-slate-400' : 'text-muted-foreground'}`}>{incident.description}</p>
                    )}
                    {/* Timeline updates */}
                    {incident.incident_updates?.length > 0 && (
                      <div className={`mt-3 pt-3 border-t space-y-2 ${isPublic ? 'border-slate-800' : 'border-muted'}`}>
                        {incident.incident_updates
                          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                          .slice(0, 3)
                          .map((upd) => (
                            <div key={upd.id} className="flex gap-2 text-sm">
                              <div className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${incidentStatusConfig[upd.status]?.color || 'bg-gray-500'}`} />
                              <div>
                                <span className={`font-medium ${isPublic ? 'text-slate-300' : ''}`}>{incidentStatusConfig[upd.status]?.label}: </span>
                                <span className={isPublic ? 'text-slate-400' : 'text-muted-foreground'}>{upd.message}</span>
                                <span className={`text-xs ml-2 ${isPublic ? 'text-slate-600' : 'text-muted-foreground'}`}>
                                  {new Date(upd.created_at).toLocaleString('tr-TR')}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                    <p className={`text-xs mt-2 ${isPublic ? 'text-slate-600' : 'text-muted-foreground'}`}>
                      {new Date(incident.started_at || incident.created_at).toLocaleString('tr-TR')}
                      {incident.resolved_at && ` — Çözüldü: ${new Date(incident.resolved_at).toLocaleString('tr-TR')}`}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Active Announcements */}
        {announcements?.length > 0 && (
          <div>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isPublic ? 'text-white' : ''}`}>
              <Wifi className="h-5 w-5" />
              Aktif Duyurular
            </h2>
            <div className="space-y-3">
              {announcements.map((announcement) => {
                const typeConfig = announcementTypeConfig[announcement.type] || announcementTypeConfig.info
                return (
                  <Card key={announcement.id} className={isPublic ? 'bg-slate-900 border-slate-800' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className={`text-lg ${isPublic ? 'text-white' : ''}`}>{announcement.title}</CardTitle>
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
                      <p className={`text-sm ${isPublic ? 'text-slate-300' : ''}`}>{announcement.content}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className={isPublic ? 'min-h-screen bg-slate-950 flex items-center justify-center' : 'flex items-center justify-center p-8'}>
        <div className="text-center">
          <div className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent ${isPublic ? 'border-white' : 'border-current'}`}></div>
          <p className={`mt-2 ${isPublic ? 'text-slate-400' : 'text-muted-foreground'}`}>Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Public route: wrap with landing header/footer
  if (isPublic) {
    return (
      <div className="min-h-screen bg-slate-950">
        <LandingHeader />
        {content}
        <LandingFooter />
      </div>
    )
  }

  return content
}
