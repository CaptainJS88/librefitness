import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING } from '@/constants/theme';
import Icon from '@/components/Shared/Icon';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

// Data shape for macros
type Macro = { current: number, max: number };

// Data shape for summary

type DailySummaryProps = {
    dietName: string;
    targetCalories: number;
    consumedCalories: number;
    burnedCalories: number;
    carbs: Macro;
    protein: Macro;
    fat: Macro;
}

type MacroBarProps = {
    label: string;
    current: number;
    max: number;
}

// Macros sub component 
const MacroBar = ({ label, current, max }: MacroBarProps) => {
    // Ensuring we don't divide by zero
    const progressPercent = max > 0 ? Math.min((current / max) * 100, 100) : 0;
    return (
        <View style={styles.macroContainer}>
            <Text style={styles.macroLabel}>{label}</Text>
            <View style={styles.macroTrack}>
                <View style={[styles.macroFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.macroText}>
                <Text style={styles.macroTextBold}>{current}</Text>/{max} g
            </Text>
        </View>
    );
}

// Main daily summary component
export default function DailySummary({
    dietName,
    targetCalories,
    consumedCalories,
    burnedCalories,
    carbs,
    protein,
    fat,
}: DailySummaryProps) {

    // Add burned calories back to the allowance
    const caloriesLeft = targetCalories - consumedCalories + burnedCalories;

    // Calculate fill percentage for the ring, capped at 100%
    const ringFill = targetCalories > 0 ? Math.min((consumedCalories / targetCalories) * 100, 100) : 0;
    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>{dietName}: </Text>
                <Text style={styles.headerTarget}>{targetCalories} kcal</Text>
            </View>

            {/* Middle Section: Stats & SVG Ring */}
            <View style={styles.middleSection}>
                {/* Left Column: Eaten / Burned */}
                <View style={styles.statsColumn}>
                    <View style={styles.statBlock}>
                        <View style={styles.statLabelRow}>
                            <Text style={styles.statLabel}>Eaten</Text>
                            <Icon name="restaurant-outline" size={14} color={COLORS.primary} />
                        </View>
                        <Text style={styles.statValue}>
                            {consumedCalories} <Text style={styles.statUnit}>kcal</Text>
                        </Text>
                    </View>

                    <View style={styles.statBlock}>
                        <View style={styles.statLabelRow}>
                            <Text style={styles.statLabel}>Burned</Text>
                            <Icon name="flame-outline" size={14} color="#FF9500" />
                        </View>
                        <Text style={styles.statValue}>
                            {burnedCalories} <Text style={styles.statUnit}>kcal</Text>
                        </Text>
                    </View>
                </View>

                {/* Right Column: Animated Circular Progress */}
                <View style={styles.ringContainer}>
                    <AnimatedCircularProgress
                        size={120}
                        width={8}
                        fill={ringFill}
                        tintColor={COLORS.primary}
                        backgroundColor={COLORS.border}
                        rotation={0}
                        lineCap="round"
                    >
                        {() => (
                            <View style={styles.ringInner}>
                                <Text style={styles.ringNumber}>{caloriesLeft}</Text>
                                <Text style={styles.ringLabel}>Left</Text>
                            </View>
                        )}
                    </AnimatedCircularProgress>
                </View>
            </View>

            {/* Bottom Section: Macros */}
            <View style={styles.macrosRow}>
                <MacroBar label="Carb" current={carbs.current} max={carbs.max} />
                <MacroBar label="Protein" current={protein.current} max={protein.max} />
                <MacroBar label="Fat" current={fat.current} max={fat.max} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
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
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    headerTarget: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.primary,
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
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
    },
    statUnit: {
        fontSize: 14,
        fontWeight: '400',
        color: COLORS.textMuted,
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
        color: COLORS.text,
    },
    ringLabel: {
        fontSize: 14,
        color: COLORS.textMuted,
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
        color: COLORS.textMuted,
        marginBottom: 6,
        fontWeight: '500',
    },
    macroTrack: {
        height: 6,
        backgroundColor: COLORS.border,
        borderRadius: 3,
        marginBottom: 6,
        overflow: 'hidden',
    },
    macroFill: {
        height: '100%',
        backgroundColor: COLORS.text,
        borderRadius: 3,
    },
    macroText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    macroTextBold: {
        fontWeight: '700',
        color: COLORS.text,
    },
});
