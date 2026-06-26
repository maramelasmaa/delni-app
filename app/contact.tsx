import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorView } from '../components/ui/ErrorView';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useTheme } from '../src/hooks/useTheme';
import { useContact } from '../src/hooks/useApi';
import { buildSocialUrl, openExternalUrl } from '../src/utils/links';

export default function ContactScreen() {
  const { colors } = useTheme();
  const { data: contact, isLoading, isError, refetch } = useContact();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView onRetry={refetch} />;

  // Active contact channels (Filament-managed). Icon-only — no raw values shown.
  const items = [
    {
      id: 'whatsapp',
      icon: 'logo-whatsapp' as const,
      iconColor: colors.whatsapp,
      label: 'واتساب',
      value: contact?.whatsapp,
      action: () => contact?.whatsapp && openExternalUrl(`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`, { errorMessage: 'تعذّر فتح واتساب.' }),
    },
    {
      id: 'phone',
      icon: 'call' as const,
      iconColor: colors.primary,
      label: 'اتصال',
      value: contact?.phone,
      action: () => contact?.phone && openExternalUrl(`tel:${contact.phone}`, { errorMessage: 'تعذّر إجراء الاتصال.' }),
    },
    {
      id: 'email',
      icon: 'mail' as const,
      iconColor: colors.primary,
      label: 'البريد الإلكتروني',
      value: contact?.email,
      action: () => contact?.email && openExternalUrl(`mailto:${contact.email}`, { errorMessage: 'تعذّر فتح تطبيق البريد.' }),
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
      action: () => contact?.address && openExternalUrl(`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`, { errorMessage: 'تعذّر فتح الخرائط.' }),
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
          <Text style={{ fontSize: 24, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>تواصل معنا</Text>
          <Text style={{ marginTop: 4, fontSize: 12, color: colors.textMuted, fontFamily: 'Cairo-Regular', textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 }}>
            يسعدنا الإجابة عن استفساراتكم وتلقي مقترحاتكم
          </Text>
        </View>

        {/* Icon-only contact buttons */}
        {items.length === 0 ? (
          <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontFamily: 'Cairo-Regular', fontSize: 14, textAlign: 'center' }}>لا توجد معلومات اتصال مدخلة حالياً</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', gap: 18, paddingHorizontal: 24 }}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={item.action}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={({ pressed }) => ({
                  height: 60,
                  width: 60,
                  borderRadius: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                  elevation: 2,
                  transform: [{ scale: pressed ? 0.93 : 1 }],
                })}
              >
                <Ionicons name={item.icon} size={26} color={item.iconColor} />
              </Pressable>
            ))}
          </View>
        )}

        <Text style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: colors.textDisabled, fontFamily: 'Cairo-Regular' }}>دلني v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
