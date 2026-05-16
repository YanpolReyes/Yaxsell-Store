'use client';

import { getLevelMeta } from '@/lib/loyalty-levels';

interface Props {
  avatarUrl: string | null;
  userName?: string;
  size?: number;
  className?: string;
  loyaltyLevelId?: string | null;
}

export default function NavAvatarWithBadge({
  avatarUrl,
  userName,
  size = 36,
  className = '',
  loyaltyLevelId,
}: Props) {
  const level = loyaltyLevelId ? getLevelMeta(loyaltyLevelId) : null;
  const badgeSize = Math.round(size * 0.48);
  const initial = userName?.charAt(0).toUpperCase() || 'U';

  return (
    <div
      className={className}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block',
            border: '2px solid rgba(255,255,255,0.9)',
            boxShadow: '0 2px 8px rgba(236,72,153,0.25)',
          }}
        />
      ) : (
        <span
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #ec4899, #f9a8d4)',
            color: '#fff',
            fontSize: Math.round(size * 0.38),
            fontWeight: 800,
            border: '2px solid rgba(255,255,255,0.9)',
            boxShadow: '0 2px 8px rgba(236,72,153,0.25)',
          }}
        >
          {initial}
        </span>
      )}
      {level?.badge && (
        <img
          src={level.badge}
          alt={level.name}
          title={`Nivel ${level.name}`}
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: badgeSize,
            height: badgeSize,
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
