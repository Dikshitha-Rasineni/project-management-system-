/**
 * Seeds the database with TEST DATA ONLY (fictional names, example.com emails).
 *
 *   npm run db:seed
 *
 * Idempotent: re-running deletes and recreates the two demo accounts only.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient, type ProjectStatus, type TaskPriority, type TaskStatus } from '../src/generated/prisma/client';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const DEMO_PASSWORD = 'Demo@12345';

const day = (offset: number) => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offset));
};

interface SeedTask {
  name: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due: number | null;
}

interface SeedProject {
  name: string;
  description: string;
  status: ProjectStatus;
  start: number;
  end: number | null;
  tasks: SeedTask[];
}

const demoProjects: SeedProject[] = [
  {
    name: 'Website Redesign',
    description: 'Refresh the marketing site with a new visual identity and faster pages.',
    status: 'IN_PROGRESS',
    start: -20,
    end: 25,
    tasks: [
      { name: 'Audit current site analytics', priority: 'MEDIUM', status: 'COMPLETED', due: -12 },
      { name: 'Design new homepage wireframes', priority: 'HIGH', status: 'COMPLETED', due: -5 },
      { name: 'Build responsive navigation', priority: 'HIGH', status: 'IN_PROGRESS', due: 2 },
      { name: 'Implement login page', description: 'Email + password form with validation.', priority: 'HIGH', status: 'PENDING', due: 6 },
      { name: 'Optimise hero images', priority: 'LOW', status: 'PENDING', due: 10 },
      { name: 'Write release notes', priority: 'LOW', status: 'PENDING', due: null },
    ],
  },
  {
    name: 'Mobile App Launch',
    description: 'Prepare the Android release: store listing, QA pass and rollout plan.',
    status: 'NOT_STARTED',
    start: 5,
    end: 45,
    tasks: [
      { name: 'Draft Play Store listing', priority: 'MEDIUM', status: 'PENDING', due: 12 },
      { name: 'Run QA regression on test devices', priority: 'HIGH', status: 'PENDING', due: 20 },
      { name: 'Plan staged rollout', priority: 'MEDIUM', status: 'PENDING', due: 30 },
    ],
  },
  {
    name: 'Quarterly Report',
    description: 'Compile metrics and narrative for the quarterly review.',
    status: 'COMPLETED',
    start: -40,
    end: -3,
    tasks: [
      { name: 'Collect team metrics', priority: 'MEDIUM', status: 'COMPLETED', due: -15 },
      { name: 'Draft summary slides', priority: 'HIGH', status: 'COMPLETED', due: -7 },
      { name: 'Review with stakeholders', priority: 'MEDIUM', status: 'COMPLETED', due: -4 },
    ],
  },
  {
    name: 'Customer Support Portal',
    description: 'Self-service help centre with searchable articles and ticket tracking.',
    status: 'IN_PROGRESS',
    start: -8,
    end: 60,
    tasks: [
      { name: 'Define article categories', priority: 'LOW', status: 'COMPLETED', due: -2 },
      { name: 'Set up ticket status workflow', priority: 'HIGH', status: 'IN_PROGRESS', due: -1 },
      { name: 'Search indexing prototype', priority: 'MEDIUM', status: 'PENDING', due: 14 },
    ],
  },
];

async function createUserWithProjects(fullName: string, email: string, projects: SeedProject[]) {
  await prisma.user.deleteMany({ where: { email } }); // cascades to projects/tasks
  const user = await prisma.user.create({
    data: { fullName, email, passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12) },
  });

  for (const p of projects) {
    await prisma.project.create({
      data: {
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: day(p.start),
        endDate: p.end === null ? null : day(p.end),
        ownerId: user.id,
        tasks: {
          create: p.tasks.map((t) => ({
            name: t.name,
            description: t.description ?? null,
            priority: t.priority,
            status: t.status,
            dueDate: t.due === null ? null : day(t.due),
            completedAt: t.status === 'COMPLETED' ? new Date() : null,
          })),
        },
      },
    });
  }
  return user;
}

async function main() {
  await createUserWithProjects('Demo User', 'demo@example.com', demoProjects);
  // A second account proves isolation: neither user can see the other's data.
  await createUserWithProjects('Test Reviewer', 'reviewer@example.com', [
    {
      name: 'Private Reviewer Project',
      description: 'Should never be visible to demo@example.com.',
      status: 'IN_PROGRESS',
      start: -3,
      end: 20,
      tasks: [{ name: 'Confidential checklist', priority: 'HIGH', status: 'PENDING', due: 4 }],
    },
  ]);

  console.log('Seed complete. Test accounts (password for both: %s):', DEMO_PASSWORD);
  console.log('  demo@example.com');
  console.log('  reviewer@example.com');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
