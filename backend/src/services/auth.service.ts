import bcrypt from 'bcryptjs';
import { Prisma } from '../generated/prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { signAccessToken } from '../utils/jwt';
import { serializeUser } from '../utils/serializers';
import type { LoginInput, RegisterInput } from '../validators/auth.validators';

/**
 * A real bcrypt hash of a random string. Comparing against it when the email
 * is unknown makes "no such user" take as long as "wrong password", so
 * response timing cannot be used to discover registered emails.
 */
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 10);

function buildSession(user: { id: string; fullName: string; email: string; createdAt: Date }) {
  const { token, expiresAt } = signAccessToken(user.id);
  return { token, expiresAt: expiresAt.toISOString(), user: serializeUser(user) };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw AppError.conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: { fullName: input.fullName, email: input.email, passwordHash },
    });
    return buildSession(user);
  } catch (err) {
    // Two simultaneous registrations can both pass the check above; the
    // unique index is the real guarantee.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw AppError.conflict('An account with this email already exists');
    }
    throw err;
  }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordOk = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !passwordOk) {
    // Same message for both cases — never reveal which part was wrong.
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }
  return buildSession(user);
}

/** Revokes the current token so it cannot be reused after logout. */
export async function logout(jti: string, exp: number) {
  await prisma.revokedToken.upsert({
    where: { jti },
    create: { jti, expiresAt: new Date(exp * 1000) },
    update: {},
  });
  // Housekeeping: tokens past their expiry no longer need to be denylisted.
  await prisma.revokedToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.unauthorized('Account no longer exists', 'TOKEN_INVALID');
  return serializeUser(user);
}
