import { TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  // Headings & Display
  headingDisplay: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  cardTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },

  // Body text
  bodyPrimary: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  bodySecondary: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  caption: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
  },

  // Metrics
  metricValue: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '500',
  },
  metricLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '500',
  },

  // Action / Pill Labels
  buttonLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  pillLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
};
