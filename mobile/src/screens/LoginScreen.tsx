import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, type TextInput } from 'react-native';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/Button';
import { Notice } from '../components/Notice';
import { TextField } from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { ApiError, errorMessage } from '../services/api';
import { colors } from '../theme';
import { hasErrors, validateLogin, type Errors } from '../utils/validation';

export default function LoginScreen() {
  const { login, notice, clearNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors<'email' | 'password'>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    const e = validateLogin(email, password);
    setErrors(e);
    setFormError(null);
    if (hasErrors(e)) return;
    setBusy(true);
    clearNotice();
    try {
      await login(email.trim().toLowerCase(), password);
      // Navigation happens automatically: the protected stack becomes available.
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
      title="Log in"
      subtitle="Use the same account as on the web."
      footer={
        <>
          <Text style={{ color: colors.inkSoft }}>New here? </Text>
          <Link href="/register" replace style={{ color: colors.action, fontWeight: '600' }}>
            Create an account
          </Link>
        </>
      }
    >
      <Notice message={notice} tone="warn" />
      <Notice message={formError} />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <Button title="Log in" onPress={submit} loading={busy} style={{ marginTop: 8 }} />
    </AuthShell>
  );
}
