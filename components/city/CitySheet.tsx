import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { memo, useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useCities } from '../../src/hooks/useApi';
import { useTheme } from '../../src/hooks/useTheme';
import type { ThemeColors } from '../../src/theme/tokens';
import type { ActiveCity } from '../../src/store/city';
import { useCityStore } from '../../src/store/city';

interface Props {
  visible: boolean;
  onClose: () => void;
}



// Coordinates for major Libyan cities to calculate nearest city mathematically
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  tripoli: { lat: 32.8872, lng: 13.1913 },
  benghazi: { lat: 32.1167, lng: 20.0667 },
  misrata: { lat: 32.3754, lng: 15.0925 },
  zawiya: { lat: 32.7522, lng: 12.7278 },
  khoms: { lat: 32.6486, lng: 14.2619 },
  tobruk: { lat: 32.0833, lng: 23.95 },
  sabha: { lat: 27.0378, lng: 14.4281 },
  zliten: { lat: 32.4674, lng: 14.5687 },
  gharyan: { lat: 32.1681, lng: 13.0203 },
  bayda: { lat: 32.7628, lng: 21.755 },
  tarhuna: { lat: 32.4350, lng: 13.6332 },
  sirte: { lat: 31.2089, lng: 16.5886 },
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Ignore common Arabic variations where possible
function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ء/g, '') // ignore hamza so 'البيضاء' matches 'البيضا'
    .replace(/[\u064B-\u0652]/g, ''); // remove diacritics
}

// -------------------------------------------------------------
// MEMOIZED SKELETON ROW
// -------------------------------------------------------------
const SkeletonRow = memo(({ colors }: { colors: ThemeColors }) => {
  return (
    <View style={[styles.cityRowContainer, { borderColor: colors.border, backgroundColor: colors.surfaceAlt, opacity: 0.6, marginBottom: 12 }]}>
      <View style={{ alignItems: 'flex-end', flex: 1 }}>
        <View style={{ width: 120, height: 16, borderRadius: 4, backgroundColor: colors.border, marginBottom: 8 }} />
        <View style={{ width: 80, height: 12, borderRadius: 4, backgroundColor: colors.border }} />
      </View>
    </View>
  );
});

// -------------------------------------------------------------
// MEMOIZED ANIMATED CITY ROW
// -------------------------------------------------------------
interface CityRowProps {
  city: any;
  isSelected: boolean;
  onPress: (city: any) => void;
  colors: ThemeColors;
}

const CityRow = memo(({ city, isSelected, onPress, colors }: CityRowProps) => {
  const activeVal = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    activeVal.value = withTiming(isSelected ? 1 : 0, { duration: 180 });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = 1 + activeVal.value * 0.01;
    const borderColor = interpolateColor(
      activeVal.value,
      [0, 1],
      [colors.border, colors.primary]
    );
    const backgroundColor = interpolateColor(
      activeVal.value,
      [0, 1],
      [colors.surface, colors.primarySoft]
    );

    return {
      borderColor,
      backgroundColor,
      transform: [{ scale }],
    };
  });

  const checkmarkStyle = useAnimatedStyle(() => {
    return {
      opacity: activeVal.value,
      transform: [{ scale: activeVal.value }],
    };
  });



  return (
    <Pressable
      onPress={() => onPress(city)}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${city.name}`}
      style={{ width: '100%', marginBottom: 12 }}
    >
      <Animated.View style={[styles.cityRowContainer, animatedStyle]}>
        {/* Right: name */}
        <View style={{ alignItems: 'flex-end', flex: 1, justifyContent: 'center' }}>
          <Text style={[styles.cityName, { color: colors.textPrimary }]}>{city.name}</Text>
        </View>

        {/* Left: selection indicator checkmark */}
        <Animated.View style={[checkmarkStyle, { paddingLeft: 8 }]}>
          <Ionicons name="checkmark-sharp" size={20} color={colors.primary} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
});

// -------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------
export function CitySheet({ visible, onClose }: Props) {
  const { colors, isDark } = useTheme();
  const { data: cities, isLoading } = useCities();
  const activeCity = useCityStore((s) => s.activeCity);
  const setCity = useCityStore((s) => s.setCity);
  const [detecting, setDetecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{ text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }>;
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showRTLAlert = useCallback((
    title: string,
    message: string,
    buttons: Array<{ text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }>
  ) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      buttons,
    });
  }, []);

  // Debounce search query to keep list changes smooth and snappy
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSelect = useCallback(
    (city: ActiveCity | null) => {
      setCity(city);
      setSearchQuery('');
      onClose();
    },
    [setCity, onClose]
  );

  const handleDetectLocation = useCallback(async () => {
    if (detecting) return;
    setDetecting(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showRTLAlert('تنبيه', 'يرجى السماح بالوصول إلى الموقع لتحديد مدينتك تلقائياً.', [{ text: 'حسناً', style: 'default' }]);
        setDetecting(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      let matched: any = null;

      // 1. Text geocoding match
      try {
        const address = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (address && address.length > 0 && cities) {
          const geo = address[0];
          const fields = [
            geo.city,
            geo.district,
            geo.region,
            geo.subregion,
            geo.name,
          ]
            .filter(Boolean)
            .map((s) => s!.toLowerCase().trim());

          matched = cities.find((c) => {
            const slug = c.slug.toLowerCase().trim();
            const name = c.name.toLowerCase().trim();
            return fields.some(
              (f) =>
                f === slug ||
                f === name ||
                f.includes(slug) ||
                f.includes(name) ||
                slug.includes(f) ||
                name.includes(f)
            );
          });
        }
      } catch (err) {
        console.warn('Reverse geocoding failed, using distance fallback:', err);
      }

      // 2. Coordinate distance match fallback
      if (!matched && cities && cities.length > 0) {
        let minDistance = Infinity;
        for (const city of cities) {
          const coords = CITY_COORDINATES[city.slug.toLowerCase().trim()];
          if (coords) {
            const dist = getDistance(latitude, longitude, coords.lat, coords.lng);
            if (dist < minDistance) {
              minDistance = dist;
              matched = city;
            }
          }
        }
      }

      if (matched) {
        handleSelect({ id: matched.id, slug: matched.slug, name: matched.name });
      } else {
        showRTLAlert('تنبيه', 'لم نتمكن من تحديد مدينتك تلقائياً أو مدينتك غير مدعومة حالياً.', [{ text: 'حسناً', style: 'default' }]);
      }
    } catch (error) {
      console.error(error);
      showRTLAlert('خطأ', 'حدث خطأ أثناء تحديد موقعك. يرجى المحاولة مرة أخرى.', [{ text: 'حسناً', style: 'default' }]);
    } finally {
      setDetecting(false);
    }
  }, [cities, detecting, handleSelect, showRTLAlert]);

  // Clean, normalized local search filtering
  const filteredCities = useMemo(() => {
    const normalizedQuery = normalizeArabic(debouncedSearchQuery);
    return (cities ?? [])
      .filter(
        (c) =>
          c.name &&
          c.name.toLowerCase().trim() !== '98uytgftyg' &&
          c.slug &&
          c.slug.toLowerCase().trim() !== '98uytgftyg'
      )
      .filter((c) => {
        if (!normalizedQuery) return true;
        return (
          normalizeArabic(c.name).includes(normalizedQuery) ||
          normalizeArabic(c.slug).includes(normalizedQuery)
        );
      });
  }, [cities, debouncedSearchQuery]);

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleSelectCity = useCallback(
    (city: any) => {
      handleSelect({ id: city.id, slug: city.slug, name: city.name });
    },
    [handleSelect]
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
        {/* 1. HEADER (Title stays right, Close button stays left) */}
        <View style={[styles.header, { flexDirection: 'row-reverse' }]}>
          <View style={{ alignItems: 'flex-end', flex: 1, paddingLeft: 12 }}>
            <View style={styles.headerTitleRow}>
              <Text style={[styles.headerDot, { color: colors.primary }]}>.</Text>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>اختر المدينة</Text>
            </View>
            <Text style={{ fontFamily: 'Cairo-Regular', fontSize: 13, color: colors.textSecondary, marginTop: 2, textAlign: 'right' }}>
              اختر المدينة التي ترغب في تصفح مقدمي الخدمات منها.
            </Text>
          </View>
          <Pressable
            onPress={handleClose}
            style={[styles.closeButton, { backgroundColor: colors.surfaceAlt }]}
            hitSlop={12}
            accessibilityLabel="إغلاق"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* 2. FLATLIST FOR VIRTUALIZED SCROLLING & SKELETON SUPPORT */}
        <FlatList
          data={isLoading ? [] : filteredCities}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isActive = activeCity?.slug === item.slug;
            return (
              <CityRow
                city={item}
                isSelected={isActive}
                onPress={handleSelectCity}
                colors={colors}
              />
            );
          }}
          ListHeaderComponent={
            <View style={{ width: '100%' }}>
              {/* Search input container */}
              <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row-reverse' }]}>
                <Ionicons name="search-outline" size={20} color={colors.textMuted} style={{ marginLeft: 8 }} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textPrimary, textAlign: 'right' }]}
                  placeholder="ابحث عن مدينتك..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                  accessibilityLabel="ابحث عن مدينتك"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }} accessibilityLabel="مسح البحث">
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* GPS Premium Location Card */}
              <View style={{ width: '100%' }}>
                <Pressable
                  disabled={detecting}
                  onPress={handleDetectLocation}
                  style={({ pressed }) => [
                    styles.locationCard,
                    {
                      backgroundColor: colors.primarySoft,
                      borderColor: colors.primary,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="تحديد الموقع الحالي"
                >
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View style={[styles.locationIconBadge, { backgroundColor: colors.primary }]}>
                      {detecting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="location" size={20} color="#FFFFFF" />
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end', flex: 1, paddingLeft: 24 }}>
                      <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 15, color: colors.primary, textAlign: 'right' }}>
                        {detecting ? 'جاري تحديد موقعك...' : 'استخدم موقعي الحالي'}
                      </Text>
                      <Text style={{ fontFamily: 'Cairo-Regular', fontSize: 12, color: colors.textSecondary, marginTop: 2, textAlign: 'right' }}>
                        {detecting ? 'يرجى الانتظار لحين جلب إحداثيات GPS...' : 'اعثر على أقرب مقدمي الخدمات'}
                      </Text>
                    </View>
                  </View>
                  {!detecting && (
                    <View style={{ position: 'absolute', left: 16, top: 0, bottom: 0, justifyContent: 'center' }}>
                      <Ionicons name="chevron-back" size={20} color={colors.primary} />
                    </View>
                  )}
                </Pressable>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Cities list header row (with Show All secondary action) */}
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>المدن المتاحة</Text>
                {activeCity && (
                  <Pressable
                    onPress={() => handleSelect(null)}
                    style={({ pressed }) => [
                      styles.clearFilterButton,
                      {
                        borderColor: colors.border,
                        backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="عرض جميع المدن وإلغاء فلتر المدينة"
                  >
                    <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 12, color: colors.primary }}>
                      عرض جميع المدن
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Skeleton loading placeholders */}
              {isLoading && (
                <View style={{ width: '100%' }}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <SkeletonRow key={idx} colors={colors} />
                  ))}
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            !isLoading && filteredCities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>📍</Text>
                <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 16, color: colors.textPrimary, marginBottom: 4 }}>
                  لا توجد مدينة مطابقة
                </Text>
                <Text style={{ fontFamily: 'Cairo-Regular', fontSize: 13, color: colors.textSecondary }}>
                  جرّب البحث باسم آخر
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>

      {/* Custom RTL Alert Modal */}
      <Modal
        visible={customAlert.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              width: '90%',
              maxWidth: 400,
              backgroundColor: colors.surface,
              borderRadius: 28,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {(() => {
              const t = customAlert.title || '';
              let iconName: keyof typeof Ionicons.glyphMap = 'information-circle-outline';
              let iconColor = colors.primary;
              let iconBg = colors.primarySoft;

              if (t.includes('تعذّر') || t.includes('مسبقاً') || t.includes('خطأ') || t.includes('تنبيه')) {
                iconName = 'alert-circle-outline';
                iconColor = colors.gold;
                iconBg = colors.goldSoft || 'rgba(245, 158, 11, 0.12)';
              } else if (t.includes('تم') || t.includes('نجاح')) {
                iconName = 'checkmark-circle-outline';
                iconColor = colors.success;
                iconBg = isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.10)';
              }

              return (
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name={iconName} size={28} color={iconColor} />
                </View>
              );
            })()}

            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Cairo-Bold',
                color: colors.textPrimary,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              {customAlert.title}
            </Text>

            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Cairo-SemiBold',
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 22,
                marginBottom: 24,
                writingDirection: 'rtl',
              }}
            >
              {customAlert.message}
            </Text>

            <View style={{ width: '100%', flexDirection: (customAlert.buttons || []).length === 2 ? 'row' : 'column', gap: 12 }}>
              {(() => {
                const actionButtons = customAlert.buttons || [];
                
                if (actionButtons.length === 0) {
                  return (
                    <Pressable
                      onPress={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
                      style={{
                        width: '100%',
                        height: 48,
                        borderRadius: 16,
                        backgroundColor: colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Cairo-Bold',
                          color: colors.textOnPrimary,
                        }}
                      >
                        حسناً
                      </Text>
                    </Pressable>
                  );
                }

                const sortedButtons = [...actionButtons].sort((a, b) => {
                  if (a.style === 'cancel' && b.style !== 'cancel') return -1;
                  if (a.style !== 'cancel' && b.style === 'cancel') return 1;
                  return 0;
                });

                return sortedButtons.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';
                  const isSideBySide = actionButtons.length === 2;
                  
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        setCustomAlert((prev) => ({ ...prev, visible: false }));
                        btn.onPress?.();
                      }}
                      style={{
                        flex: isSideBySide ? 1 : undefined,
                        width: isSideBySide ? undefined : '100%',
                        height: 48,
                        borderRadius: 16,
                        backgroundColor: isCancel
                          ? colors.surfaceAlt
                          : isDestructive
                          ? colors.error
                          : colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: isCancel ? 1 : 0,
                        borderColor: isCancel ? colors.border : undefined,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Cairo-Bold',
                          color: isCancel
                            ? colors.textPrimary
                            : colors.textOnPrimary,
                        }}
                      >
                        {btn.text}
                      </Text>
                    </Pressable>
                  );
                });
              })()}
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Cairo-Bold',
  },
  headerDot: {
    fontSize: 22,
    fontFamily: 'Cairo-Bold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 99,
  },
  searchContainer: {
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    height: '100%',
    paddingVertical: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  divider: {
    height: 1,
    marginVertical: 16,
    opacity: 0.8,
  },
  locationCard: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  cityRowContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityName: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
  },
  providerCountText: {
    fontSize: 13,
    fontFamily: 'Cairo-Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
});
