import { useAuth } from "@/contexts/AuthContext";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { TecnicoDashboard } from "@/components/dashboards/TecnicoDashboard";
import { RHDashboard } from "@/components/dashboards/RHDashboard";
import { AlmoxarifadoDashboard } from "@/components/dashboards/AlmoxarifadoDashboard";

export default function Dashboard() {
  const { perfil } = useAuth();
  const role = perfil?.role;

  switch (role) {
    case "tecnico_seguranca":
      return <TecnicoDashboard />;
    case "rh":
      return <RHDashboard />;
    case "almoxarifado":
      return <AlmoxarifadoDashboard />;
    case "admin":
    default:
      return <AdminDashboard />;
  }
}
