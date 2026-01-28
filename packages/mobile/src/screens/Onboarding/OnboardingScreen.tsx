/**
 * Onboarding Screen - Initial setup flow for new users
 *
 * Steps:
 * 1. Welcome - Introduction to Xenolexia
 * 2. Source Language - Native language selection
 * 3. Target Language - Learning language selection
 * 4. Proficiency Level - Beginner/Intermediate/Advanced
 * 5. Word Density - How many words to replace
 * 6. Complete - Summary and start
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@theme/index';
import type { Language, ProficiencyLevel } from '@xenolexia/shared/types/index';
import { SUPPORTED_LANGUAGES, getLanguageInfo } from '@xenolexia/shared/types/index';
import { useUserStore } from '@xenolexia/shared/stores/userStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// Types
// ============================================================================

type OnboardingStep = 'welcome' | 'source' | 'target' | 'level' | 'density' | 'complete';

const STEPS: OnboardingStep[] = ['welcome', 'source', 'target', 'level', 'density', 'complete'];

interface LevelOption {
  level: ProficiencyLevel;
  title: string;
  description: string;
  cefr: string;
  examples: string[];
}

const LEVEL_OPTIONS: LevelOption[] = [
  {
    level: 'beginner',
    title: 'Beginner',
    description: 'Basic vocabulary: numbers, colors, common objects, greetings',
    cefr: 'A1-A2',
    examples: ['hello', 'book', 'water', 'good'],
  },
  {
    level: 'intermediate',
    title: 'Intermediate',
    description: 'Everyday vocabulary: actions, descriptions, feelings',
    cefr: 'B1-B2',
    examples: ['remember', 'beautiful', 'journey', 'believe'],
  },
  {
    level: 'advanced',
    title: 'Advanced',
    description: 'Complex vocabulary: idioms, technical terms, nuanced expressions',
    cefr: 'C1-C2',
    examples: ['melancholy', 'ubiquitous', 'serendipity', 'ephemeral'],
  },
];

// ============================================================================
// Component
// ============================================================================

export function OnboardingScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { updatePreferences } = useUserStore();

  // State
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [sourceLanguage, setSourceLanguage] = useState<Language>('en');
  const [targetLanguage, setTargetLanguage] = useState<Language>('es');
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel>('beginner');
  const [wordDensity, setWordDensity] = useState(0.3);
  const [languageSearch, setLanguageSearch] = useState('');

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentStepIndex = STEPS.indexOf(currentStep);

  // Animate step transitions
  const animateTransition = useCallback((direction: 'forward' | 'back', callback: () => void) => {
    const toValue = direction === 'forward' ? -50 : 50;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(direction === 'forward' ? 50 : -50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const goToStep = useCallback((step: OnboardingStep) => {
    const newIndex = STEPS.indexOf(step);
    const direction = newIndex > currentStepIndex ? 'forward' : 'back';
    animateTransition(direction, () => setCurrentStep(step));
  }, [currentStepIndex, animateTransition]);

  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      goToStep(STEPS[nextIndex]);
    }
  }, [currentStepIndex, goToStep]);

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(STEPS[prevIndex]);
    }
  }, [currentStepIndex, goToStep]);

  const handleComplete = useCallback(() => {
    updatePreferences({
      defaultSourceLanguage: sourceLanguage,
      defaultTargetLanguage: targetLanguage,
      defaultProficiencyLevel: proficiencyLevel,
      defaultWordDensity: wordDensity,
      hasCompletedOnboarding: true,
    });
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' as never }],
    });
  }, [navigation, updatePreferences, sourceLanguage, targetLanguage, proficiencyLevel, wordDensity]);

  // Filter languages for search
  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(languageSearch.toLowerCase())
  );

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: { backgroundColor: colors.background.primary },
    title: { color: colors.text.primary },
    subtitle: { color: colors.text.secondary },
    description: { color: colors.text.tertiary },
    card: { backgroundColor: colors.background.secondary },
    cardSelected: { 
      backgroundColor: colors.primary[500] + '15',
      borderColor: colors.primary[500],
    },
    primaryButton: { backgroundColor: colors.primary[500] },
    secondaryButton: { 
      backgroundColor: colors.background.secondary,
      borderColor: colors.border.primary,
    },
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => (
        <View
          key={step}
          style={[
            styles.stepDot,
            {
              backgroundColor:
                index <= currentStepIndex
                  ? colors.primary[500]
                  : colors.background.tertiary,
            },
            index === currentStepIndex && styles.stepDotActive,
          ]}
        />
      ))}
    </View>
  );

  const renderWelcome = () => (
    <View style={styles.stepContent}>
      <View style={styles.welcomeIcon}>
        <TextDisplay text="📚" style={styles.welcomeEmoji} />
        <TextDisplay text="🌍" style={styles.welcomeEmoji} />
      </View>
      <TextDisplay text="Welcome to Xenolexia" style={[styles.title, dynamicStyles.title]} />
      <TextDisplay
        text="Learn languages naturally through the stories you love"
        style={[styles.subtitle, dynamicStyles.subtitle]}
      />
      <View style={[styles.featureCard, dynamicStyles.card]}>
        <View style={styles.featureRow}>
          <TextDisplay text="📖" style={styles.featureIcon} />
          <TextDisplay
            text="Read books in your native language with foreign words sprinkled in"
            style={[styles.featureText, dynamicStyles.description]}
          />
        </View>
        <View style={styles.featureRow}>
          <TextDisplay text="🎯" style={styles.featureIcon} />
          <TextDisplay
            text="Learn from context, not flashcards — words stick naturally"
            style={[styles.featureText, dynamicStyles.description]}
          />
        </View>
        <View style={styles.featureRow}>
          <TextDisplay text="📈" style={styles.featureIcon} />
          <TextDisplay
            text="Progress at your own pace with adaptive difficulty"
            style={[styles.featureText, dynamicStyles.description]}
          />
        </View>
      </View>
    </View>
  );

  const renderLanguageSelection = (
    title: string,
    selectedLang: Language,
    onSelect: (lang: Language) => void,
    excludeLang?: Language
  ) => (
    <View style={styles.stepContent}>
      <TextDisplay text={title} style={[styles.stepTitle, dynamicStyles.title]} />
      
      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background.secondary }]}>
        <TextDisplay text="🔍" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search languages..."
          placeholderTextColor={colors.text.tertiary}
          value={languageSearch}
          onChangeText={setLanguageSearch}
        />
      </View>

      <FlatList
        data={filteredLanguages.filter(l => l.code !== excludeLang)}
        keyExtractor={(item) => item.code}
        style={styles.languageList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.languageItem,
              dynamicStyles.card,
              selectedLang === item.code && dynamicStyles.cardSelected,
            ]}
            onPress={() => onSelect(item.code)}
            activeOpacity={0.7}
          >
            <TextDisplay text={item.flag || '🌐'} style={styles.languageFlag} />
            <View style={styles.languageInfo}>
              <TextDisplay
                text={item.name}
                style={[
                  styles.languageName,
                  { color: selectedLang === item.code ? colors.primary[500] : colors.text.primary },
                ]}
              />
              <TextDisplay
                text={item.nativeName}
                style={[styles.languageNative, dynamicStyles.description]}
              />
            </View>
            {selectedLang === item.code && (
              <View style={[styles.checkBadge, { backgroundColor: colors.primary[500] }]}>
                <TextDisplay text="✓" style={styles.checkText} />
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderLevelSelection = () => (
    <View style={styles.stepContent}>
      <TextDisplay
        text={`What's your level in ${getLanguageInfo(targetLanguage)?.name || 'the target language'}?`}
        style={[styles.stepTitle, dynamicStyles.title]}
      />
      
      <View style={styles.levelList}>
        {LEVEL_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.level}
            style={[
              styles.levelItem,
              dynamicStyles.card,
              proficiencyLevel === option.level && dynamicStyles.cardSelected,
            ]}
            onPress={() => setProficiencyLevel(option.level)}
            activeOpacity={0.7}
          >
            <View style={styles.levelHeader}>
              <TextDisplay
                text={option.title}
                style={[
                  styles.levelTitle,
                  { color: proficiencyLevel === option.level ? colors.primary[500] : colors.text.primary },
                ]}
              />
              <View style={[styles.cefrBadge, { backgroundColor: colors.primary[500] + '20' }]}>
                <TextDisplay
                  text={option.cefr}
                  style={[styles.cefrText, { color: colors.primary[500] }]}
                />
              </View>
            </View>
            <TextDisplay
              text={option.description}
              style={[styles.levelDescription, dynamicStyles.description]}
            />
            <View style={styles.exampleWords}>
              {option.examples.map((word, i) => (
                <View
                  key={word}
                  style={[styles.exampleBadge, { backgroundColor: colors.background.tertiary }]}
                >
                  <TextDisplay
                    text={word}
                    style={[styles.exampleText, { color: colors.text.secondary }]}
                  />
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDensitySelection = () => {
    const densityPercentage = Math.round(wordDensity * 100);
    
    return (
      <View style={styles.stepContent}>
        <TextDisplay
          text="How many words should be replaced?"
          style={[styles.stepTitle, dynamicStyles.title]}
        />
        <TextDisplay
          text="Start low and increase as you get comfortable"
          style={[styles.subtitle, dynamicStyles.subtitle]}
        />

        {/* Density Value Display */}
        <View style={[styles.densityDisplay, { backgroundColor: colors.primary[500] + '15' }]}>
          <TextDisplay
            text={`${densityPercentage}%`}
            style={[styles.densityValue, { color: colors.primary[500] }]}
          />
          <TextDisplay
            text="of eligible words"
            style={[styles.densityLabel, dynamicStyles.description]}
          />
        </View>

        {/* Density Slider */}
        <View style={styles.sliderContainer}>
          <TextDisplay text="10%" style={[styles.sliderLabel, dynamicStyles.description]} />
          <View style={[styles.sliderTrack, { backgroundColor: colors.background.tertiary }]}>
            <View
              style={[
                styles.sliderFill,
                {
                  backgroundColor: colors.primary[500],
                  width: `${((wordDensity - 0.1) / 0.4) * 100}%`,
                },
              ]}
            />
            <TouchableOpacity
              style={[
                styles.sliderThumb,
                {
                  backgroundColor: colors.primary[500],
                  left: `${((wordDensity - 0.1) / 0.4) * 100}%`,
                },
              ]}
              onPress={() => {}}
            />
          </View>
          <TextDisplay text="50%" style={[styles.sliderLabel, dynamicStyles.description]} />
        </View>

        {/* Preset Buttons */}
        <View style={styles.presetButtons}>
          {[
            { value: 0.1, label: 'Gentle', desc: 'A few words per page' },
            { value: 0.2, label: 'Light', desc: 'Comfortable learning' },
            { value: 0.3, label: 'Moderate', desc: 'Active learning' },
            { value: 0.4, label: 'Intense', desc: 'Challenge mode' },
            { value: 0.5, label: 'Immersive', desc: 'Maximum exposure' },
          ].map((preset) => (
            <TouchableOpacity
              key={preset.value}
              style={[
                styles.presetButton,
                dynamicStyles.card,
                wordDensity === preset.value && dynamicStyles.cardSelected,
              ]}
              onPress={() => setWordDensity(preset.value)}
            >
              <TextDisplay
                text={preset.label}
                style={[
                  styles.presetLabel,
                  { color: wordDensity === preset.value ? colors.primary[500] : colors.text.primary },
                ]}
              />
              <TextDisplay
                text={preset.desc}
                style={[styles.presetDesc, dynamicStyles.description]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderComplete = () => {
    const sourceLang = getLanguageInfo(sourceLanguage);
    const targetLang = getLanguageInfo(targetLanguage);
    const level = LEVEL_OPTIONS.find(l => l.level === proficiencyLevel);

    return (
      <View style={styles.stepContent}>
        <TextDisplay text="🎉" style={styles.completeEmoji} />
        <TextDisplay text="You're All Set!" style={[styles.title, dynamicStyles.title]} />

        <View style={[styles.summaryCard, dynamicStyles.card]}>
          <TextDisplay
            text="Your Learning Setup"
            style={[styles.summaryTitle, dynamicStyles.subtitle]}
          />
          
          <View style={styles.summaryRow}>
            <TextDisplay text="Reading in" style={[styles.summaryLabel, dynamicStyles.description]} />
            <View style={styles.summaryValueRow}>
              <TextDisplay text={sourceLang?.flag || ''} style={styles.summaryFlag} />
              <TextDisplay text={sourceLang?.name || ''} style={[styles.summaryValue, dynamicStyles.title]} />
            </View>
          </View>

          <View style={styles.summaryRow}>
            <TextDisplay text="Learning" style={[styles.summaryLabel, dynamicStyles.description]} />
            <View style={styles.summaryValueRow}>
              <TextDisplay text={targetLang?.flag || ''} style={styles.summaryFlag} />
              <TextDisplay text={targetLang?.name || ''} style={[styles.summaryValue, dynamicStyles.title]} />
            </View>
          </View>

          <View style={styles.summaryRow}>
            <TextDisplay text="Level" style={[styles.summaryLabel, dynamicStyles.description]} />
            <TextDisplay text={level?.title || ''} style={[styles.summaryValue, dynamicStyles.title]} />
          </View>

          <View style={styles.summaryRow}>
            <TextDisplay text="Density" style={[styles.summaryLabel, dynamicStyles.description]} />
            <TextDisplay
              text={`${Math.round(wordDensity * 100)}%`}
              style={[styles.summaryValue, dynamicStyles.title]}
            />
          </View>
        </View>

        <TextDisplay
          text="Import your first book and start learning through reading!"
          style={[styles.description, dynamicStyles.description]}
        />
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcome();
      case 'source':
        return renderLanguageSelection(
          "What's your native language?",
          sourceLanguage,
          setSourceLanguage
        );
      case 'target':
        return renderLanguageSelection(
          'Which language do you want to learn?',
          targetLanguage,
          (lang) => {
            setTargetLanguage(lang);
            setLanguageSearch('');
          },
          sourceLanguage
        );
      case 'level':
        return renderLevelSelection();
      case 'density':
        return renderDensitySelection();
      case 'complete':
        return renderComplete();
    }
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      {/* Header with back button and step indicator */}
      <View style={styles.header}>
        {currentStep !== 'welcome' ? (
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <TextDisplay text="←" style={[styles.backText, { color: colors.primary[500] }]} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        {renderStepIndicator()}
        <View style={styles.backButton} />
      </View>

      {/* Animated Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {renderCurrentStep()}
      </Animated.View>

      {/* Footer with buttons */}
      <View style={styles.footer}>
        {currentStep === 'complete' ? (
          <TouchableOpacity
            style={[styles.primaryButton, dynamicStyles.primaryButton]}
            onPress={handleComplete}
          >
            <TextDisplay text="Start Reading" style={styles.primaryButtonText} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, dynamicStyles.primaryButton]}
            onPress={goNext}
          >
            <TextDisplay
              text={currentStep === 'welcome' ? 'Get Started' : 'Continue'}
              style={styles.primaryButtonText}
            />
          </TouchableOpacity>
        )}

        {currentStep === 'welcome' && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              updatePreferences({ hasCompletedOnboarding: true });
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' as never }],
              });
            }}
          >
            <TextDisplay text="Skip for now" style={[styles.skipText, { color: colors.text.tertiary }]} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// Simple text display component
function TextDisplay({ text, style }: { text: string; style?: any }) {
  const { Text } = require('react-native');
  return <Text style={style}>{text}</Text>;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
    width: 48,
  },
  backText: {
    fontSize: 28,
    fontWeight: '300',
  },
  cefrBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cefrText: {
    fontSize: 12,
    fontWeight: '700',
  },
  checkBadge: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  completeEmoji: {
    fontSize: 64,
    marginBottom: 16,
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  densityDisplay: {
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 24,
    paddingVertical: 24,
  },
  densityLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  densityValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 16,
    textAlign: 'center',
  },
  exampleBadge: {
    borderRadius: 6,
    marginRight: 6,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  exampleText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  exampleWords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  featureCard: {
    borderRadius: 16,
    marginTop: 32,
    padding: 20,
    width: '100%',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 16,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 14,
  },
  languageInfo: {
    flex: 1,
  },
  languageItem: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    marginBottom: 8,
    padding: 14,
  },
  languageList: {
    flex: 1,
    marginTop: 8,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
  },
  languageNative: {
    fontSize: 13,
    marginTop: 2,
  },
  levelDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  levelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelItem: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
    padding: 16,
  },
  levelList: {
    flex: 1,
    marginTop: 16,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  presetButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
    padding: 14,
  },
  presetButtons: {},
  presetDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  presetLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 28,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  searchContainer: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  skipText: {
    fontSize: 15,
  },
  sliderContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  sliderFill: {
    borderRadius: 3,
    height: '100%',
    position: 'absolute',
  },
  sliderLabel: {
    fontSize: 13,
    width: 36,
  },
  sliderThumb: {
    borderRadius: 14,
    height: 28,
    marginLeft: -14,
    position: 'absolute',
    top: -11,
    width: 28,
  },
  sliderTrack: {
    borderRadius: 3,
    flex: 1,
    height: 6,
    marginHorizontal: 12,
    position: 'relative',
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepDot: {
    borderRadius: 4,
    height: 8,
    marginHorizontal: 4,
    width: 8,
  },
  stepDotActive: {
    width: 24,
  },
  stepIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryCard: {
    borderRadius: 16,
    marginTop: 24,
    padding: 20,
    width: '100%',
  },
  summaryFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeEmoji: {
    fontSize: 48,
  },
  welcomeIcon: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 24,
  },
});
