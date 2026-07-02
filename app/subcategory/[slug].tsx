import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorView } from '../../components/ui/ErrorView';
import { useTheme } from '../../src/hooks/useTheme';
import { useSubcategory } from '../../src/hooks/useApi';

export default function SubcategoryScreen() {
  const { colors } = useTheme();
  const { slug, categorySlug } = useLocalSearchParams<{ slug: string; categorySlug?: string }>();

  // Fetch only if categorySlug is not provided in params
  const { data, isLoading, isError, error, refetch } = useSubcategory(slug, 1, {
    enabled: !categorySlug,
  });

  useEffect(() => {
    if (categorySlug) {
      router.replace({
        pathname: `/category/${categorySlug}`,
        params: { subcategorySlug: slug },
      });
      return;
    }

    if (data?.subcategory?.category?.slug) {
      router.replace({
        pathname: `/category/${data.subcategory.category.slug}`,
        params: { subcategorySlug: slug },
      });
    }
  }, [categorySlug, slug, data]);

  if (isError && !categorySlug) {
    return <ErrorView error={error} onRetry={refetch} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <LoadingSpinner />
    </View>
  );
}
