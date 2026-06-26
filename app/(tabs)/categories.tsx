import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useTheme } from '../../src/hooks/useTheme';
import { useCategories } from '../../src/hooks/useApi';
import { getCategoryIcon } from '../../src/utils/categoryStyle';
import type { ThemeColors } from '../../src/theme/tokens';
import type { Category } from '../../src/types';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const { data: categories, isLoading, isError, refetch } = useCategories();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = useMemo(
    () =>
      (categories ?? []).filter((c) =>
        search.trim() ? c.name.includes(search.trim()) : true,
      ),
    [categories, search],
  );

  const handlePress = useCallback((slug: string) => {
    router.push({
      pathname: '/category/[slug]',
      params: { slug },
    });
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView onRetry={refetch} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 }}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>التخصصات</Text>
          <Text style={{ fontSize: 28, fontFamily: 'Cairo-Black', color: colors.gold }}>.</Text>
        </View>
        <Text
          style={{
            textAlign: 'right',
            fontSize: 15,
            fontFamily: 'Cairo-SemiBold',
            color: colors.textMuted,
            marginTop: 4,
          }}
        >
          اختر تخصصاً للبحث عن مزود
        </Text>
      </View>

      {/* Search bar */}
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 14,
          marginBottom: 12,
          flexDirection: 'row-reverse',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderWidth: 1.5,
          borderColor: searchFocused ? colors.primary : colors.border,
          shadowColor: searchFocused ? colors.primary : colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: searchFocused ? 0.1 : 0.04,
          shadowRadius: 8,
          elevation: searchFocused ? 3 : 1,
        }}
      >
        <Ionicons name="search-outline" size={18} color={searchFocused ? colors.primary : colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="ابحث عن تخصص..."
          placeholderTextColor={colors.textMuted}
          textAlign="right"
          style={{
            flex: 1,
            textAlign: 'right',
            color: colors.textPrimary,
            fontFamily: 'Cairo-SemiBold',
            fontSize: 14,
            marginHorizontal: 10,
            writingDirection: 'rtl',
          }}
        />
        {search.length > 0 ? (
          <Pressable
            onPress={() => setSearch('')}
            hitSlop={10}
            style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.88 : 1 }] })}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={14} color={colors.textSecondary} />
            </View>
          </Pressable>
        ) : null}
      </View>

      {/* Standalone card list with spacing */}
      {filtered.length === 0 ? (
        <EmptyState icon="grid-outline" title="لا توجد تخصصات مطابقة" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(cat) => `cat-${cat.id}`}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<View style={{ height: 0 }} />}
          renderItem={({ item: cat }) => (
            <CategoryRow
              cat={cat}
              onPress={handlePress}
              colors={colors}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const CategoryRow = memo(function CategoryRow({
  cat,
  onPress,
  colors,
}: {
  cat: Category;
  onPress: (slug: string) => void;
  colors: ThemeColors;
}) {
  const handlePress = useCallback(() => onPress(cat.slug), [cat.slug, onPress]);
  const iconName = getCategoryIcon(cat.slug, cat.name);
  const palette = { bg: colors.goldSoft, border: colors.goldBorder, icon: colors.gold };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.98 : 1 }],
        opacity: pressed ? 0.95 : 1,
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          direction: 'ltr',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surface,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
          // Premium shadow
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        {/* Left side: Chevron */}
        <Ionicons name="chevron-back" size={16} color={colors.textMuted} />

        {/* Middle: Text (aligned to right for RTL text) */}
        <View style={{ flex: 1, marginRight: 16, marginLeft: 12, alignItems: 'flex-end' }}>
          <Text
            style={{
              textAlign: 'right',
              fontSize: 16,
              fontFamily: 'Cairo-Bold',
              color: colors.textPrimary,
            }}
            numberOfLines={1}
          >
            {cat.name}
          </Text>
        </View>

        {/* Right side: Colored icon box */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: palette.bg,
            borderWidth: 1,
            borderColor: palette.border,
            overflow: 'hidden',
          }}
        >
          <CategoryIcon iconUrl={cat.icon_url} fallbackName={iconName} size={24} color={palette.icon} />
        </View>
      </View>
    </Pressable>
  );
});
