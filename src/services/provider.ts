import api from '../lib/api';
import { ENDPOINTS } from '../constants/api';
import type {
  ApiResponse,
  CredentialInput,
  PaginationMeta,
  PortfolioItem,
  Provider,
  ProviderCredential,
  ProviderProfileUpdateInput,
  Review,
} from '../types';

export interface LocalImage {
  uri: string;
  name: string;
  type: string;
  alt?: string;
}

function appendImage(form: FormData, field: string, image: LocalImage) {
  // React Native FormData accepts { uri, name, type } for file parts.
  form.append(field, {
    uri: image.uri,
    name: image.name,
    type: image.type,
  } as unknown as Blob);
}

export async function getMyProfile(): Promise<Provider> {
  const res = await api.get<ApiResponse<Provider>>(ENDPOINTS.provider.profile);
  return res.data.data;
}

export async function updateMyProfile(
  input: ProviderProfileUpdateInput,
  images?: { logo?: LocalImage; cover?: LocalImage },
): Promise<Provider> {
  const form = new FormData();

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => form.append(`${key}[]`, String(v)));
    } else if (typeof value === 'boolean') {
      form.append(key, value ? '1' : '0');
    } else {
      form.append(key, String(value));
    }
  });

  if (images?.logo) appendImage(form, 'logo', images.logo);
  if (images?.cover) appendImage(form, 'cover_image', images.cover);

  const res = await api.post<ApiResponse<Provider>>(ENDPOINTS.provider.profile, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return res.data.data;
}

export async function getMyReviews(page = 1) {
  const res = await api.get<ApiResponse<Review[]> & { pagination: PaginationMeta }>(
    ENDPOINTS.provider.reviews,
    { params: { page } },
  );
  return { reviews: res.data.data, pagination: res.data.pagination };
}

// --- Portfolio ---

export async function getMyPortfolio(): Promise<PortfolioItem[]> {
  const res = await api.get<ApiResponse<PortfolioItem[]>>(ENDPOINTS.provider.portfolio);
  return res.data.data;
}

export async function createPortfolioItem(input: {
  title: string;
  is_active?: boolean;
  images: LocalImage[];
}): Promise<PortfolioItem> {
  const form = new FormData();
  form.append('title', input.title);
  form.append('is_active', input.is_active === false ? '0' : '1');
  input.images.forEach((img) => {
    appendImage(form, 'images[]', img);
    form.append('alts[]', img.alt ?? '');
  });

  const res = await api.post<ApiResponse<PortfolioItem>>(ENDPOINTS.provider.portfolio, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return res.data.data;
}

export async function updatePortfolioItem(
  id: number,
  input: {
    title?: string;
    is_active?: boolean;
    newImages?: LocalImage[];
    removeImageIds?: number[];
    imageAlts?: Record<number, string>;
  },
): Promise<PortfolioItem> {
  const form = new FormData();
  if (input.title !== undefined) form.append('title', input.title);
  if (input.is_active !== undefined) form.append('is_active', input.is_active ? '1' : '0');
  (input.newImages ?? []).forEach((img) => {
    appendImage(form, 'images[]', img);
    form.append('alts[]', img.alt ?? '');
  });
  (input.removeImageIds ?? []).forEach((id) => form.append('remove_image_ids[]', String(id)));
  Object.entries(input.imageAlts ?? {}).forEach(([id, alt]) => {
    form.append(`image_alts[${id}]`, alt);
  });

  const res = await api.post<ApiResponse<PortfolioItem>>(
    ENDPOINTS.provider.portfolioItem(id),
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 },
  );
  return res.data.data;
}

export async function deletePortfolioItem(id: number): Promise<void> {
  await api.delete(ENDPOINTS.provider.portfolioItem(id));
}

// --- Credentials ---

export async function getMyCredentials(): Promise<ProviderCredential[]> {
  const res = await api.get<ApiResponse<ProviderCredential[]>>(ENDPOINTS.provider.credentials);
  return res.data.data;
}

export async function createCredential(input: CredentialInput): Promise<ProviderCredential> {
  const res = await api.post<ApiResponse<ProviderCredential>>(
    ENDPOINTS.provider.credentials,
    input,
  );
  return res.data.data;
}

export async function updateCredential(
  id: number,
  input: Partial<CredentialInput>,
): Promise<ProviderCredential> {
  const res = await api.patch<ApiResponse<ProviderCredential>>(
    ENDPOINTS.provider.credential(id),
    input,
  );
  return res.data.data;
}

export async function deleteCredential(id: number): Promise<void> {
  await api.delete(ENDPOINTS.provider.credential(id));
}
