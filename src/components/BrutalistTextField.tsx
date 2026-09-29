import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { AnonUTheme } from '../constants/theme';

interface BrutalistTextFieldProps extends TextInputProps {
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}

export const BrutalistTextField: React.FC<BrutalistTextFieldProps> = ({
  prefixIcon,
  suffixIcon,
  containerStyle,
  backgroundColor = AnonUTheme.bgSurface,
  style,
  ...textInputProps
}) => {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={styles.shadow} />
      <View style={[styles.fieldContainer, { backgroundColor }]}>
        {prefixIcon ? <View style={styles.prefix}>{prefixIcon}</View> : null}
        <TextInput
          placeholderTextColor={AnonUTheme.textMuted}
          style={[styles.input, style]}
          accessible={true}
          accessibilityLabel={textInputProps.accessibilityLabel || textInputProps.placeholder}
          {...textInputProps}
        />
        {suffixIcon ? <View style={styles.suffix}>{suffixIcon}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginVertical: 4,
    width: '100%',
  },
  shadow: {
    position: 'absolute',
    top: 2.5,
    left: 2.5,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: '100%',
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidth,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  prefix: {
    marginRight: 8,
  },
  suffix: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    color: AnonUTheme.textBlack,
    fontWeight: '700',
    fontSize: 14.5,
    paddingVertical: 10,
  },
});
