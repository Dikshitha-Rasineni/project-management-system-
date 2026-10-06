import { ActionSheetIOS, Alert, Platform } from 'react-native';

export interface ChoiceOption {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
}

/**
 * Platform-native "pick one" menu.
 *  - iOS: action sheet sliding up from the bottom, with a Cancel button
 *    (iOS alerts can't be dismissed by tapping outside, so a sheet is the
 *    expected pattern there).
 *  - Android: dialog that closes when tapping outside.
 */
export function chooseOption(title: string, message: string | undefined, options: ChoiceOption[]) {
  if (Platform.OS === 'ios') {
    const labels = [...options.map((o) => o.label), 'Cancel'];
    const destructiveIndex = options.findIndex((o) => o.destructive);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: labels,
        cancelButtonIndex: labels.length - 1,
        destructiveButtonIndex: destructiveIndex >= 0 ? destructiveIndex : undefined,
      },
      (index) => {
        if (index < options.length) options[index]!.onSelect();
      },
    );
    return;
  }
  Alert.alert(
    title,
    message,
    options.map((o) => ({ text: o.label, style: o.destructive ? 'destructive' : 'default', onPress: o.onSelect })),
    { cancelable: true },
  );
}
