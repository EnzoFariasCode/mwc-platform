    import LandingLayout from '@/layouts/LandingLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LandingLayout>
      {children}
    </LandingLayout>
  );
}