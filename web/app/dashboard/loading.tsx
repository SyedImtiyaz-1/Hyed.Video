import { LoaderCircle } from "lucide-react";

/**
 * While a dashboard page is on its way: the page area answers at once, as an app's does, instead of keeping the last
 * page up until the next one arrives (the sidebar has already lit the page clicked).
 */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-gray-900" role="status" aria-label="Loading">
      <LoaderCircle className="size-5 animate-spin" />
    </div>
  );
}
