import { useState } from 'react'
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '@/hooks/useEmployees'
import { generateEmployeeCode, createEmployeeAuth } from '@/lib/api/employees'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Users, UserCheck, UserX, RefreshCw, Key, Copy, CheckCircle2, AlertCircle, ExternalLink, MessageSquare } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'

export default function Employees() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState(null)
  const [creatingAuthFor, setCreatingAuthFor] = useState(null)

  const { data: employees, isLoading, error, refetch } = useEmployees({
    status: statusFilter === 'all' ? undefined : statusFilter,
  })

  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const deleteEmployee = useDeleteEmployee()

  const [formData, setFormData] = useState({
    employee_code: '',
    full_name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    hire_date: new Date().toISOString().split('T')[0],
    salary: '',
    currency: 'TRY',
    status: 'active',
    notes: '',
  })

  const handleCreate = async () => {
    setEditingEmployee(null)
    // Generate employee code
    const code = await generateEmployeeCode()
    setFormData({
      employee_code: code,
      full_name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      hire_date: new Date().toISOString().split('T')[0],
      salary: '',
      currency: 'TRY',
      status: 'active',
      notes: '',
    })
    setFormOpen(true)
  }

  const handleEdit = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      employee_code: employee.employee_code || '',
      full_name: employee.full_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || '',
      department: employee.department || '',
      hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
      salary: employee.salary || '',
      currency: employee.currency || 'TRY',
      status: employee.status || 'active',
      notes: employee.notes || '',
    })
    setFormOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const data = {
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : null,
      }

      if (editingEmployee) {
        await updateEmployee.mutateAsync({ id: editingEmployee.id, data })
        toast.success('Çalışan güncellendi', {
          description: `${formData.full_name} bilgileri güncellendi`,
        })
      } else {
        await createEmployee.mutateAsync(data)
        toast.success('Çalışan eklendi', {
          description: `${formData.full_name} sisteme eklendi`,
        })
      }

      setFormOpen(false)
      setEditingEmployee(null)
    } catch (error) {
      toast.error('İşlem başarısız', {
        description: error.message,
      })
    }
  }

  const handleDelete = async (employee) => {
    if (!confirm(`${employee.full_name} adlı çalışanı silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      await deleteEmployee.mutateAsync(employee.id)
      toast.success('Çalışan silindi', {
        description: `${employee.full_name} sistemden kaldırıldı`,
      })
    } catch (error) {
      toast.error('Silme işlemi başarısız', {
        description: error.message,
      })
    }
  }

  const handleCreateAuth = async (employee) => {
    if (!employee.email) {
      toast.error('E-posta gerekli', {
        description: 'Giriş oluşturmak için çalışanın e-posta adresi olmalı',
      })
      return
    }

    if (employee.profile_id) {
      toast.error('Giriş zaten mevcut', {
        description: 'Bu çalışanın giriş hesabı zaten oluşturulmuş',
      })
      return
    }

    setCreatingAuthFor(employee.id)

    try {
      const result = await createEmployeeAuth(employee.id, false)

      setGeneratedPassword({
        email: result.email,
        password: result.password,
        full_name: result.full_name,
        employee_name: employee.full_name,
        employee_id: employee.id,
        employee_phone: employee.phone,
        sms_sent: false,
      })
      setPasswordDialogOpen(true)

      toast.success('Giriş oluşturuldu', {
        description: `${employee.full_name} için giriş hesabı oluşturuldu`,
      })

      // Refresh employee list
      refetch()
    } catch (error) {
      toast.error('Giriş oluşturulamadı', {
        description: error.message,
      })
    } finally {
      setCreatingAuthFor(null)
    }
  }

  const handleSendSMS = async () => {
    if (!generatedPassword) return

    try {
      const { sendEmployeePassword } = await import('@/lib/api/employees')
      await sendEmployeePassword(generatedPassword.employee_id, generatedPassword.password)

      setGeneratedPassword(prev => ({ ...prev, sms_sent: true }))

      toast.success('SMS gönderildi', {
        description: `${generatedPassword.employee_phone} numarasına gönderildi`,
      })
    } catch (error) {
      toast.error('SMS gönderilemedi', {
        description: error.message,
      })
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Kopyalandı', {
      description: 'Panoya kopyalandı',
    })
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

  const getStatusBadge = (status) => {
    const config = {
      active: { label: 'Aktif', className: 'bg-green-100 text-green-800 border-green-200' },
      inactive: { label: 'Pasif', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      terminated: { label: 'İşten Ayrıldı', className: 'bg-red-100 text-red-800 border-red-200' },
    }
    const { label, className } = config[status] || config.active
    return <Badge variant="outline" className={className}>{label}</Badge>
  }

  const formatCurrency = (amount, currency = 'TRY') => {
    if (!amount) return '-'
    const value = parseFloat(amount)
    if (currency === 'TRY') {
      return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Calculate statistics
  const stats = {
    total: employees?.length || 0,
    active: employees?.filter(e => e.status === 'active').length || 0,
    inactive: employees?.filter(e => e.status === 'inactive').length || 0,
    terminated: employees?.filter(e => e.status === 'terminated').length || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Çalışanlar</h1>
          <p className="text-muted-foreground mt-1">
            Personel ve çalışan yönetimi
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Çalışan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Çalışan</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Kayıtlı personel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Çalışan personel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pasif</CardTitle>
            <UserX className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Pasif durumdaki</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İşten Ayrılan</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.terminated}</div>
            <p className="text-xs text-muted-foreground">İşten ayrılmış</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Çalışan Listesi</CardTitle>
              <CardDescription>
                Toplam {stats.total} çalışan
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tüm Durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Çalışanlar</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                  <SelectItem value="terminated">İşten Ayrılanlar</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {employees && employees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">
                {statusFilter !== 'all'
                  ? 'Bu filtreye uygun çalışan bulunamadı'
                  : 'Henüz çalışan eklenmemiş'
                }
              </p>
              {statusFilter === 'all' && (
                <p className="text-sm mt-1">Yeni bir çalışan ekleyin</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Çalışan Kodu</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Pozisyon</TableHead>
                  <TableHead>Departman</TableHead>
                  <TableHead>İletişim</TableHead>
                  <TableHead>İşe Başlama</TableHead>
                  <TableHead>Maaş</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Giriş</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees?.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.employee_code || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{employee.full_name}</div>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department || '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{employee.email || '-'}</div>
                        <div className="text-muted-foreground">{employee.phone || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {employee.hire_date ? formatDate(employee.hire_date) : '-'}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(employee.salary, employee.currency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell>
                      {employee.profile_id ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Yok
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!employee.profile_id && employee.email && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCreateAuth(employee, false)}
                            disabled={creatingAuthFor === employee.id}
                            title="Giriş Oluştur"
                          >
                            <Key className="h-4 w-4 text-purple-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(employee)}
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(employee)}
                          disabled={deleteEmployee.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Giriş Bilgileri Oluşturuldu</DialogTitle>
            <DialogDescription>
              {generatedPassword?.employee_name} için giriş hesabı başarıyla oluşturuldu
            </DialogDescription>
          </DialogHeader>
          {generatedPassword && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-900">Çalışan panele giriş yapabilir</p>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">E-posta</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-sm font-mono bg-background px-2 py-1 rounded">
                      {generatedPassword.email}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(generatedPassword.email)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Şifre</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-sm font-mono bg-background px-2 py-1 rounded">
                      {generatedPassword.password}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(generatedPassword.password)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {generatedPassword.employee_phone && (
                <Button
                  variant="outline"
                  onClick={handleSendSMS}
                  className="w-full"
                  disabled={generatedPassword.sms_sent}
                >
                  {generatedPassword.sms_sent ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      SMS Gönderildi
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Şifreyi SMS ile Gönder ({generatedPassword.employee_phone})
                    </>
                  )}
                </Button>
              )}

              <div className="text-sm text-muted-foreground">
                Bu bilgileri güvenli bir şekilde çalışana iletin. Şifre bir daha gösterilmeyecektir.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setPasswordDialogOpen(false)}>Tamam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Çalışan Bilgilerini Düzenle' : 'Yeni Çalışan Ekle'}
            </DialogTitle>
            <DialogDescription>
              Çalışan bilgilerini girin
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_code">Çalışan Kodu</Label>
                  <Input
                    id="employee_code"
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    placeholder="EMP0001"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Durum *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Pasif</SelectItem>
                      <SelectItem value="terminated">İşten Ayrıldı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Ad Soyad *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Ahmet Yılmaz"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ahmet@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+90 555 123 4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Pozisyon *</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Yazılım Geliştirici"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departman</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Teknoloji"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hire_date">İşe Başlama Tarihi</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="salary">Maaş</Label>
                  <Input
                    id="salary"
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Para Birimi</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">TRY (₺)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ek bilgiler ve notlar..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={createEmployee.isPending || updateEmployee.isPending}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={createEmployee.isPending || updateEmployee.isPending}
              >
                {createEmployee.isPending || updateEmployee.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
