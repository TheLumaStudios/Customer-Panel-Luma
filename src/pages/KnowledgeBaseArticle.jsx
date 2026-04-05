import { useParams, useNavigate, Link } from 'react-router-dom'
import { useKBArticle } from '@/hooks/useKnowledgeBase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Eye, Clock, ChevronRight, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import SEO from '@/components/SEO'

export default function KnowledgeBaseArticle() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data: article, isLoading } = useKBArticle(slug)

  if (isLoading) {
    return (
      <div className="page-container max-w-4xl mx-auto">
        <div className="h-4 w-48 bg-muted rounded animate-pulse mb-6" />
        <div className="space-y-4">
          <div className="h-8 w-96 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          <div className="h-px bg-border my-6" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="page-container max-w-4xl mx-auto text-center py-20">
        <BookOpen className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Makale bulunamadı</h2>
        <Button variant="outline" onClick={() => navigate('/knowledge-base')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Bilgi Bankasına Dön
        </Button>
      </div>
    )
  }

  const formattedDate = (() => {
    try { return format(new Date(article.created_at), 'd MMMM yyyy', { locale: tr }) }
    catch { return '' }
  })()

  return (
    <div className="page-container max-w-4xl mx-auto">
      <SEO title={article.title} description={article.excerpt} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-6">
        <Link to="/knowledge-base" className="text-muted-foreground hover:text-foreground transition-colors">
          Bilgi Bankası
        </Link>
        {article.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <Link to="/knowledge-base" className="text-muted-foreground hover:text-foreground transition-colors">
              {article.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
        <span className="text-foreground font-medium truncate">{article.title}</span>
      </nav>

      {/* Back */}
      <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1.5" onClick={() => navigate('/knowledge-base')}>
        <ArrowLeft className="h-4 w-4" /> Geri Dön
      </Button>

      {/* Article */}
      <Card className="rounded-xl shadow-card overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b bg-muted/20">
          <h1 className="text-2xl font-bold tracking-tight mb-3">{article.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formattedDate}
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {article.views || 0} görüntülenme
            </div>
          </div>
          {article.tags?.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="px-8 py-8">
          <div
            className="kb-article-content"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
