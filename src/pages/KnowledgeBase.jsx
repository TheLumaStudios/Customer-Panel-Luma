import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKBCategories, useKBArticles } from '@/hooks/useKnowledgeBase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, BookOpen, FolderOpen, ChevronRight } from 'lucide-react'

export default function KnowledgeBase() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)

  const { data: categories, isLoading: categoriesLoading } = useKBCategories()
  const { data: articles, isLoading: articlesLoading } = useKBArticles({
    status: 'published',
    category_id: selectedCategory,
    search: search || undefined,
  })

  const isLoading = categoriesLoading || articlesLoading

  if (isLoading && !articles) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Bilgi Bankası</h1>
        <p className="text-muted-foreground">
          Sık sorulan sorular ve yardım makaleleri
        </p>
        <div className="max-w-lg mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Makale ara..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedCategory(null)
            }}
          />
        </div>
      </div>

      {/* Category Cards */}
      {!search && !selectedCategory && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories?.map((category) => (
            <Card
              key={category.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedCategory(category.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    {category.description && (
                      <CardDescription>{category.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Category Header */}
      {selectedCategory && !search && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Tüm Kategoriler
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {categories?.find((c) => c.id === selectedCategory)?.name}
          </span>
        </div>
      )}

      {/* Articles List */}
      {(selectedCategory || search) && (
        <div className="space-y-3">
          {articles?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {search ? 'Aramanızla eşleşen makale bulunamadı.' : 'Bu kategoride henüz makale bulunmuyor.'}
              </CardContent>
            </Card>
          ) : (
            articles?.map((article) => (
              <Card
                key={article.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/knowledge-base/${article.slug}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <h3 className="font-medium">{article.title}</h3>
                        {article.excerpt && (
                          <p className="text-sm text-muted-foreground mt-1">{article.excerpt}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {article.category?.name && (
                            <Badge variant="outline">{article.category.name}</Badge>
                          )}
                          {article.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Show all articles if no category selected and no search */}
      {!selectedCategory && !search && articles?.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Son Eklenen Makaleler</h2>
          <div className="space-y-3">
            {articles?.slice(0, 5).map((article) => (
              <Card
                key={article.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/knowledge-base/${article.slug}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{article.title}</h3>
                        {article.category?.name && (
                          <Badge variant="outline" className="mt-1">{article.category.name}</Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
