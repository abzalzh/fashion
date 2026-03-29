import { Platform } from 'react-native'

/** Plus Jakarta Sans loaded in App.tsx; fallback keeps layout stable before fonts mount */
export const typography = {
  fontRegular: Platform.select({
    ios: 'PlusJakartaSans_400Regular',
    android: 'PlusJakartaSans_400Regular',
    default: 'PlusJakartaSans_400Regular',
  }) as string,
  fontSemi: Platform.select({
    ios: 'PlusJakartaSans_600SemiBold',
    android: 'PlusJakartaSans_600SemiBold',
    default: 'PlusJakartaSans_600SemiBold',
  }) as string,
  fontBold: Platform.select({
    ios: 'PlusJakartaSans_700Bold',
    android: 'PlusJakartaSans_700Bold',
    default: 'PlusJakartaSans_700Bold',
  }) as string,
  h1: {
    fontFamily: Platform.select({
      ios: 'PlusJakartaSans_700Bold',
      android: 'PlusJakartaSans_700Bold',
      default: 'PlusJakartaSans_700Bold',
    }) as string,
    fontSize: 26,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  h2: {
    fontFamily: Platform.select({
      ios: 'PlusJakartaSans_600SemiBold',
      android: 'PlusJakartaSans_600SemiBold',
      default: 'PlusJakartaSans_600SemiBold',
    }) as string,
    fontSize: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: Platform.select({
      ios: 'PlusJakartaSans_400Regular',
      android: 'PlusJakartaSans_400Regular',
      default: 'PlusJakartaSans_400Regular',
    }) as string,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: Platform.select({
      ios: 'PlusJakartaSans_600SemiBold',
      android: 'PlusJakartaSans_600SemiBold',
      default: 'PlusJakartaSans_600SemiBold',
    }) as string,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  micro: {
    fontFamily: Platform.select({
      ios: 'PlusJakartaSans_400Regular',
      android: 'PlusJakartaSans_400Regular',
      default: 'PlusJakartaSans_400Regular',
    }) as string,
    fontSize: 10,
    lineHeight: 14,
  },
  overline: {
    fontFamily: Platform.select({
      ios: 'PlusJakartaSans_600SemiBold',
      android: 'PlusJakartaSans_600SemiBold',
      default: 'PlusJakartaSans_600SemiBold',
    }) as string,
    fontSize: 10,
    letterSpacing: 2.4,
    textTransform: 'uppercase' as const,
  },
}
