import type { ReactNode } from 'react'

type PlaceholderProps = {
  eyebrow?: string
  title: string
  description: string
  children?: ReactNode
}

export default function Placeholder({ eyebrow, title, description, children }: PlaceholderProps) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      {eyebrow && (
        <span className="mb-3 inline-block rounded-full bg-[#C53735]/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-[#C53735]">
          {eyebrow}
        </span>
      )}
      <h1 className="text-3xl font-medium tracking-tight text-neutral-900 sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-500">{description}</p>
      {children && <div className="mt-8">{children}</div>}
    </section>
  )
}
