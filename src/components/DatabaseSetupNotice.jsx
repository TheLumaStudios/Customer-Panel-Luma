import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DatabaseSetupNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Database Kurulumu Gerekli</CardTitle>
          <CardDescription>
            Uygulamayı kullanmadan önce Supabase database şemasını çalıştırmanız gerekiyor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-secondary p-4 rounded-md">
            <h3 className="font-semibold mb-2">Adım 1: Supabase SQL Editor'a Gidin</h3>
            <a
              href="https://supabase.com/dashboard/project/pbgajlkaulxrspyptzzs/sql"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              https://supabase.com/dashboard/project/pbgajlkaulxrspyptzzs/sql
            </a>
          </div>

          <div className="bg-secondary p-4 rounded-md">
            <h3 className="font-semibold mb-2">Adım 2: SQL Dosyasını Çalıştırın</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>SQL Editor'da "New query" butonuna tıklayın</li>
              <li>Proje klasöründeki <code className="bg-background px-1 py-0.5 rounded">supabase-schema.sql</code> dosyasını açın</li>
              <li>Tüm içeriği kopyalayıp SQL Editor'a yapıştırın</li>
              <li>"Run" butonuna tıklayın</li>
            </ol>
          </div>

          <div className="bg-secondary p-4 rounded-md">
            <h3 className="font-semibold mb-2">Adım 3: Sayfayı Yenileyin</h3>
            <p className="text-sm text-muted-foreground">
              SQL şeması çalıştırıldıktan sonra bu sayfayı yenileyin ve kayıt olabilirsiniz.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-4 py-2">
            <p className="text-sm font-medium">Dosya Konumu:</p>
            <code className="text-xs text-muted-foreground">
              /Users/epoyraz/Documents/Projeler/customer-panel/supabase-schema.sql
            </code>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Sayfayı Yenile
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
