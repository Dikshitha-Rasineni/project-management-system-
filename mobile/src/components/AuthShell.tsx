import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

function LogoMark() {
  return (
    <View style={styles.logo} accessibilityLabel="Tasklane">
      <View style={[styles.logoBar, { width: 22, backgroundColor: '#2952CC' }]} />
      <View style={[styles.logoBar, { width: 15, backgroundColor: '#F2B544' }]} />
      <View style={[styles.logoBar, { width: 9, backgroundColor: '#3BAA78' }]} />
    </View>
  );
}

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <LogoMark />
            <Text style={styles.brandName}>Tasklane</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.form}>{children}</View>
          <View style={styles.footer}>{footer}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24, paddingTop: 32 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 40 },
  logo: { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.ink, padding: 7, gap: 3, justifyContent: 'center' },
  logoBar: { height: 4, borderRadius: 2 },
  brandName: { fontSize: 18, fontWeight: '700', color: colors.ink },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, color: colors.inkSoft, marginTop: 6 },
  form: { marginTop: 28, gap: 16 },
  footer: { marginTop: 24, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
});
