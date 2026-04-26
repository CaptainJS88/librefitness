import { useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ThemedText } from '../Shared/ThemedText';

type DateSwiperProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

type DateItem = {
  key: string;
  date: Date;
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Pill width is fixed so FlatList can calculate offsets cleanly.
const PILL_WIDTH = 58;
const PILL_GAP = SPACING.sm;
const ITEM_SIZE = PILL_WIDTH + PILL_GAP;

// Creates a date at local midnight.
function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Returns a new date shifted by N days.
function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return startOfDay(nextDate);
}

// Checks whether two Date objects point to the selected calendar day.
function isSelectedDte(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Generates a long list of dates around today.
// This is not mathematically infinite, but it feels effectively infinite for normal use.
function buildDateRange(centerDate: Date) {
  const dates: DateItem[] = [];

  for (let offset = -365; offset <= 365; offset += 1) {
    const date = addDays(centerDate, offset);

    dates.push({
      key: date.toISOString(),
      date,
    });
  }

  return dates;
}

export default function DateSwiper({
  selectedDate,
  onSelectDate,
}: DateSwiperProps) {
  const { colors } = useAppTheme();
  const flatListRef = useRef<FlatList<DateItem>>(null);

  // We build the range around "today" once, then just move inside it.
  const today = useMemo(() => startOfDay(new Date()), []);

  const dates = useMemo(() => buildDateRange(today), [today]);

  // Find the selected date inside the generated range.
  const selectedIndex = useMemo(() => {
    return dates.findIndex((item) => isSelectedDte(item.date, selectedDate));
  }, [dates, selectedDate]);

  // Center the selected day when the selected date changes.
  useEffect(() => {
    if (selectedIndex < 0 || !flatListRef.current) {
      return;
    }

    flatListRef.current.scrollToIndex({
      index: selectedIndex,
      animated: true,
      viewPosition: 0.5,
    });
  }, [selectedIndex]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={dates}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialScrollIndex={selectedIndex >= 0 ? selectedIndex : 365}
        getItemLayout={(_, index) => ({
          length: ITEM_SIZE,
          offset: ITEM_SIZE * index,
          index,
        })}
        onScrollToIndexFailed={() => {
          // FlatList can occasionally fail before layout settles.
          // In that case, we simply do nothing and let the next render retry.
        }}
        renderItem={({ item }) => {
          const isSelected = isSelectedDte(item.date, selectedDate);

          return (
            <TouchableOpacity
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => onSelectDate(item.date)}
              activeOpacity={0.8}
            >
              <ThemedText
                style={[
                  styles.dayNumber,
                  { color: isSelected ? colors.buttonText : colors.text },
                ]}
              >
                {item.date.getDate()}
              </ThemedText>

              <ThemedText
                style={[
                  styles.weekdayLabel,
                  { color: isSelected ? colors.buttonText : colors.textMuted },
                ]}
              >
                {WEEKDAY_LABELS[item.date.getDay()]}
              </ThemedText>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  listContent: {
    paddingVertical: 4,
    paddingRight: SPACING.sm,
  },
  pill: {
    width: PILL_WIDTH,
    height: 76,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: PILL_GAP,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  weekdayLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
