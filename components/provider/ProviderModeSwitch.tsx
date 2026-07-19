import { AppModeSegmentedControl } from './AppModeSegmentedControl';

type Props = { mode: 'public' | 'provider'; compact?: boolean };

export function ProviderModeSwitch({ mode, compact = false }: Props) {
  return <AppModeSegmentedControl mode={mode} compact={compact} />;
}
