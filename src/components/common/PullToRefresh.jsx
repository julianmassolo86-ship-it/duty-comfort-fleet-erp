/**
 * Legacy compatibility shim.
 * Pull-to-refresh logic has been consolidated into PageWrapper.
 * This component is kept as a passthrough so any remaining
 * direct consumers don't break.
 */
export default function PullToRefresh({ children }) {
  return <>{children}</>;
}