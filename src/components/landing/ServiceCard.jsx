import { Check } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

export default function ServiceCard({ icon: Icon, title, description, features, price, priceLabel, badge, onCtaClick, ctaText = "Hemen Al" }) {
  return (
    <Card className="relative h-full flex flex-col border hover:border-primary hover:shadow-md transition-all">
      {badge && (
        <div className="absolute -top-2 right-4 z-10">
          <Badge className="bg-primary text-white px-2 py-0.5 text-xs font-semibold">{badge}</Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-4">
          {Icon && (
            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>
        <CardTitle className="text-xl mb-2">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm">{description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Price */}
        {price !== null && price !== undefined && (
          <div className="text-center py-4 border-y">
            <div className="text-3xl font-bold">{formatCurrency(price)}</div>
            {priceLabel && (
              <p className="text-sm text-muted-foreground mt-1">{priceLabel}</p>
            )}
          </div>
        )}

        {/* Features */}
        {features && features.length > 0 && (
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={onCtaClick}
          size="lg"
        >
          {ctaText}
        </Button>
      </CardFooter>
    </Card>
  )
}
