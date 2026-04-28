import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
  autoNavigate?: {
    to: string;
    delay?: number;
    ifAuthenticated?: string;
  };
}

export function Layout({ children, autoNavigate }: LayoutProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, isDriver, isAdmin } = useAuth();

  useEffect(() => {
    if (!autoNavigate || isLoading) return;

    const timer = setTimeout(() => {
      if (autoNavigate.ifAuthenticated && isAuthenticated) {
        if (isAdmin) navigate("/admin/dashboard");
        else if (isDriver) navigate("/driver");
        else navigate(autoNavigate.ifAuthenticated);
      } else {
        navigate(autoNavigate.to);
      }
    }, autoNavigate.delay || 2000);

    return () => clearTimeout(timer);
  }, [autoNavigate, navigate, isAuthenticated, isLoading, isAdmin, isDriver]);

  return <div className="h-full w-full">{children}</div>;
}
