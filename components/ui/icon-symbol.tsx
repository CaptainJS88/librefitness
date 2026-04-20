// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolView, SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, Platform, ViewStyle, type StyleProp, type TextStyle } from 'react-native';


// Extract exact types from the underlying libraries
type IOSIconName = SymbolViewProps['name'];
type AndroidIconName = ComponentProps<typeof MaterialIcons>['name'];

export type IconSymbolName = 
  | 'house.fill'
  | 'paperplane.fill'
  | 'chevron.left.forwardslash.chevron.right'
  | 'chevron.right'
  | 'progress.indicator';

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */

const IOS_MAPPING: Record<IconSymbolName, IOSIconName> = {
  'house.fill': 'house.fill',
  'paperplane.fill': 'paperplane.fill',
  'chevron.left.forwardslash.chevron.right': 'chevron.left.forwardslash.chevron.right',
  'chevron.right': 'chevron.right',
  'progress.indicator': 'progress.indicator',
};

const ANDROID_MAPPING: Record<IconSymbolName, AndroidIconName> = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'progress.indicator': 'sync',
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle | ViewStyle>;
  weight?: SymbolWeight;
}) {
  console.log('Icon Name passed to component:', name);
  if (Platform.OS === 'ios') {
    const iosName = IOS_MAPPING[name];
    return (
      <SymbolView
        name={iosName}
        size={size}
        tintColor={color}
        weight={weight}
        style={style as StyleProp<ViewStyle>}
      />
    );
  }

  const androidName = ANDROID_MAPPING[name];
  console.log('Resolved Android Icon Name:', androidName);
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={androidName}
      style={style as StyleProp<TextStyle>}
    />
  );
}