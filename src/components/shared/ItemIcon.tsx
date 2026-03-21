import { getItemIconUrl } from '../../lib/dataLoader'

interface Props {
  iconName: string
  name?: string
  size?: number
}

export function ItemIcon({ iconName, name = '', size = 32 }: Props) {
  const src = getItemIconUrl(iconName)

  if (!src) {
    return (
      <div
        className="rounded flex items-center justify-center text-ink-muted/40 text-xs flex-shrink-0 border border-white/[0.08]"
        style={{ width: size, height: size, background: 'rgba(0,0,0,0.3)', fontSize: size < 24 ? 9 : 11 }}
      >
        ?
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className="rounded flex-shrink-0"
      style={{ imageRendering: 'pixelated' }}
      onError={(e) => {
        const el = e.currentTarget
        el.style.display = 'none'
      }}
    />
  )
}
