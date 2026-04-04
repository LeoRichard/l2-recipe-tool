interface Props {
  size?: number
  className?: string
}

export function AdenaIcon({ size = 14, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Coin base */}
      <circle cx="8" cy="8" r="7.5" fill="#c8890e" />
      <circle cx="8" cy="8" r="7" fill="#e6a817" />
      {/* Inner ring */}
      <circle cx="8" cy="8" r="5" fill="none" stroke="#c07a0c" strokeWidth="0.75" />
      {/* Shine arc */}
      <path d="M5.2 5.5 Q7 3.8 9 5" stroke="rgba(255,240,160,0.55)" strokeWidth="1" strokeLinecap="round" fill="none" />
      {/* Small center dot */}
      <circle cx="8" cy="8" r="1" fill="#c07a0c" />
    </svg>
  )
}
