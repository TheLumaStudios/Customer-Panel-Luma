import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getContractTemplates, createContractTemplate, updateContractTemplate, getCustomerContracts, sendContract, getAllApprovals } from '@/lib/api/contracts'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { FileText, Plus, Send, Check, X, Clock, Eye, History, AlertCircle, Edit, Shield } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import NonRepudiationCertificate from '@/components/contracts/NonRepudiationCertificate'

export default function Contracts() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('templates')
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [customerComboOpen, setCustomerComboOpen] = useState(false)
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState(null)

  // Template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    version: 'v1.0',
    content: '',
    type: 'service_agreement',
    category: 'general',
    is_mandatory: true,
    status: 'draft',
  })

  // Send contract form state
  const [sendData, setSendData] = useState({
    customer_id: '',
    template_id: '',
    service_type: '',
    service_id: '',
    expires_in_days: 30,
  })

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['contract-templates'],
    queryFn: getContractTemplates,
  })

  // Fetch customer contracts
  const { data: customerContracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['customer-contracts'],
    queryFn: getCustomerContracts,
  })

  // Fetch all approvals
  const { data: approvals = [], isLoading: approvalsLoading } = useQuery({
    queryKey: ['contract-approvals'],
    queryFn: getAllApprovals,
  })

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-for-contracts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, full_name, email, customer_code')
        .order('full_name')
      return data || []
    },
  })

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: createContractTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries(['contract-templates'])
      setTemplateModalOpen(false)
      setNewTemplate({
        name: '',
        description: '',
        version: 'v1.0',
        content: '',
        type: 'service_agreement',
        category: 'general',
        is_mandatory: true,
        status: 'draft',
      })
      toast.success('Sözleşme şablonu oluşturuldu')
    },
    onError: (error) => {
      toast.error('Hata', { description: error.message })
    },
  })

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => updateContractTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contract-templates'])
      setEditModalOpen(false)
      setEditingTemplate(null)
      toast.success('Sözleşme şablonu güncellendi')
    },
    onError: (error) => {
      toast.error('Hata', { description: error.message })
    },
  })

  // Send contract mutation
  const sendContractMutation = useMutation({
    mutationFn: sendContract,
    onSuccess: () => {
      queryClient.invalidateQueries(['customer-contracts'])
      setSendModalOpen(false)
      setSendData({
        customer_id: '',
        template_id: '',
        service_type: '',
        service_id: '',
        expires_in_days: 30,
      })
      toast.success('Sözleşme gönderildi')
    },
    onError: (error) => {
      toast.error('Hata', { description: error.message })
    },
  })

  const handleCreateTemplate = () => {
    createTemplateMutation.mutate(newTemplate)
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setEditModalOpen(true)
  }

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return
    updateTemplateMutation.mutate({
      id: editingTemplate.id,
      data: editingTemplate,
    })
  }

  const handleSendContract = () => {
    sendContractMutation.mutate(sendData)
  }

  const handleViewApproval = (approval) => {
    setSelectedApproval(approval)
    setApprovalModalOpen(true)
  }

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: 'outline', icon: Clock, text: 'Beklemede', className: 'border-yellow-500 text-yellow-700' },
      approved: { variant: 'default', icon: Check, text: 'Onaylandı', className: 'bg-green-500' },
      rejected: { variant: 'destructive', icon: X, text: 'Reddedildi', className: '' },
      expired: { variant: 'secondary', icon: AlertCircle, text: 'Süresi Doldu', className: '' },
      active: { variant: 'default', icon: Check, text: 'Aktif', className: 'bg-green-500' },
      draft: { variant: 'outline', icon: FileText, text: 'Taslak', className: '' },
      archived: { variant: 'secondary', icon: FileText, text: 'Arşiv', className: '' },
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  const selectedCustomer = customers.find(c => c.id === sendData.customer_id)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sözleşme Yönetimi</h1>
          <p className="text-muted-foreground mt-1">
            Elektronik sözleşmeler ve onay takibi (5070 sayılı kanun uyumlu)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setTemplateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Şablon
          </Button>
          <Button onClick={() => setSendModalOpen(true)} variant="outline">
            <Send className="h-4 w-4 mr-2" />
            Sözleşme Gönder
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">Şablonlar</TabsTrigger>
          <TabsTrigger value="contracts">Gönderilen Sözleşmeler</TabsTrigger>
          <TabsTrigger value="pending">Bekleyen Onaylar</TabsTrigger>
          <TabsTrigger value="approvals">Onaylar & İnkar Edilemezlik</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sözleşme Şablonları</CardTitle>
              <CardDescription>
                Müşterilere gönderilebilecek sözleşme şablonlarını yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="text-center py-8">Yükleniyor...</div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz şablon oluşturulmamış
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Şablon Adı</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Versiyon</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Zorunlu</TableHead>
                      <TableHead>Oluşturma</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>{template.type}</TableCell>
                        <TableCell>{template.category}</TableCell>
                        <TableCell>{template.version}</TableCell>
                        <TableCell>{getStatusBadge(template.status)}</TableCell>
                        <TableCell>
                          {template.is_mandatory ? (
                            <Badge variant="destructive">Zorunlu</Badge>
                          ) : (
                            <Badge variant="outline">Opsiyonel</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(template.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Düzenle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gönderilen Sözleşmeler</CardTitle>
              <CardDescription>
                Müşterilere gönderilen tüm sözleşmeler ve durumları
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contractsLoading ? (
                <div className="text-center py-8">Yükleniyor...</div>
              ) : customerContracts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz sözleşme gönderilmemiş
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Sözleşme</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Gönderen</TableHead>
                      <TableHead>Gönderim Tarihi</TableHead>
                      <TableHead>Son Tarih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerContracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{contract.customer?.full_name}</div>
                            <div className="text-sm text-muted-foreground">{contract.customer?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{contract.template?.name}</TableCell>
                        <TableCell>{contract.template?.type}</TableCell>
                        <TableCell>{getStatusBadge(contract.status)}</TableCell>
                        <TableCell>{contract.sent_by_profile?.full_name}</TableCell>
                        <TableCell>{formatDate(contract.sent_at)}</TableCell>
                        <TableCell>{contract.expires_at ? formatDate(contract.expires_at) : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bekleyen Onaylar</CardTitle>
              <CardDescription>
                Müşteri onayı bekleyen sözleşmeler
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contractsLoading ? (
                <div className="text-center py-8">Yükleniyor...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Sözleşme</TableHead>
                      <TableHead>Gönderim</TableHead>
                      <TableHead>Kalan Süre</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerContracts
                      .filter(c => c.status === 'pending')
                      .map((contract) => {
                        const daysLeft = contract.expires_at
                          ? Math.ceil((new Date(contract.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
                          : null

                        return (
                          <TableRow key={contract.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{contract.customer?.full_name}</div>
                                <div className="text-sm text-muted-foreground">{contract.customer?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{contract.template?.name}</TableCell>
                            <TableCell>{formatDate(contract.sent_at)}</TableCell>
                            <TableCell>
                              {daysLeft !== null ? (
                                <Badge variant={daysLeft < 7 ? 'destructive' : 'outline'}>
                                  {daysLeft} gün
                                </Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">
                                <Send className="h-3 w-3 mr-1" />
                                Hatırlat
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Onaylar & İnkar Edilemezlik Belgeleri</CardTitle>
              <CardDescription>
                5070 sayılı Elektronik İmza Kanunu uyarınca kaydedilen onaylar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="text-center py-8">Yükleniyor...</div>
              ) : approvals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz onay kaydı bulunmuyor
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Sözleşme</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Onay Zamanı</TableHead>
                      <TableHead>IP Adresi</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvals.map((approval) => (
                      <TableRow key={approval.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{approval.contract?.customers?.full_name}</div>
                            <div className="text-sm text-muted-foreground">{approval.contract?.customers?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{approval.contract?.contract_templates?.name}</TableCell>
                        <TableCell>{getStatusBadge(approval.approval_status)}</TableCell>
                        <TableCell>{formatDate(approval.approved_at)}</TableCell>
                        <TableCell className="font-mono text-xs">{approval.ip_address}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewApproval(approval)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Belge Görüntüle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Template Modal */}
      <Dialog open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Sözleşme Şablonu</DialogTitle>
            <DialogDescription>
              Müşterilere gönderilebilecek yeni bir sözleşme şablonu oluşturun
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Şablon Adı *</Label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Hizmet Sözleşmesi"
                  className="bg-white border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label>Versiyon</Label>
                <Input
                  value={newTemplate.version}
                  onChange={(e) => setNewTemplate({ ...newTemplate, version: e.target.value })}
                  placeholder="v1.0"
                  className="bg-white border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Sözleşme hakkında kısa açıklama"
                className="bg-white border-gray-300"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tip *</Label>
                <Select value={newTemplate.type} onValueChange={(value) => setNewTemplate({ ...newTemplate, type: value })}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service_agreement">Hizmet Sözleşmesi</SelectItem>
                    <SelectItem value="privacy_policy">Gizlilik Politikası</SelectItem>
                    <SelectItem value="terms_of_service">Kullanım Şartları</SelectItem>
                    <SelectItem value="gdpr_consent">KVKK Onayı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Genel</SelectItem>
                    <SelectItem value="hosting">Hosting</SelectItem>
                    <SelectItem value="domain">Domain</SelectItem>
                    <SelectItem value="vps">VPS</SelectItem>
                    <SelectItem value="vds">VDS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sözleşme İçeriği * (HTML destekli)</Label>
              <Textarea
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                placeholder="Sözleşme metni buraya yazılacak..."
                className="bg-white border-gray-300 font-mono"
                rows={12}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_mandatory"
                checked={newTemplate.is_mandatory}
                onChange={(e) => setNewTemplate({ ...newTemplate, is_mandatory: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_mandatory" className="cursor-pointer">
                Zorunlu onay (Müşteri reddedemez)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleCreateTemplate} disabled={!newTemplate.name || !newTemplate.content}>
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sözleşme Şablonunu Düzenle</DialogTitle>
            <DialogDescription>
              Sözleşme şablonunu güncelleyin ve taslaktan aktif duruma geçirin
            </DialogDescription>
          </DialogHeader>

          {editingTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Şablon Adı *</Label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    placeholder="Hizmet Sözleşmesi"
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Versiyon</Label>
                  <Input
                    value={editingTemplate.version}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, version: e.target.value })}
                    placeholder="v1.0"
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={editingTemplate.description || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  placeholder="Sözleşme hakkında kısa açıklama"
                  className="bg-white border-gray-300"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tip *</Label>
                  <Select value={editingTemplate.type} onValueChange={(value) => setEditingTemplate({ ...editingTemplate, type: value })}>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service_agreement">Hizmet Sözleşmesi</SelectItem>
                      <SelectItem value="privacy_policy">Gizlilik Politikası</SelectItem>
                      <SelectItem value="terms_of_service">Kullanım Şartları</SelectItem>
                      <SelectItem value="gdpr_consent">KVKK Onayı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={editingTemplate.category} onValueChange={(value) => setEditingTemplate({ ...editingTemplate, category: value })}>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Genel</SelectItem>
                      <SelectItem value="hosting">Hosting</SelectItem>
                      <SelectItem value="domain">Domain</SelectItem>
                      <SelectItem value="vps">VPS</SelectItem>
                      <SelectItem value="vds">VDS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Durum *</Label>
                <Select value={editingTemplate.status} onValueChange={(value) => setEditingTemplate({ ...editingTemplate, status: value })}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Taslak</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="archived">Arşiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sözleşme İçeriği * (HTML destekli)</Label>
                <Textarea
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                  placeholder="Sözleşme metni buraya yazılacak..."
                  className="bg-white border-gray-300 font-mono"
                  rows={12}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_is_mandatory"
                  checked={editingTemplate.is_mandatory}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, is_mandatory: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit_is_mandatory" className="cursor-pointer">
                  Zorunlu onay (Müşteri reddedemez)
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleUpdateTemplate} disabled={!editingTemplate?.name || !editingTemplate?.content}>
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Contract Modal */}
      <Dialog open={sendModalOpen} onOpenChange={setSendModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sözleşme Gönder</DialogTitle>
            <DialogDescription>
              Müşteriye onay için sözleşme gönderin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Müşteri Seç *</Label>
              <Popover open={customerComboOpen} onOpenChange={setCustomerComboOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-white border-gray-300"
                  >
                    {selectedCustomer ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{selectedCustomer.full_name}</span>
                        <span className="text-muted-foreground">({selectedCustomer.email})</span>
                      </div>
                    ) : (
                      'Müşteri seçin...'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0 z-[9999]" align="start">
                  <Command>
                    <CommandInput placeholder="Müşteri ara..." />
                    <CommandList>
                      <CommandEmpty>Müşteri bulunamadı</CommandEmpty>
                      <CommandGroup className="pointer-events-auto">
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            onSelect={() => {
                              setSendData({ ...sendData, customer_id: customer.id })
                              setCustomerComboOpen(false)
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{customer.full_name}</span>
                              <span className="text-sm text-muted-foreground">{customer.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Sözleşme Şablonu *</Label>
              <Select value={sendData.template_id} onValueChange={(value) => setSendData({ ...sendData, template_id: value })}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Şablon seçin" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.status === 'active' || t.status === 'draft').map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.version}) {template.status === 'draft' && '(Taslak)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Geçerlilik Süresi (Gün)</Label>
              <Input
                type="number"
                value={sendData.expires_in_days}
                onChange={(e) => setSendData({ ...sendData, expires_in_days: parseInt(e.target.value) })}
                className="bg-white border-gray-300"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendModalOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={handleSendContract}
              disabled={!sendData.customer_id || !sendData.template_id}
            >
              <Send className="h-4 w-4 mr-2" />
              Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Non-Repudiation Certificate Modal */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="no-print">
            <DialogTitle>İnkar Edilemezlik Belgesi</DialogTitle>
            <DialogDescription>
              5070 sayılı Elektronik İmza Kanunu uyarınca kaydedilen onay bilgileri
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && <NonRepudiationCertificate approval={selectedApproval} />}

          <DialogFooter className="gap-2 no-print">
            <Button variant="outline" onClick={() => setApprovalModalOpen(false)}>
              Kapat
            </Button>
            <Button
              onClick={() => {
                // Create a new window with just the certificate
                const printWindow = window.open('', '', 'width=800,height=600')
                const certificateHTML = document.querySelector('.certificate-container').innerHTML

                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>İnkar Edilemezlik Belgesi</title>
                      <script src="https://cdn.tailwindcss.com"></script>
                      <style>
                        @media print {
                          @page {
                            size: A4 portrait;
                            margin: 1.5cm;
                          }
                        }
                      </style>
                    </head>
                    <body class="bg-white p-4">
                      <div class="certificate-container">
                        ${certificateHTML}
                      </div>
                      <script>
                        // Auto print when loaded
                        window.onload = function() {
                          setTimeout(function() {
                            window.print();
                          }, 500);
                        }
                      </script>
                    </body>
                  </html>
                `)
                printWindow.document.close()
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Yazdır / PDF Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
