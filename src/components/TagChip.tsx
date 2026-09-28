import React from 'react';
import { BrutalistBadge } from './BrutalistBadge';
import { AnonUTheme } from '../constants/theme';

interface TagChipProps {
  tag: string;
  onPress?: () => void;
  backgroundColor?: string;
}

export const TagChip: React.FC<TagChipProps> = ({
  tag,
  onPress,
  backgroundColor = AnonUTheme.popCyan,
}) => {
  return (
    <BrutalistBadge
      label={`#${tag}`}
      backgroundColor={backgroundColor}
      textColor={AnonUTheme.black}
      borderColor={AnonUTheme.black}
      borderWidth={2}
      fontSize={11}
      hasShadow={true}
      onPress={onPress}
    />
  );
};
