import { profile } from '@/data/profile'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section id="about" className="mx-auto grid max-w-4xl gap-8 px-4 py-12 md:grid-cols-[180px_1fr] md:items-center">
      <img
        src={`${import.meta.env.BASE_URL}${profile.photo}`}
        alt=""
        width="180"
        height="180"
        className="h-44 w-44 rounded-full border bg-secondary object-cover"
      />
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          {profile.title}
        </p>
        <h1 className="text-4xl font-bold tracking-tight">{profile.name}</h1>
        <p className="text-lg text-muted-foreground">{profile.summary}</p>
        <p className="text-sm text-muted-foreground">{profile.location}</p>
        <Button asChild>
          <a href="#contact">Get in touch</a>
        </Button>
      </div>
    </section>
  )
}
