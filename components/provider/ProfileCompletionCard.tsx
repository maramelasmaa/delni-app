import { ProviderStatItem } from './ProviderStatItem';

type Props = {
  percentage: number;
  isComplete: boolean;
  onCompletePress: () => void;
};

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function ProfileCompletionCard({ percentage, isComplete, onCompletePress }: Props) {
  const value = clampPercentage(percentage);

  return (
    <ProviderStatItem
      icon={isComplete ? 'checkmark' : 'sparkles-outline'}
      label={isComplete ? 'الملف جاهز للعرض' : 'أكمل بيانات الملف'}
      value={`${value}%`}
      accessibilityLabel={`اكتمال الملف ${value} بالمئة`}
      accessibilityHint={isComplete ? undefined : 'يفتح صفحة إكمال بيانات الملف التجاري'}
      onPress={isComplete ? undefined : onCompletePress}
    />
  );
}
