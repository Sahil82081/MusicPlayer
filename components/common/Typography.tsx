import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
  TextStyle,
} from 'react-native';
import { Palette, Typography as TypographyTokens } from '@/constants/theme';

export type TypographyVariant =
  | 'display'
  | 'titleLarge'
  | 'titleMedium'
  | 'titleSmall'
  | 'body'
  | 'bodyMedium'
  | 'subhead'
  | 'caption'
  | 'meta';

export interface TypographyProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
  children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color,
  align,
  weight,
  style,
  children,
  ...props
}) => {
  const tokenStyle = TypographyTokens[variant] || TypographyTokens.body;

  const resolvedColor = color || (
    variant === 'subhead'
      ? Palette.textSecondary
      : variant === 'caption'
      ? Palette.textTertiary
      : variant === 'meta'
      ? Palette.textAccent
      : Palette.textPrimary
  );

  return (
    <RNText
      style={[
        tokenStyle,
        {
          color: resolvedColor,
          textAlign: align,
          ...(weight ? { fontWeight: weight } : {}),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

export default Typography;

