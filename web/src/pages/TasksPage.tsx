import { TaskBoard } from '../components/TaskBoard';
import { PageHeader } from '../layouts/AppLayout';

export function TasksPage() {
  return (
    <>
      <PageHeader title="All tasks" subtitle="Every task across your projects." />
      <TaskBoard pageSize={25} />
    </>
  );
}
