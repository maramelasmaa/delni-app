import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorView } from '../components/ui/ErrorView';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useTheme } from '../src/hooks/useTheme';
import { useContact } from '../src/hooks/useApi';
import { buildSocialUrl, openExternalUrl } from '../src/utils/links';

export default function ContactScreen() {
  const { colors } = useTheme();
  const { data: contact, isLoading, isError, error, refetch } = useContact();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView error={error} onRetry={refetch} />;

  // Active contact channels (Filament-managed). Icon-only — no raw values shown.
  const items = [
    {
      id: 'whatsapp',
      icon: 'logo-whatsapp' as const,
      iconColor: colors.whatsapp,
      label: 'واتساب',
      value: contact?.whatsapp,
      action: () => contact?.whatsapp && openExternalUrl(`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`, { errorMessage: 'فشل فتح واتساب.' }),
    },
    {
      id: 'phone',
      icon: 'call' as const,
      iconColor: colors.primary,
      label: 'اتصال',
      value: contact?.phone,
      action: () => contact?.phone && openExternalUrl(`tel:${contact.phone}`, { errorMessage: 'فشل الاتصال الهاتفي.' }),
    },
    {
      id: 'email',
      icon: 'mail' as const,
      iconColor: colors.primary,
      label: 'البريد الإلكتروني',
      value: contact?.email,
      action: () => contact?.email && openExternalUrl(`mailto:${contact.email}`, { errorMessage: 'فشل فتح تطبيق البريد.' }),
    },
    {
      id: 'facebook',
      icon: 'logo-facebook' as const,
      iconColor: '#1877F2',
      label: 'فيسبوك',
      value: contact?.facebook,
      action: () => contact?.facebook && openExternalUrl(buildSocialUrl('facebook', contact.facebook)),
    },
    {
      id: 'address',
      icon: 'location' as const,
      iconColor: colors.textSecondary,
      label: 'العنوان',
      value: contact?.address,
      action: () => contact?.address && openExternalUrl(`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`, { errorMessage: 'فشل فتح الخرائط.' }),
    },
  ].filter((item): item is typeof item & { value: string } => !!item.value);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <View style={{ height: 64, width: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
            <Ionicons name="chatbubble-ellipses" size={32} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 24, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>اتصل بنا</Text>
          <Text style={{ marginTop: 4, fontSize: 12, color: colors.textMuted, fontFamily: 'Cairo-Regular', textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 }}>
            نسعد بإجابة أسئلتك والاستماع لاقتراحاتك
          </Text>
        </View>

        {/* Icon-only contact buttons */}
        {items.length === 0 ? (
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title="لا توجد معلومات اتصال"
            message="لا توجد قنوات تواصل متاحة حالياً. حاول تحديث الصفحة لاحقاً."
            actionLabel="إعادة المحاولة"
            onAction={() => refetch()}
          />
        ) : (
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', gap: 18, paddingHorizontal: 24 }}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={item.action}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                hitSlop={6}
                style={({ pressed }) => ({
                  height: 68,
                  width: 68,
                  borderRadius: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0,
                  shadowRadius: 6,
                  elevation: 0,
                  transform: [{ scale: pressed ? 0.93 : 1 }],
                })}
              >
                <Ionicons name={item.icon} size={32} color={item.iconColor} />
              </Pressable>
            ))}
          </View>
        )}

        <Text style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: colors.textDisabled, fontFamily: 'Cairo-Regular' }}>دلني v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
