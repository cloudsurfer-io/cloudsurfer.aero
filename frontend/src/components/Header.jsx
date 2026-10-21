import { profile } from '@/data/profile'
import { Button } from '@/components/ui/button'

const links = [
  { href: '#about', label: 'About' },
  { href: '#qualifications', label: 'Qualifications' },
  { href: '#experience', label: 'Experience' },
  { href: '#education', label: 'Education' },
  { href: '#contact', label: 'Contact' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <a href="#about" className="font-semibold tracking-tight">
          {profile.name}
        </a>
        <nav className="hidden gap-1 sm:flex">
          {links.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <a href={link.href}>{link.label}</a>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  )
}
