import { useNavigate } from "react-router";
import { useEffect } from "react";

interface LayoutProps {
  children: React.ReactNode;
  autoNavigate?: {
    to: string;
    delay?: number;
  };
}

export function Layout({ children, autoNavigate }: LayoutProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (autoNavigate) {
      const timer = setTimeout(() => {
        navigate(autoNavigate.to);
      }, autoNavigate.delay || 2000);

      return () => clearTimeout(timer);
    }
  }, [autoNavigate, navigate]);

  return <div className="h-full w-full">{children}</div>;
}
