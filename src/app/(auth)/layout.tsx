export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-surface-primary">
      {/* Background grid effect */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(196,154,34,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(196,154,34,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      {/* Radial glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-3xl" />
      <div className="relative z-10 w-full max-w-2xl">{children}</div>
    </div>
  );
}
