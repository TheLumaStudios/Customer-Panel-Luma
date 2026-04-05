import Avatar from 'boring-avatars'

const PALETTE = ['#4F46E5', '#7C3AED', '#2563EB', '#0891B2', '#059669']

export function UserAvatar({ name, size = 32, variant = 'beam', className = '' }) {
  return (
    <div className={`flex-shrink-0 ${className}`}>
      <Avatar
        size={size}
        name={name || 'User'}
        variant={variant}
        colors={PALETTE}
      />
    </div>
  )
}
