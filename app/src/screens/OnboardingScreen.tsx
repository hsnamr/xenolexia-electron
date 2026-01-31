/**
 * Onboarding Screen - First-run flow: welcome, language pair, proficiency, word density
 */

import React, {useState, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {useUserStore} from '@xenolexia/shared/stores/userStore';
import {
  SUPPORTED_LANGUAGES,
  getLanguageInfo,
  type Language,
  type ProficiencyLevel,
} from '@xenolexia/shared/types';
import {Button, Card} from '../components/ui';
import './OnboardingScreen.css';

const STEPS = ['welcome', 'language', 'proficiency', 'density', 'done'] as const;
type Step = (typeof STEPS)[number];

export function OnboardingScreen(): React.JSX.Element {
  const navigate = useNavigate();
  const {preferences, updatePreferences, savePreferences} = useUserStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [sourceLanguage, setSourceLanguage] = useState<Language>(
    preferences.defaultSourceLanguage
  );
  const [targetLanguage, setTargetLanguage] = useState<Language>(
    preferences.defaultTargetLanguage
  );
  const [proficiency, setProficiency] = useState<ProficiencyLevel>(
    preferences.defaultProficiencyLevel
  );
  const [density, setDensity] = useState(preferences.defaultWordDensity);

  const step = STEPS[stepIndex];

  const handleNext = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      // Save and finish
      updatePreferences({
        defaultSourceLanguage: sourceLanguage,
        defaultTargetLanguage: targetLanguage,
        defaultProficiencyLevel: proficiency,
        defaultWordDensity: density,
        hasCompletedOnboarding: true,
      });
      savePreferences();
      navigate('/', {replace: true});
    }
  }, [
    stepIndex,
    sourceLanguage,
    targetLanguage,
    proficiency,
    density,
    updatePreferences,
    savePreferences,
    navigate,
  ]);

  const handleSkip = useCallback(() => {
    updatePreferences({hasCompletedOnboarding: true});
    savePreferences();
    navigate('/', {replace: true});
  }, [updatePreferences, savePreferences, navigate]);

  const canSkip = step === 'welcome';

  return (
    <div className="onboarding-screen">
      <div className="onboarding-content">
        {step === 'welcome' && (
          <Card variant="outlined" padding="lg" className="onboarding-card">
            <h1 className="onboarding-title">Welcome to Xenolexia</h1>
            <p className="onboarding-description">
              Learn languages through the stories you love. Set your preferences
              below, or skip to start reading right away.
            </p>
          </Card>
        )}

        {step === 'language' && (
          <Card variant="outlined" padding="lg" className="onboarding-card">
            <h2 className="onboarding-step-title">Language pair</h2>
            <p className="onboarding-description">
              Choose the language you're reading from and the one you're
              learning.
            </p>
            <div className="onboarding-row">
              <div className="onboarding-field">
                <label>Reading (source)</label>
                <select
                  value={sourceLanguage}
                  onChange={(e) =>
                    setSourceLanguage(e.target.value as Language)
                  }
                  className="onboarding-select"
                >
                  {SUPPORTED_LANGUAGES.filter((l) => l.code !== targetLanguage).map(
                    (lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div className="onboarding-field">
                <label>Learning (target)</label>
                <select
                  value={targetLanguage}
                  onChange={(e) =>
                    setTargetLanguage(e.target.value as Language)
                  }
                  className="onboarding-select"
                >
                  {SUPPORTED_LANGUAGES.filter((l) => l.code !== sourceLanguage).map(
                    (lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </Card>
        )}

        {step === 'proficiency' && (
          <Card variant="outlined" padding="lg" className="onboarding-card">
            <h2 className="onboarding-step-title">Proficiency level</h2>
            <p className="onboarding-description">
              How well do you know the target language? This affects which words
              get translated.
            </p>
            <div className="onboarding-options">
              {(['beginner', 'intermediate', 'advanced'] as const).map(
                (level) => (
                  <button
                    key={level}
                    type="button"
                    className={`onboarding-option ${
                      proficiency === level ? 'selected' : ''
                    }`}
                    onClick={() => setProficiency(level)}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                )
              )}
            </div>
          </Card>
        )}

        {step === 'density' && (
          <Card variant="outlined" padding="lg" className="onboarding-card">
            <h2 className="onboarding-step-title">Word density</h2>
            <p className="onboarding-description">
              What percentage of words should be replaced with translations?
              Higher = more words shown in the target language.
            </p>
            <div className="onboarding-slider-row">
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={density}
                onChange={(e) => setDensity(parseFloat(e.target.value))}
                className="onboarding-slider"
              />
              <span className="onboarding-value">
                {Math.round(density * 100)}%
              </span>
            </div>
          </Card>
        )}

        {step === 'done' && (
          <Card variant="outlined" padding="lg" className="onboarding-card">
            <h2 className="onboarding-step-title">You're all set</h2>
            <p className="onboarding-description">
              {getLanguageInfo(sourceLanguage)?.name} →{' '}
              {getLanguageInfo(targetLanguage)?.name}, {proficiency},{' '}
              {Math.round(density * 100)}% density. You can change these anytime
              in Settings.
            </p>
          </Card>
        )}

        <div className="onboarding-actions">
          {canSkip && (
            <Button
              variant="outline"
              onClick={handleSkip}
              className="onboarding-skip"
            >
              Skip
            </Button>
          )}
          <Button onClick={handleNext} className="onboarding-next">
            {step === 'done' ? 'Get started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
