import { profile } from '@/data/profile'
import { Button } from '@/components/ui/button'

export function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-4xl px-4 py-12">
      <h2 className="mb-4 text-2xl font-bold">Contact</h2>
      <p className="text-muted-foreground">
        {profile.contact.email} · {profile.contact.phone}
      </p>
      <div className="mt-4 flex gap-2">
        {profile.contact.links.map((link) => (
          <Button key={link.href}>
            <a href={link.href}>{link.label}</a>
          </Button>
        ))}
      </div>
    </section>
  )
}
