import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { SvgUri } from 'react-native-svg';
import { resolveAssetUrl } from '../../src/utils/assetUrl';

/**
 * Renders a category icon. The backend serves these as SVG (image/svg+xml),
 * which expo-image cannot draw — so we use react-native-svg's SvgUri. Falls back
 * to an Ionicon if there's no icon_url or the SVG fails to load.
 *
 * `color` tints SVGs that use `currentColor`; SVGs with hardcoded fills keep
 * their own colors (they still render — that's the bug fix).
 */
interface Props {
  iconUrl?: string | null;
  fallbackName: keyof typeof Ionicons.glyphMap;
  size: number;
  color: string;
}

export function CategoryIcon({ iconUrl, fallbackName, size, color }: Props) {
  const [failed, setFailed] = useState(false);
  const resolvedIconUrl = resolveAssetUrl(iconUrl);

  if (resolvedIconUrl && !failed) {
    return (
      <SvgUri
        uri={resolvedIconUrl}
        width={size}
        height={size}
        color={color}
        onError={() => setFailed(true)}
      />
    );
  }

  return <Ionicons name={fallbackName} size={size} color={color} style={{ textAlign: 'center', alignSelf: 'center' }} />;
}
