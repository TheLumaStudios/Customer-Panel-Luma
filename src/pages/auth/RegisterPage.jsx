import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import PasswordStrength from '@/components/shared/PasswordStrength'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { Github } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    company_name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır')
      return
    }

    setLoading(true)

    const { data, error } = await signUp(formData.email, formData.password, {
      full_name: formData.full_name,
      phone: formData.phone,
      company_name: formData.company_name,
      role: 'customer',
    })

    if (error) {
      console.error('Signup error:', error)

      // Check if it's a database setup issue
      if (error.message && (error.message.includes('relation') || error.message.includes('does not exist'))) {
        setError('❌ Database henüz kurulmamış! Lütfen Supabase SQL Editor\'da supabase-schema.sql dosyasını çalıştırın.')
      } else {
        setError(error.message || 'Kayıt olurken bir hata oluştu')
      }
      setLoading(false)
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Kayıt Ol</CardTitle>
          <CardDescription className="text-center">
            Yeni bir hesap oluşturun
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
              <Label htmlFor="full_name">Ad Soyad</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Ad Soyad"
                value={formData.full_name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Şirket Adı</Label>
              <Input
                id="company_name"
                name="company_name"
                type="text"
                placeholder="Şirket Adı (Opsiyonel)"
                value={formData.company_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ornek@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="05XX XXX XX XX"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="En az 6 karakter"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <PasswordStrength password={formData.password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Şifrenizi tekrar girin"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </Button>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">veya</span></div>
            </div>
            <Button variant="outline" className="w-full" type="button" onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: { redirectTo: 'https://lumayazilim.com/dashboard' },
              })
              if (error) toast.error('GitHub ile kayıt başarısız', { description: error.message })
            }}>
              <Github className="h-4 w-4 mr-2" />
              GitHub ile Kayıt Ol
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Giriş Yap
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
