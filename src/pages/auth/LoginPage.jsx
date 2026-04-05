import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { Github } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkMode, setMagicLinkMode] = useState(false)
  const [magicLinkEmail, setMagicLinkEmail] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleGitHubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
    if (error) toast.error('GitHub ile giriş başarısız', { description: error.message })
  }

  const handleMagicLink = async () => {
    if (!magicLinkEmail) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: magicLinkEmail,
      options: { emailRedirectTo: window.location.origin + '/dashboard' },
    })
    setLoading(false)
    if (error) {
      toast.error('Hata', { description: error.message })
    } else {
      toast.success('Bağlantı gönderildi', { description: 'E-posta kutunuzu kontrol edin' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await signIn(email, password)

    if (error) {
      console.error('Login error:', error)

      // Check if it's a database setup issue
      if (error.message && (error.message.includes('relation') || error.message.includes('does not exist'))) {
        setError('❌ Database henüz kurulmamış! Lütfen Supabase SQL Editor\'da supabase-schema.sql dosyasını çalıştırın.')
      } else if (error.message === 'Invalid login credentials') {
        setError('E-posta veya şifre hatalı')
      } else {
        setError(error.message || 'Giriş yapılırken bir hata oluştu')
      }
      setLoading(false)
    } else {
      // Login başarılı, yönlendir
      console.log('Login successful, redirecting...')
      // Auth state change otomatik yönlendirecek, ama yine de navigate edelim
      setTimeout(() => {
        window.location.href = '/admin/dashboard'
      }, 100)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Giriş Yap</CardTitle>
          <CardDescription className="text-center">
            Hesabınıza giriş yapmak için bilgilerinizi girin
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
            <div className="relative my-4 w-full">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">veya</span></div>
            </div>
            <Button variant="outline" className="w-full" type="button" onClick={handleGitHubLogin}>
              <Github className="h-4 w-4 mr-2" />
              GitHub ile Giriş Yap
            </Button>
            <Button variant="outline" className="w-full" type="button" onClick={() => setMagicLinkMode(!magicLinkMode)}>
              Şifresiz Giriş (Magic Link)
            </Button>
            {magicLinkMode && (
              <div className="space-y-2 mt-2 w-full">
                <Input value={magicLinkEmail} onChange={(e) => setMagicLinkEmail(e.target.value)} placeholder="E-posta adresiniz" type="email" />
                <Button className="w-full" type="button" onClick={handleMagicLink} disabled={loading}>
                  {loading ? 'Gönderiliyor...' : 'Giriş Bağlantısı Gönder'}
                </Button>
              </div>
            )}
            <p className="text-sm text-center text-muted-foreground">
              Hesabınız yok mu?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Kayıt Ol
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
