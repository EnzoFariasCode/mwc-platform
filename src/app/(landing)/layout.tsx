import { ReactNode } from "react";
import LandingLayoutComponent from "@/layouts/LandingLayout";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <LandingLayoutComponent>{children}</LandingLayoutComponent>;
}
