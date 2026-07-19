import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import * as providerService from '../services/provider';
import type { CredentialInput, ProviderProfileUpdateInput } from '../types';
import type { LocalImage } from '../services/provider';

function useIsProvider() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  return isAuthenticated && !!user?.is_provider;
}

export function useMyProviderProfile() {
  const enabled = useIsProvider();
  return useQuery({
    queryKey: ['provider-profile'],
    queryFn: providerService.getMyProfile,
    enabled,
    retry: false,
  });
}

export function useUpdateProviderProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      images,
    }: {
      input: ProviderProfileUpdateInput;
      images?: { logo?: LocalImage; cover?: LocalImage };
    }) => providerService.updateMyProfile(input, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
      queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] });
    },
  });
}

export function useMyReviews(status?: string) {
  const enabled = useIsProvider();
  return useQuery({
    queryKey: ['provider-reviews', status ?? 'all'],
    queryFn: () => providerService.getMyReviews(1, status),
    enabled,
    retry: false,
  });
}

export function useMyPortfolio() {
  const enabled = useIsProvider();
  return useQuery({
    queryKey: ['provider-portfolio'],
    queryFn: providerService.getMyPortfolio,
    enabled,
    retry: false,
  });
}

export function usePortfolioMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['provider-portfolio'] });
    queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] });
  };

  const create = useMutation({
    mutationFn: providerService.createPortfolioItem,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...input }: {
      id: number;
      title?: string;
      is_active?: boolean;
      newImages?: LocalImage[];
      removeImageIds?: number[];
      imageAlts?: Record<number, string>;
    }) =>
      providerService.updatePortfolioItem(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: providerService.deletePortfolioItem,
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

export function useMyCredentials() {
  const enabled = useIsProvider();
  return useQuery({
    queryKey: ['provider-credentials'],
    queryFn: providerService.getMyCredentials,
    enabled,
    retry: false,
  });
}

export function useCredentialMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['provider-credentials'] });
    queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] });
  };

  const create = useMutation({
    mutationFn: (input: CredentialInput) => providerService.createCredential(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Partial<CredentialInput>) =>
      providerService.updateCredential(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: providerService.deleteCredential,
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
