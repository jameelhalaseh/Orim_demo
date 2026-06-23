import type { Channel } from '../../types'

export default function ChannelBadge({ channel }: { channel: Channel }) {
  const online = channel === 'online'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        online
          ? 'bg-sky-50 text-sky-700 ring-sky-600/20'
          : 'bg-violet-50 text-violet-700 ring-violet-600/20'
      }`}
    >
      {online ? 'Online' : 'Bazaar'}
    </span>
  )
}
