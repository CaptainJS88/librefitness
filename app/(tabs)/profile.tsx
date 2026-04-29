import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@/components/Shared/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDateForDatabase } from '@/lib/dateUtils';
import { supabase } from '@/lib/supabase';
import {
  getDailyLogByDate,
  updateDailyLogTargets,
} from '@/lib/dailyLogs';
import {
  getProfileTargetSettings,
  type ProfileTargetSettings,
  updateProfileTargetSettings,
} from '@/lib/profileTargets';
import {
  areMacroRatiosValid,
  deriveMacroTargetsFromCalories,
} from '@/lib/nutritionTargetUtils';
import { ThemedText } from '@/components/Shared/ThemedText';
import { ThemedView } from '@/components/Shared/ThemedView';
import { useThemeStore } from '@/store/useThemeStore';

// Calories must be a positive number for the constrained target model to work.
function parsePositiveNumberInput(value: string) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

// Ratio inputs are stored as integer percentages in profiles.
function parseRatioInput(value: string) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

const ProfileScreen = function () {
  const { session } = useAuth();
  const { toggleTheme } = useThemeStore();
  const { theme, colors } = useAppTheme();

  const [targetCaloriesInput, setTargetCaloriesInput] = useState('');
  const [proteinRatioInput, setProteinRatioInput] = useState('');
  const [carbRatioInput, setCarbRatioInput] = useState('');
  const [fatRatioInput, setFatRatioInput] = useState('');
  const [savedTargetSettings, setSavedTargetSettings] = useState<ProfileTargetSettings | null>(null);
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [isLoadingTargets, setIsLoadingTargets] = useState(true);
  const [isSavingTargets, setIsSavingTargets] = useState(false);

  async function handleSignOut() {
    const result = await supabase.auth.signOut();

    if (result.error) {
      console.error('Error signing out', result.error);
    }
  }

  // Loads the user's current profile target settings into simple form inputs.
  useEffect(() => {
    async function loadProfileTargets() {
      try {
        if (!session?.user?.id) {
          setIsLoadingTargets(false);
          return;
        }

        setIsLoadingTargets(true);

        const settings = await getProfileTargetSettings(session.user.id);

        setSavedTargetSettings(settings);
        setTargetCaloriesInput(settings.targetCalories.toString());
        setProteinRatioInput(settings.proteinRatioPct.toString());
        setCarbRatioInput(settings.carbRatioPct.toString());
        setFatRatioInput(settings.fatRatioPct.toString());
      } catch (error) {
        // First-time users may not have saved targets yet.
        // In that case, leave the form blank instead of treating it like a hard failure.
        if (
          error instanceof Error &&
          error.message.includes('incomplete')
        ) {
          setSavedTargetSettings(null);
          setTargetCaloriesInput('');
          setProteinRatioInput('');
          setCarbRatioInput('');
          setFatRatioInput('');
        } else {
          console.error('Error loading profile target settings:', error);
          Alert.alert('Error', 'Unable to load target settings right now.');
        }
      } finally {
        setIsLoadingTargets(false);
      }
    }

    loadProfileTargets();
  }, [session?.user?.id]);

  // Keeps the form reset logic in one place so Cancel and initial load stay consistent.
  function resetTargetForm(settings: ProfileTargetSettings | null) {
    setTargetCaloriesInput(settings?.targetCalories.toString() ?? '');
    setProteinRatioInput(settings?.proteinRatioPct.toString() ?? '');
    setCarbRatioInput(settings?.carbRatioPct.toString() ?? '');
    setFatRatioInput(settings?.fatRatioPct.toString() ?? '');
  }

  function handleStartEditingTargets() {
    resetTargetForm(savedTargetSettings);
    setIsEditingTargets(true);
  }

  function handleCancelEditingTargets() {
    resetTargetForm(savedTargetSettings);
    setIsEditingTargets(false);
  }

  const parsedTargetCalories = parsePositiveNumberInput(targetCaloriesInput);
  const parsedProteinRatio = parseRatioInput(proteinRatioInput);
  const parsedCarbRatio = parseRatioInput(carbRatioInput);
  const parsedFatRatio = parseRatioInput(fatRatioInput);

  const ratioTotal =
    (parsedProteinRatio ?? 0) +
    (parsedCarbRatio ?? 0) +
    (parsedFatRatio ?? 0);

  // We only derive macro grams when the profile form is fully valid.
  const derivedMacroPreview = useMemo(() => {
    if (
      parsedTargetCalories == null ||
      parsedProteinRatio == null ||
      parsedCarbRatio == null ||
      parsedFatRatio == null
    ) {
      return null;
    }

    if (
      !areMacroRatiosValid({
        proteinRatioPct: parsedProteinRatio,
        carbRatioPct: parsedCarbRatio,
        fatRatioPct: parsedFatRatio,
      })
    ) {
      return null;
    }

    return deriveMacroTargetsFromCalories(parsedTargetCalories, {
      proteinRatioPct: parsedProteinRatio,
      carbRatioPct: parsedCarbRatio,
      fatRatioPct: parsedFatRatio,
    });
  }, [
    parsedCarbRatio,
    parsedFatRatio,
    parsedProteinRatio,
    parsedTargetCalories,
  ]);

  const canSaveTargets =
    !isLoadingTargets &&
    !isSavingTargets &&
    parsedTargetCalories != null &&
    parsedProteinRatio != null &&
    parsedCarbRatio != null &&
    parsedFatRatio != null &&
    areMacroRatiosValid({
      proteinRatioPct: parsedProteinRatio,
      carbRatioPct: parsedCarbRatio,
      fatRatioPct: parsedFatRatio,
    });

  // Saves profile defaults and then updates today's existing daily_log
  // if one already exists. Past days remain untouched.
  async function handleSaveTargets() {
    try {
      if (!session?.user?.id) {
        Alert.alert('Not signed in', 'You must be signed in to save targets.');
        return;
      }

      if (
        parsedTargetCalories == null ||
        parsedProteinRatio == null ||
        parsedCarbRatio == null ||
        parsedFatRatio == null
      ) {
        Alert.alert('Invalid input', 'Please enter valid calories and macro ratios.');
        return;
      }

      if (
        !areMacroRatiosValid({
          proteinRatioPct: parsedProteinRatio,
          carbRatioPct: parsedCarbRatio,
          fatRatioPct: parsedFatRatio,
        })
      ) {
        Alert.alert('Invalid ratios', 'Protein, carbs, and fats must add up to 100%.');
        return;
      }

      setIsSavingTargets(true);

      const updatedSettings = await updateProfileTargetSettings(session.user.id, {
        targetCalories: parsedTargetCalories,
        proteinRatioPct: parsedProteinRatio,
        carbRatioPct: parsedCarbRatio,
        fatRatioPct: parsedFatRatio,
      });

      setSavedTargetSettings(updatedSettings);

      // Update the form with the saved values so the UI stays aligned
      // with whatever was persisted and rounded in the helper layer.
      setTargetCaloriesInput(updatedSettings.targetCalories.toString());
      setProteinRatioInput(updatedSettings.proteinRatioPct.toString());
      setCarbRatioInput(updatedSettings.carbRatioPct.toString());
      setFatRatioInput(updatedSettings.fatRatioPct.toString());

      const todayDateString = formatDateForDatabase(new Date());
      const todayDailyLog = await getDailyLogByDate(session.user.id, todayDateString);

      // Future days will pick up the new defaults when they are created.
      // Only today's existing log gets synced immediately.
      if (todayDailyLog) {
        await updateDailyLogTargets(todayDailyLog.id, {
          targetCalories: updatedSettings.targetCalories,
          targetProtein: updatedSettings.targetProtein,
          targetCarbs: updatedSettings.targetCarbs,
          targetFats: updatedSettings.targetFats,
        });
      }

      setIsEditingTargets(false);
      Alert.alert('Saved', 'Your default targets have been updated.');
    } catch (error) {
      console.error('Error saving profile target settings:', error);
      Alert.alert('Error', 'Unable to save target settings right now.');
    } finally {
      setIsSavingTargets(false);
    }
  }

  return (
    <ThemedView variant="background" style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.headerText}>Profile</ThemedText>

        <ThemedText variant="textMuted" style={styles.emailText}>
          Logged in as: {session?.user?.email || 'Unknown User'}
        </ThemedText>

        <ThemedView variant="surface" style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <ThemedText style={styles.cardTitle}>Default Targets</ThemedText>

            {!isEditingTargets ? (
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.background }]}
                onPress={handleStartEditingTargets}
                activeOpacity={0.8}
              >
                <Icon name="pencil" size={18} variant="muted" />
              </TouchableOpacity>
            ) : null}
          </View>

          {!isEditingTargets ? (
            <>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <ThemedText variant="textMuted" style={styles.summaryLabel}>
                    Calories
                  </ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    {savedTargetSettings ? savedTargetSettings.targetCalories : '--'}
                  </ThemedText>
                </View>

                <View style={styles.summaryItem}>
                  <ThemedText variant="textMuted" style={styles.summaryLabel}>
                    Protein
                  </ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    {savedTargetSettings ? `${savedTargetSettings.targetProtein} g` : '-- g'}
                  </ThemedText>
                </View>

                <View style={styles.summaryItem}>
                  <ThemedText variant="textMuted" style={styles.summaryLabel}>
                    Carbs
                  </ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    {savedTargetSettings ? `${savedTargetSettings.targetCarbs} g` : '-- g'}
                  </ThemedText>
                </View>

                <View style={styles.summaryItem}>
                  <ThemedText variant="textMuted" style={styles.summaryLabel}>
                    Fats
                  </ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    {savedTargetSettings ? `${savedTargetSettings.targetFats} g` : '-- g'}
                  </ThemedText>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <ThemedText style={styles.label}>Target Calories</ThemedText>
                <TextInput
                  value={targetCaloriesInput}
                  onChangeText={setTargetCaloriesInput}
                  keyboardType="number-pad"
                  placeholder="1500"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                />
              </View>

              <ThemedText style={styles.label}>Macro Ratios (%)</ThemedText>
              <View style={styles.ratioRow}>
                <View style={styles.ratioField}>
                  <ThemedText variant="textMuted" style={styles.ratioLabel}>
                    Protein
                  </ThemedText>
                  <TextInput
                    value={proteinRatioInput}
                    onChangeText={setProteinRatioInput}
                    keyboardType="number-pad"
                    placeholder="30"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                </View>

                <View style={styles.ratioField}>
                  <ThemedText variant="textMuted" style={styles.ratioLabel}>
                    Carbs
                  </ThemedText>
                  <TextInput
                    value={carbRatioInput}
                    onChangeText={setCarbRatioInput}
                    keyboardType="number-pad"
                    placeholder="40"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                </View>

                <View style={styles.ratioField}>
                  <ThemedText variant="textMuted" style={styles.ratioLabel}>
                    Fats
                  </ThemedText>
                  <TextInput
                    value={fatRatioInput}
                    onChangeText={setFatRatioInput}
                    keyboardType="number-pad"
                    placeholder="30"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                </View>
              </View>

              <ThemedText
                style={[
                  styles.ratioTotalText,
                  {
                    color:
                      ratioTotal === 100 || proteinRatioInput === '' || carbRatioInput === '' || fatRatioInput === ''
                        ? colors.textMuted
                        : colors.danger,
                  },
                ]}
              >
                Ratio total: {ratioTotal}%
              </ThemedText>

              <ThemedView
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <ThemedText style={styles.previewTitle}>Derived Macro Targets</ThemedText>

                {derivedMacroPreview ? (
                  <>
                    <ThemedText variant="textMuted" style={styles.previewText}>
                      Protein: {derivedMacroPreview.targetProtein} g
                    </ThemedText>
                    <ThemedText variant="textMuted" style={styles.previewText}>
                      Carbs: {derivedMacroPreview.targetCarbs} g
                    </ThemedText>
                    <ThemedText variant="textMuted" style={styles.previewText}>
                      Fats: {derivedMacroPreview.targetFats} g
                    </ThemedText>
                  </>
                ) : (
                  <ThemedText variant="textMuted" style={styles.previewText}>
                    Enter valid calories and ratios that add up to 100%.
                  </ThemedText>
                )}
              </ThemedView>

              <ThemedText variant="textMuted" style={styles.helperText}>
                Applies to today and future days. Past days stay unchanged.
              </ThemedText>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={handleCancelEditingTargets}
                  disabled={isSavingTargets}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    styles.actionButton,
                    {
                      backgroundColor: canSaveTargets ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={handleSaveTargets}
                  disabled={!canSaveTargets}
                >
                  <ThemedText style={[styles.primaryButtonText, { color: colors.buttonText }]}>
                    {isSavingTargets ? 'Saving...' : 'Save Targets'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ThemedView>

        <ThemedView variant="surface" style={styles.card}>
          <View
            style={[
              styles.switchRow,
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          >
            <ThemedText style={styles.secondaryButtonText}>Dark Mode</ThemedText>

            {/* Native switch keeps the interaction simple and familiar. */}
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#c4c4c4', true: '#FFFFFF' }}
              thumbColor={'#FFFFFF'}
              ios_backgroundColor={colors.primary}
            />
          </View>
        </ThemedView>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: colors.danger }]}
          onPress={handleSignOut}
        >
          <ThemedText style={[styles.primaryButtonText, { color: colors.buttonText }]}>
            Sign Out
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 15,
    marginBottom: SPACING.lg,
  },
  card: {
    padding: SPACING.md,
    borderRadius: 20,
    marginBottom: SPACING.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    fontSize: 13,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  ratioRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: 8,
  },
  ratioField: {
    flex: 1,
  },
  ratioLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  ratioTotalText: {
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    marginBottom: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  summaryItem: {
    width: '47%',
  },
  summaryLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  switchRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  signOutButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});

export default ProfileScreen;
