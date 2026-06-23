type AdminPlaceholderProps = {
  title: string
  description: string
}

export default function AdminPlaceholder({ title, description }: AdminPlaceholderProps) {
  return (
    <div className="px-8 py-8">
      <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-500">{description}</p>
    </div>
  )
}
