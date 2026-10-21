import { profile } from '@/data/profile'
import { Separator } from '@/components/ui/separator'

export function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-4xl px-4 py-8">
      <h2 className="mb-4 text-2xl font-bold">Experience</h2>
      <ol className="space-y-6">
        {profile.experience.map((job, index) => (
          <li key={job.role}>
            <p className="text-sm text-muted-foreground">{job.period}</p>
            <h3 className="text-lg font-semibold">{job.role}</h3>
            <p className="font-medium text-primary">{job.organisation}</p>
            <p className="mt-1 text-muted-foreground">{job.summary}</p>
            {index < profile.experience.length - 1 ? (
              <Separator className="mt-6" />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  )
}
