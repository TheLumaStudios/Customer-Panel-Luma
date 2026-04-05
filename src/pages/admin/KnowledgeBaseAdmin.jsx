import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useKBArticles,
  useAllKBCategories,
  useCreateKBArticle,
  useUpdateKBArticle,
  useDeleteKBArticle,
  useCreateKBCategory,
  useUpdateKBCategory,
  useDeleteKBCategory,
} from '@/hooks/useKnowledgeBase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from '@/lib/toast'
import { BookOpen, FolderOpen, Plus, Pencil, Trash2, Eye } from 'lucide-react'

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const articleSchema = z.object({
  title: z.string().min(1, 'Başlık zorunlu'),
  slug: z.string().min(1, 'Slug zorunlu'),
  category_id: z.string().optional(),
  content: z.string().min(1, 'İçerik zorunlu'),
  excerpt: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
})

const categorySchema = z.object({
  name: z.string().min(1, 'Kategori adı zorunlu'),
  slug: z.string().min(1, 'Slug zorunlu'),
  description: z.string().optional(),
  icon: z.string().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
})

export default function KnowledgeBaseAdmin() {
  const { data: articles, isLoading: articlesLoading } = useKBArticles()
  const { data: categories, isLoading: categoriesLoading } = useAllKBCategories()
  const createArticle = useCreateKBArticle()
  const updateArticle = useUpdateKBArticle()
  const deleteArticle = useDeleteKBArticle()
  const createCategory = useCreateKBCategory()
  const updateCategory = useUpdateKBCategory()
  const deleteCategory = useDeleteKBCategory()

  const [articleDialogOpen, setArticleDialogOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  const articleForm = useForm({
    resolver: zodResolver(articleSchema),
    defaultValues: { title: '', slug: '', category_id: '', content: '', excerpt: '', tags: '', status: 'draft' },
  })

  const categoryForm = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', slug: '', description: '', icon: '', is_active: true, sort_order: 0 },
  })

  // Article handlers
  const handleCreateArticle = () => {
    setEditingArticle(null)
    articleForm.reset({ title: '', slug: '', category_id: '', content: '', excerpt: '', tags: '', status: 'draft' })
    setArticleDialogOpen(true)
  }

  const handleEditArticle = (article) => {
    setEditingArticle(article)
    articleForm.reset({
      title: article.title || '',
      slug: article.slug || '',
      category_id: article.category_id || '',
      content: article.content || '',
      excerpt: article.excerpt || '',
      tags: Array.isArray(article.tags) ? article.tags.join(', ') : '',
      status: article.status || 'draft',
    })
    setArticleDialogOpen(true)
  }

  const onSubmitArticle = async (data) => {
    const payload = {
      title: data.title,
      slug: data.slug,
      category_id: data.category_id || null,
      content: data.content,
      excerpt: data.excerpt,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      status: data.status,
    }

    try {
      if (editingArticle) {
        await updateArticle.mutateAsync({ id: editingArticle.id, data: payload })
        toast.success('Makale güncellendi', { description: 'Değişiklikler başarıyla kaydedildi' })
      } else {
        await createArticle.mutateAsync(payload)
        toast.success('Makale oluşturuldu', { description: 'Yeni makale eklendi' })
      }
      setArticleDialogOpen(false)
    } catch (error) {
      toast.error('İşlem başarısız', { description: error.message })
    }
  }

  const handleDeleteArticle = async (id) => {
    if (confirm('Bu makaleyi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteArticle.mutateAsync(id)
        toast.success('Makale silindi', { description: 'Kayıt sistemden kaldırıldı' })
      } catch (error) {
        toast.error('Silme işlemi başarısız', { description: error.message })
      }
    }
  }

  // Category handlers
  const handleCreateCategory = () => {
    setEditingCategory(null)
    categoryForm.reset({ name: '', slug: '', description: '', icon: '', is_active: true, sort_order: 0 })
    setCategoryDialogOpen(true)
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    categoryForm.reset({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      icon: category.icon || '',
      is_active: category.is_active ?? true,
      sort_order: category.sort_order || 0,
    })
    setCategoryDialogOpen(true)
  }

  const onSubmitCategory = async (data) => {
    const payload = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      is_active: data.is_active,
      sort_order: data.sort_order || 0,
    }

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, data: payload })
        toast.success('Kategori güncellendi', { description: 'Değişiklikler başarıyla kaydedildi' })
      } else {
        await createCategory.mutateAsync(payload)
        toast.success('Kategori oluşturuldu', { description: 'Yeni kategori eklendi' })
      }
      setCategoryDialogOpen(false)
    } catch (error) {
      toast.error('İşlem başarısız', { description: error.message })
    }
  }

  const handleDeleteCategory = async (id) => {
    if (confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteCategory.mutateAsync(id)
        toast.success('Kategori silindi', { description: 'Kayıt sistemden kaldırıldı' })
      } catch (error) {
        toast.error('Silme işlemi başarısız', { description: error.message })
      }
    }
  }

  const isLoading = articlesLoading || categoriesLoading

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bilgi Bankası Yönetimi</h1>
          <p className="page-description">Makale ve kategorileri yönetin</p>
        </div>
      </div>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Makaleler
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Kategoriler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <Card className="rounded-xl shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5" />
                  Makaleler
                </CardTitle>
                <CardDescription>Toplam {articles?.length || 0} makale</CardDescription>
              </div>
              <Button onClick={handleCreateArticle} className="gap-2">
                <Plus className="h-4 w-4" />
                Yeni Makale
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-0">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-4 border-t first:border-t-0">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div key={j} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + Math.random() * 100}px` }} />
                      ))}
                    </div>
                  ))}
                </div>
              ) : articles?.length === 0 ? (
                <div className="empty-state">
                  <BookOpen className="empty-state-icon" />
                  <p className="empty-state-title">Henüz makale yok</p>
                  <p className="empty-state-description">Yeni bir makale oluşturun</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="pl-6">Başlık</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Görüntülenme</TableHead>
                      <TableHead className="text-right pr-6">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles?.map((article) => (
                      <TableRow key={article.id} className="group">
                        <TableCell className="pl-6 font-medium">{article.title}</TableCell>
                        <TableCell>
                          {article.category?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={article.status === 'published' ? 'active' : article.status === 'archived' ? 'inactive' : 'pending'} label={article.status === 'published' ? 'Yayında' : article.status === 'archived' ? 'Arşiv' : 'Taslak'} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            {article.views || 0}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditArticle(article)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteArticle(article.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>

        <TabsContent value="categories">
          <Card className="rounded-xl shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FolderOpen className="h-5 w-5" />
                  Kategoriler
                </CardTitle>
                <CardDescription>Toplam {categories?.length || 0} kategori</CardDescription>
              </div>
              <Button onClick={handleCreateCategory} className="gap-2">
                <Plus className="h-4 w-4" />
                Yeni Kategori
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-0">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-4 border-t first:border-t-0">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${50 + Math.random() * 80}px` }} />
                      ))}
                    </div>
                  ))}
                </div>
              ) : categories?.length === 0 ? (
                <div className="empty-state">
                  <FolderOpen className="empty-state-icon" />
                  <p className="empty-state-title">Henüz kategori yok</p>
                  <p className="empty-state-description">Yeni bir kategori oluşturun</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="pl-6">Ad</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right pr-6">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories?.map((category) => (
                      <TableRow key={category.id} className="group">
                        <TableCell className="pl-6 font-medium">{category.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{category.slug}</code>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={category.is_active ? 'active' : 'inactive'} />
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCategory(category)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteCategory(category.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>
      </Tabs>

      {/* Article Dialog */}
      <Dialog open={articleDialogOpen} onOpenChange={setArticleDialogOpen}>
        <DialogContent className="w-[750px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? 'Makaleyi Düzenle' : 'Yeni Makale'}
            </DialogTitle>
          </DialogHeader>
          <Form {...articleForm}>
            <form onSubmit={articleForm.handleSubmit(onSubmitArticle)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={articleForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Başlık</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Makale başlığı"
                          onChange={(e) => {
                            field.onChange(e)
                            if (!editingArticle) {
                              articleForm.setValue('slug', generateSlug(e.target.value))
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={articleForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl><Input {...field} placeholder="makale-slug" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={articleForm.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Kategori seçin" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={articleForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durum</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Taslak</SelectItem>
                          <SelectItem value="published">Yayında</SelectItem>
                          <SelectItem value="archived">Arşiv</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={articleForm.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Özet</FormLabel>
                    <FormControl><Input {...field} placeholder="Kısa özet" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={articleForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İçerik</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Makale içeriği (HTML destekler)" className="min-h-[200px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={articleForm.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etiketler (virgülle ayırın)</FormLabel>
                    <FormControl><Input {...field} placeholder="hosting, domain, dns" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setArticleDialogOpen(false)}>İptal</Button>
                <Button type="submit" disabled={articleForm.formState.isSubmitting}>
                  {articleForm.formState.isSubmitting ? 'Kaydediliyor...' : editingArticle ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="w-[550px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
            </DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Kategori adı"
                        onChange={(e) => {
                          field.onChange(e)
                          if (!editingCategory) {
                            categoryForm.setValue('slug', generateSlug(e.target.value))
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoryForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl><Input {...field} placeholder="kategori-slug" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl><Input {...field} placeholder="Kategori açıklaması" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoryForm.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sıralama</FormLabel>
                    <FormControl><Input {...field} type="number" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoryForm.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Aktif</FormLabel>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>İptal</Button>
                <Button type="submit" disabled={categoryForm.formState.isSubmitting}>
                  {categoryForm.formState.isSubmitting ? 'Kaydediliyor...' : editingCategory ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
