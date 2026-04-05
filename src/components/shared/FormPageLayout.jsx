import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import SEO from '@/components/SEO'

export function FormPageLayout({ title, description, onBack, children }) {
  const navigate = useNavigate()

  return (
    <div className="page-container max-w-4xl">
      <SEO title={title} noIndex />
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onBack || (() => navigate(-1))}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
      </div>
      <Card className="rounded-xl shadow-card">
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}
