import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PricingComparison() {
  const features = [
    {
      category: 'PERFORMANCE',
      items: [
        { name: 'CPU Cores', starter: '1 Core', professional: '4 Cores', enterprise: '12 Cores' },
        { name: 'RAM', starter: '2 GB', professional: '8 GB', enterprise: '32 GB' },
        { name: 'Storage Type', starter: 'NVMe SSD', professional: 'NVMe SSD', enterprise: 'NVMe SSD' },
        { name: 'Global CDN', starter: false, professional: true, enterprise: true },
      ],
    },
    {
      category: 'SECURITY',
      items: [
        { name: 'DDoS Protection', starter: true, professional: true, enterprise: true },
        { name: 'Automatic Backups', starter: 'Weekly', professional: 'Daily', enterprise: 'Hourly' },
        { name: 'Dedicated IP', starter: false, professional: false, enterprise: true },
        { name: 'Web App Firewall', starter: false, professional: true, enterprise: true },
      ],
    },
    {
      category: 'SUPPORT',
      items: [
        { name: 'Knowledge Base', starter: true, professional: true, enterprise: true },
        { name: 'Ticket Support', starter: '24h Response', professional: '4h Response', enterprise: 'Within Response' },
        { name: 'Live Chat', starter: false, professional: true, enterprise: true },
        { name: 'Phone Support', starter: false, professional: false, enterprise: true },
      ],
    },
  ]

  const renderCell = (value) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-primary mx-auto" />
      ) : (
        <span className="text-muted-foreground text-center">-</span>
      )
    }
    return <span className="text-sm text-center">{value}</span>
  }

  return (
    <section className="py-24 bg-muted">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Compare Features</h2>
          <p className="text-muted-foreground">
            Get into the technical details and see exactly what each plan offers for your development needs.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 p-6 border-b border-border bg-muted/50">
            <div className="font-semibold">Features & Resources</div>
            <div className="text-center font-semibold">Starter</div>
            <div className="text-center font-semibold text-primary">Professional</div>
            <div className="text-center font-semibold">Enterprise</div>
          </div>

          {/* Table Body */}
          {features.map((category, catIndex) => (
            <div key={catIndex}>
              <div className="px-6 py-3 bg-muted/30 font-semibold text-sm text-muted-foreground">
                {category.category}
              </div>
              {category.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className={cn(
                    'grid grid-cols-4 gap-4 p-6 items-center',
                    itemIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                  )}
                >
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="flex justify-center">{renderCell(item.starter)}</div>
                  <div className="flex justify-center bg-primary/5 -my-6 py-6">
                    {renderCell(item.professional)}
                  </div>
                  <div className="flex justify-center">{renderCell(item.enterprise)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Looking for custom infrastructure?{' '}
            <a href="#footer" className="text-primary hover:underline font-medium">
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
