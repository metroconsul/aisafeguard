import { Navigate, Outlet } from "react-router-dom";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { BottomTabBar } from "./BottomTabBar";
import { Loader2 } from "lucide-react";

export function PortalLayout() {
  const { employee, loading } = usePortalAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) {
    return <Navigate to="/portal/login" replace />;
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <div className="pb-20">
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  );
}
