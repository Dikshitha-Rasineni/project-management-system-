import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from '../theme';

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={colors.inkMute} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMute}
        style={styles.searchInput}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        maxLength={100}
        accessibilityLabel={placeholder}
      />
      {value ? (
        <Pressable onPress={() => onChange('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={18} color={colors.inkMute} />
        </Pressable>
      ) : null}
    </View>
  );
}

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

/** A horizontally scrolling single-select chip row ("All" + options). */
export function ChipRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | '';
  options: ChipOption<T>[];
  onChange: (v: T | '') => void;
}) {
  const all: ChipOption<T | ''>[] = [{ value: '', label: 'All' }, ...options];
  return (
    <View style={styles.chipRowWrap}>
      <Text style={styles.chipLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} accessibilityRole="radiogroup">
        {all.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value || 'all'}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Full-width segmented control for forms (status / priority). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: ChipOption<T>[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.segLabel}>{label}</Text>
      <View style={styles.seg} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[styles.segItem, active && styles.segItemActive]}
            >
              <Text style={[styles.segText, active && styles.segTextActive]} numberOfLines={1}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.ink, paddingVertical: 0 },
  chipRowWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipLabel: { fontSize: 12, color: colors.inkMute, width: 52 },
  chipRow: { gap: 6, paddingRight: 16 },
  chip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.inkSoft },
  chipTextActive: { color: colors.white },
  segLabel: { fontSize: 13, fontWeight: '600', color: colors.ink },
  seg: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  segItem: { flex: 1, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segItemActive: { backgroundColor: colors.ink },
  segText: { fontSize: 14, fontWeight: '500', color: colors.inkSoft },
  segTextActive: { color: colors.white },
});
