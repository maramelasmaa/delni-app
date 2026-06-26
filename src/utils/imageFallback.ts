const LOGO_PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=250&auto=format&fit=crop&q=80', // Abstract branding line art
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=250&auto=format&fit=crop&q=80', // 3D fluid shape
  'https://images.unsplash.com/photo-1618005198143-e528346d9a59?w=250&auto=format&fit=crop&q=80', // Minimalist curves
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=250&auto=format&fit=crop&q=80', // Gradient mesh
  'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=250&auto=format&fit=crop&q=80', // Pastel waves
  'https://images.unsplash.com/photo-1626785774625-ddc7c8241314?w=250&auto=format&fit=crop&q=80', // Branding shape
  'https://images.unsplash.com/photo-1618005198140-5b1285223dc8?w=250&auto=format&fit=crop&q=80', // Corporate shapes
  'https://images.unsplash.com/photo-1618005198130-fbf318ea1b09?w=250&auto=format&fit=crop&q=80', // Geometric emblem
];

const COVER_PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80', // Tech office 1
  'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=600&auto=format&fit=crop&q=80', // Desk workspace 1
  'https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=600&auto=format&fit=crop&q=80', // Design studio 1
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80', // Coding/development 1
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80', // Graphic design workspace
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80', // Creative agency
];

function getFallbackLogo(providerId: number): string {
  const index = Math.abs(providerId) % LOGO_PLACEHOLDERS.length;
  return LOGO_PLACEHOLDERS[index];
}

function getFallbackCover(providerId: number): string {
  const index = Math.abs(providerId) % COVER_PLACEHOLDERS.length;
  return COVER_PLACEHOLDERS[index];
}

export function getProviderLogo(logoUrl: string | null | undefined, providerId: number): string {
  if (!logoUrl || logoUrl.includes('placeholder') || logoUrl.includes('default') || logoUrl.trim() === '' || logoUrl.includes('localhost:8000')) {
    return getFallbackLogo(providerId);
  }
  return logoUrl;
}

export function getProviderCover(coverUrl: string | null | undefined, providerId: number): string {
  if (!coverUrl || coverUrl.includes('placeholder') || coverUrl.includes('default') || coverUrl.trim() === '' || coverUrl.includes('localhost:8000')) {
    return getFallbackCover(providerId);
  }
  return coverUrl;
}
