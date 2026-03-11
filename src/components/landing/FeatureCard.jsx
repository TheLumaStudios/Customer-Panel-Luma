export default function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:border-primary hover:shadow-md transition-all">
      {Icon && (
        <div className="mb-4 h-12 w-12 flex items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      )}
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
