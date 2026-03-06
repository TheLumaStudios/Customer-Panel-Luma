import { useState } from 'react'
import { useServers, useCreateServer, useUpdateServer, useDeleteServer, useTestServerConnection, useSyncServerAccounts } from '@/hooks/useServers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Server, Globe, Activity, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'
import ServerForm from '@/components/servers/ServerForm'

export default function Servers() {
  const { data: servers, isLoading, error } = useServers()
  const createServer = useCreateServer()
  const updateServer = useUpdateServer()
  const deleteServer = useDeleteServer()
  const testConnection = useTestServerConnection()
  const syncAccounts = useSyncServerAccounts()

  const [formOpen, setFormOpen] = useState(false)
  const [editingServer, setEditingServer] = useState(null)
  const [testingServer, setTestingServer] = useState(null)
  const [syncingServer, setSyncingServer] = useState(null)

  const handleCreate = () => {
    setEditingServer(null)
    setFormOpen(true)
  }

  const handleEdit = (server) => {
    setEditingServer(server)
    setFormOpen(true)
  }

  const handleSubmit = async (data) => {
    try {
      if (editingServer) {
        await updateServer.mutateAsync({
          id: editingServer.id,
          data
        })
        toast.success('Sunucu güncellendi', {
          description: 'Değişiklikler başarıyla kaydedildi'
        })
      } else {
        await createServer.mutateAsync(data)
        toast.success('Sunucu oluşturuldu', {
          description: 'Yeni sunucu sisteme eklendi'
        })
      }
      setFormOpen(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('İşlem başarısız', {
        description: error.response?.data?.message || error.message
      })
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Bu sunucuyu silmek istediğinizden emin misiniz?')) {
      try {
        await deleteServer.mutateAsync(id)
        toast.success('Sunucu silindi', {
          description: 'Kayıt sistemden kaldırıldı'
        })
      } catch (error) {
        toast.error('Silme işlemi başarısız', {
          description: error.message
        })
      }
    }
  }

  const handleTestConnection = async (serverId) => {
    setTestingServer(serverId)
    try {
      const result = await testConnection.mutateAsync(serverId)
      if (result.success) {
        toast.success('Bağlantı başarılı', {
          description: `${result.message}. Version: ${result.version || 'N/A'}`
        })
      } else {
        toast.error('Bağlantı başarısız', {
          description: result.message
        })
      }
    } catch (error) {
      toast.error('Bağlantı hatası', {
        description: error.message
      })
    } finally {
      setTestingServer(null)
    }
  }

  const handleSyncAccounts = async (serverId) => {
    if (!confirm('Bu sunucudaki tüm cPanel hesaplarını senkronize etmek istediğinizden emin misiniz?\n\nBu işlem:\n- Sunucudaki tüm hesapları getirir\n- Müşteri eşleştirmesi yapar (yoksa oluşturur)\n- Hosting kayıtları oluşturur/günceller')) {
      return
    }

    setSyncingServer(serverId)
    try {
      const result = await syncAccounts.mutateAsync(serverId)

      let description = `Toplam: ${result.total} hesap, Yeni: ${result.created}, Güncellenen: ${result.updated}`
      if (result.skipped > 0) {
        description += `, Atlanan: ${result.skipped}`
      }

      if (result.errors && result.errors.length > 0) {
        toast.warning('Senkronizasyon tamamlandı (hatalarla)', {
          description: `${description}. ${result.errors.length} hata oluştu`
        })
      } else {
        toast.success('Senkronizasyon tamamlandı', {
          description
        })
      }
    } catch (error) {
      toast.error('Senkronizasyon hatası', {
        description: error.message
      })
    } finally {
      setSyncingServer(null)
    }
  }

  const getServerTypeLabel = (type) => {
    const types = {
      cpanel: 'cPanel/WHM',
      plesk: 'Plesk',
      directadmin: 'DirectAdmin',
      custom: 'Özel'
    }
    return types[type] || type
  }

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

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Hata</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sunucular</h1>
          <p className="text-muted-foreground mt-1">
            Sunucularınızı yönetin ve erişim bilgilerini saklayın
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Sunucu
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sunucu Listesi</CardTitle>
          <CardDescription>
            Toplam {servers?.length || 0} sunucu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {servers?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz sunucu bulunmuyor. Yeni bir sunucu ekleyin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sunucu Adı</TableHead>
                    <TableHead>Hostname</TableHead>
                    <TableHead>IP Adresi</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Konum</TableHead>
                    <TableHead>Max. Hesap</TableHead>
                    <TableHead>Son Kontrol</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servers?.map((server) => (
                    <TableRow key={server.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-muted-foreground" />
                          {server.server_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {server.hostname}
                        </code>
                      </TableCell>
                      <TableCell>{server.ip_address}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getServerTypeLabel(server.server_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{server.port}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          {server.datacenter && (
                            <span>{server.datacenter}, </span>
                          )}
                          <span>{server.country}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {server.max_accounts === 0 ? 'Sınırsız' : server.max_accounts}
                      </TableCell>
                      <TableCell>
                        {server.last_checked ? (
                          <div className="text-xs">
                            <div className="text-muted-foreground">
                              {formatDate(server.last_checked)}
                            </div>
                            <div className="mt-1">
                              {server.status_message?.includes('başarılı') || server.status_message?.includes('success') ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span className="truncate max-w-[150px]" title={server.status_message}>
                                    {server.status_message}
                                  </span>
                                </div>
                              ) : server.status_message ? (
                                <div className="flex items-center gap-1 text-red-600">
                                  <XCircle className="h-3 w-3" />
                                  <span className="truncate max-w-[150px]" title={server.status_message}>
                                    {server.status_message}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Henüz test edilmedi</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {server.is_active ? (
                          <Badge variant="default">Aktif</Badge>
                        ) : (
                          <Badge variant="secondary">Pasif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTestConnection(server.id)}
                            title="Bağlantıyı Test Et"
                            disabled={testingServer === server.id || syncingServer === server.id}
                          >
                            <Activity className={`h-4 w-4 ${testingServer === server.id ? 'animate-pulse' : ''}`} />
                          </Button>
                          {server.server_type === 'cpanel' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSyncAccounts(server.id)}
                              title="Hesapları Senkronize Et"
                              disabled={syncingServer === server.id || testingServer === server.id}
                            >
                              <RefreshCw className={`h-4 w-4 text-blue-600 ${syncingServer === server.id ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(server)}
                            title="Düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(server.id)}
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ServerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        server={editingServer}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
