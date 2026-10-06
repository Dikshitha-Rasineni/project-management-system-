import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FormAlert } from '../components/FormAlert';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { applyServerErrors } from '../hooks/useServerErrors';
import { AuthLayout } from '../layouts/AuthLayout';
import { registerSchema, type RegisterValues } from '../utils/validation';

export function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async ({ fullName, email, password }) => {
    setFormError(null);
    try {
      await registerAccount(fullName.trim(), email.trim(), password);
      toast.success('Account created');
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(applyServerErrors(err, setError, ['fullName', 'email', 'password']));
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Use it on the web and in the Android app."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-action hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormAlert message={formError} />
        <Field label="Full name" error={errors.fullName?.message}>
          {(a) => <Input {...a} autoComplete="name" autoFocus {...register('fullName')} invalid={!!errors.fullName} />}
        </Field>
        <Field label="Email" error={errors.email?.message}>
          {(a) => <Input {...a} type="email" autoComplete="email" {...register('email')} invalid={!!errors.email} />}
        </Field>
        <Field label="Password" error={errors.password?.message} hint="At least 8 characters, with a letter and a number">
          {(a) => (
            <Input {...a} type="password" autoComplete="new-password" {...register('password')} invalid={!!errors.password} />
          )}
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          {(a) => (
            <Input
              {...a}
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              invalid={!!errors.confirmPassword}
            />
          )}
        </Field>
        <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
