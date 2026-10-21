import { profile } from '@/data/profile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Qualifications() {
  return (
    <section id="qualifications" className="mx-auto max-w-4xl px-4 py-8">
      <h2 className="mb-4 text-2xl font-bold">Qualifications</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {profile.qualifications.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle>{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
