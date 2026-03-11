import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { Users, FileText, CheckSquare, TrendingUp } from 'lucide-react'

export default function EmployeeDashboard() {
  const { profile } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hoş Geldiniz, {profile?.full_name}</h1>
        <p className="text-muted-foreground mt-1">
          Çalışan Paneli
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Müşteriler</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Müşteri listesi ve detaylar</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturalar</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Fatura işlemleri</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onay Taleplerim</CardTitle>
            <CheckSquare className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Bekleyen onaylarım</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Raporlar</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">İstatistikler ve raporlar</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Çalışan Yetkileri</CardTitle>
          <CardDescription>
            Erişim ve yetki bilgileri
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Yapabilecekleriniz:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Müşteri bilgilerini görüntüleme</li>
              <li>Fatura oluşturma ve düzenleme</li>
              <li>Ödeme alma işlemleri</li>
              <li>Hosting ve domain yönetimi</li>
              <li>Destek talepleri</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-yellow-600">Onay Gerektiren İşlemler:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>İade işlemleri</li>
              <li>Kredi ekleme/düşürme</li>
              <li>Fatura iptali</li>
              <li>Ödeme iptali</li>
              <li>İndirim uygulama</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Bu işlemler için admin onayı gereklidir. Talep oluşturduğunuzda admin inceleyecektir.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
