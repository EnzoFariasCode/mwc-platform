import { HealthHeader } from "@/modules/health/components/health-header";

export default function HealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HealthHeader />
      {children}
    </>
  );
}
