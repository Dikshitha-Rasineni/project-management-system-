import { Link } from 'react-router-dom';
import { buttonClass } from '../components/ui/Button';
import { EmptyState } from '../components/ui/States';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24">
      <EmptyState
        title="Page not found"
        description="The address may be mistyped, or the page has moved."
        action={
          <Link to="/" className={buttonClass('secondary')}>
            Go to dashboard
          </Link>
        }
      />
    </div>
  );
}
