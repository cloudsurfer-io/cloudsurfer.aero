import { Contact } from '@/components/Contact'
import { Education } from '@/components/Education'
import { Experience } from '@/components/Experience'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { Qualifications } from '@/components/Qualifications'

function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Qualifications />
        <Experience />
        <Education />
        <Contact />
      </main>
    </>
  )
}

export default App
