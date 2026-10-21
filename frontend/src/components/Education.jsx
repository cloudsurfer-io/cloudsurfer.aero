import { profile } from '@/data/profile'

export function Education() {
  return (
    <section id="education" className="mx-auto max-w-4xl px-4 py-8">
      <h2 className="mb-4 text-2xl font-bold">Education and training</h2>
      <ul className="space-y-4">
        {profile.education.map((item) => (
          <li key={item.name}>
            <p className="font-semibold">{item.name}</p>
            <p className="text-muted-foreground">
              {item.place} · {item.period}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
