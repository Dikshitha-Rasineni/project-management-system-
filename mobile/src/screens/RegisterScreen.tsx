import { Link } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/Button';
import { Notice } from '../components/Notice';
import { TextField } from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { ApiError, errorMessage } from '../services/api';
import { colors } from '../theme';
import { hasErrors, validateRegister, type Errors } from '../utils/validation';

type Field = 'fullName' | 'email' | 'password' | 'confirm';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [v, setV] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: Field) => (text: string) => setV((s) => ({ ...s, [k]: text }));

  const submit = async () => {
    const e = validateRegister(v);
    setErrors(e);
    setFormError(null);
    if (hasErrors(e)) return;
    setBusy(true);
    try {
      await register(v.fullName.trim(), v.email.trim().toLowerCase(), v.password);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.length) {
        setErrors(Object.fromEntries(err.fieldErrors.map((f) => [f.field, f.message])));
      }
      setFormError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="One account for the web app and this app."
      footer={
        <>
          <Text style={{ color: colors.inkSoft }}>Already have an account? </Text>
          <Link href="/login" replace style={{ color: colors.action, fontWeight: '600' }}>
            Log in
          </Link>
        </>
      }
    >
      <Notice message={formError} />
      <TextField label="Full name" value={v.fullName} onChangeText={set('fullName')} error={errors.fullName} autoComplete="name" />
      <TextField
        label="Email"
        value={v.email}
        onChangeText={set('email')}
        error={errors.email}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextField
        label="Password"
        value={v.password}
        onChangeText={set('password')}
        error={errors.password}
        hint="At least 8 characters, with a letter and a number"
        secureTextEntry
        autoComplete="new-password"
      />
      <TextField
        label="Confirm password"
        value={v.confirm}
        onChangeText={set('confirm')}
        error={errors.confirm}
        secureTextEntry
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <Button title="Create account" onPress={submit} loading={busy} style={{ marginTop: 8 }} />
    </AuthShell>
  );
}
