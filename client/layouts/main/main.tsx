import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: LayoutProps) => {
  return <>{children}</>;
};
