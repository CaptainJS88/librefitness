import { StyleSheet } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import Icon from '@/components/Shared/Icon';
import { ThemedText } from '../Shared/ThemedText';
import { ThemedView } from '../Shared/ThemedView';

type Macro = {
  current: number;
  max: number;
};

type DailySummaryProps = {
  dietName: string;
  targetCalories: number;
  consumedCalories: number;
  burnedCalories: number;
  carbs: Macro;
  protein: Macro;
  fat: Macro;
};

type MacroBarProps = {
  label: string;
  current: number;
  max: number;
};

const MacroBar = ({ label, current, max }: MacroBarProps) => {
  const { colors } = useAppTheme();
  const progressPercent = max > 0 ? Math.min((current / max) * 100, 100) : 0;

  return (
    <ThemedView style={styles.macroContainer}>
      <ThemedText variant="textMuted" style={styles.macroLabel}>
        {label}
      </ThemedText>

      <ThemedView
        style={[styles.macroTrack, { backgroundColor: colors.border }]}
      >
        <ThemedView
          style={[
            styles.macroFill,
            {
              width: `${progressPercent}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </ThemedView>

      <ThemedText variant="textMuted" style={styles.macroText}>
        <ThemedText style={styles.macroTextBold}>{current}</ThemedText>/{max} g
      </ThemedText>
    </ThemedView>
  );
};

export default function DailySummary({
  dietName,
  targetCalories,
  consumedCalories,
  burnedCalories,
  carbs,
  protein,
  fat,
}: DailySummaryProps) {
  const { colors } = useAppTheme();

  const caloriesLeft = targetCalories - consumedCalories + burnedCalories;
  const isOverTarget = caloriesLeft < 0;
  const displayCaloriesDelta = Math.abs(caloriesLeft);
  const ringFill =
    targetCalories > 0
      ? Math.min((consumedCalories / targetCalories) * 100, 100)
      : 0;

  return (
    <ThemedView variant="surface" style={styles.card}>
      <ThemedView style={styles.headerRow}>
        <ThemedText style={styles.headerTitle}>{dietName}:</ThemedText>
        <ThemedText variant="primary" style={styles.headerTarget}>
          {targetCalories} kcal
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.middleSection}>
        <ThemedView style={styles.statsColumn}>
          <ThemedView style={styles.statBlock}>
            <ThemedView style={styles.statLabelRow}>
              <ThemedText variant="textMuted" style={styles.statLabel}>
                Eaten
              </ThemedText>
              <Icon name="restaurant-outline" size={14} variant="primary" />
            </ThemedView>

            <ThemedText style={styles.statValue}>
              {consumedCalories}{' '}
              <ThemedText variant="textMuted" style={styles.statUnit}>
                kcal
              </ThemedText>
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.statBlock}>
            <ThemedView style={styles.statLabelRow}>
              <ThemedText variant="textMuted" style={styles.statLabel}>
                Burned
              </ThemedText>
              <Icon name="flame-outline" size={14} color="#FF9500" />
            </ThemedView>

            <ThemedText style={styles.statValue}>
              {burnedCalories}{' '}
              <ThemedText variant="textMuted" style={styles.statUnit}>
                kcal
              </ThemedText>
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.ringContainer}>
          <AnimatedCircularProgress
            size={120}
            width={8}
            fill={ringFill}
            tintColor={colors.primary}
            backgroundColor={colors.border}
            rotation={0}
            lineCap="round"
          >
            {() => (
              <ThemedView style={styles.ringInner}>
                <ThemedText style={styles.ringNumber}>{displayCaloriesDelta}</ThemedText>
                <ThemedText
                  variant="textMuted"
                  style={[
                    styles.ringLabel,
                    isOverTarget ? { color: colors.danger } : null,
                  ]}
                >
                  {isOverTarget ? 'Over' : 'Left'}
                </ThemedText>
              </ThemedView>
            )}
          </AnimatedCircularProgress>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.macrosRow}>
        <MacroBar label="Carb" current={carbs.current} max={carbs.max} />
        <MacroBar label="Protein" current={protein.current} max={protein.max} />
        <MacroBar label="Fat" current={fat.current} max={fat.max} />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerTarget: {
    fontSize: 18,
    fontWeight: '700',
  },
  middleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statsColumn: {
    flex: 1,
    gap: SPACING.md,
  },
  statBlock: {},
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statUnit: {
    fontSize: 14,
    fontWeight: '400',
  },
  ringContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  ringInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  ringLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  macroContainer: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  macroTrack: {
    height: 6,
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroText: {
    fontSize: 12,
  },
  macroTextBold: {
    fontWeight: '700',
  },
});