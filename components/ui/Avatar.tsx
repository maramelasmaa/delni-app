import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';

/**
 * Provider avatar. Shows the REAL uploaded logo (`logo_url` from the Filament
 * `logo` field) and falls back to clean initials — never a random stock photo —
 * when the provider has no logo or the image fails to load (e.g. unreachable host).
 */

// On-brand tints that read on both light and dark (rgba so they adapt).
const TINTS = [
  { bg: 'rgba(30,64,175,0.14)', fg: '#3B82F6' },
  { bg: 'rgba(225,173,1,0.18)', fg: '#CA8A04' },
  { bg: 'rgba(16,185,129,0.14)', fg: '#0EA371' },
  { bg: 'rgba(139,92,246,0.16)', fg: '#8B5CF6' },
  { bg: 'rgba(236,72,153,0.14)', fg: '#DB2777' },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[1][0];
}

function isRealLogo(url?: string | null): boolean {
  if (!url) return false;
  const u = url.trim();
  if (!u) return false;
  // Backend placeholder conventions — treat as "no logo".
  return !u.includes('placeholder') && !u.includes('default');
}

interface Props {
  logoUrl?: string | null;
  name: string;
  id: number;
  size: number;
  /** Corner radius. Defaults to ~28% of size; pass size/2 for a circle. */
  radius?: number;
  recyclingKey?: string;
}

export function Avatar({ logoUrl, name, id, size, radius, recyclingKey }: Props) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);

  // Reset error state when the row recycles to a different provider.
  useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  const r = radius ?? Math.round(size * 0.28);
  const showImage = isRealLogo(logoUrl) && !failed;

  if (showImage) {
    return (
      <Image
        source={{ uri: logoUrl as string }}
        style={{ width: size, height: size, borderRadius: r, backgroundColor: colors.surfaceAlt }}
        contentFit="cover"
        transition={150}
        onError={() => setFailed(true)}
        recyclingKey={recyclingKey}
      />
    );
  }

  const tint = TINTS[Math.abs(id) % TINTS.length];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        backgroundColor: tint.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: Math.round(size * 0.38), fontFamily: 'Cairo-Black', color: tint.fg }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
