import {
  LayoutDashboard,
  PackagePlus,
  Users,
  HardHat,
  Building2,
  Settings,
  ShieldCheck,
  ChevronUp,
  MessageCircle,
  FolderLock,
  GraduationCap,
  FileText,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { filterMenuItems } from "@/lib/role-access";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const generalItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Nova Entrega", url: "/app/nova-entrega", icon: PackagePlus },
  { title: "Cofre da Empresa", url: "/app/documentos", icon: FolderLock },
];

const cadastroItems = [
  { title: "Funcionários", url: "/app/funcionarios", icon: Users },
  { title: "EPIs", url: "/app/epis", icon: HardHat },
  { title: "Treinamentos (NRs)", url: "/app/treinamentos", icon: GraduationCap },
  { title: "Setores", url: "/app/setores", icon: Building2 },
];

const integrationItems = [
  { title: "WhatsApp", url: "/app/integracoes", icon: MessageCircle },
];

const supportItems = [
  { title: "Configurações", url: "/app/configuracoes", icon: Settings },
  { title: "Equipe", url: "/app/equipe", icon: Users },
  { title: "Segurança", url: "/app/seguranca", icon: ShieldCheck },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { empresa, perfil } = useAuth();
  const collapsed = state === "collapsed";
  const role = perfil?.role;

  const visibleGeneral = filterMenuItems(role, generalItems);
  const visibleCadastro = filterMenuItems(role, cadastroItems);
  const visibleIntegration = filterMenuItems(role, integrationItems);
  const visibleSupport = filterMenuItems(role, supportItems);

  const renderGroup = (label: string, items: typeof generalItems) => {
    if (items.length === 0) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    end={item.url === "/app"}
                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    activeClassName="bg-primary/10 text-primary font-medium"
                  >
                    <item.icon className="mr-2 h-4 w-4" strokeWidth={1.5} />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 pb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <ShieldCheck className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight text-foreground">
              SafeGuard
            </span>
          )}
        </div>

        {renderGroup("Geral", visibleGeneral)}
        {renderGroup("Cadastros", visibleCadastro)}
        {renderGroup("Integrações", visibleIntegration)}
        {renderGroup("Suporte", visibleSupport)}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="flex items-center gap-2 rounded-lg bg-accent p-2">
            <Avatar className="h-8 w-8 rounded-md">
              {empresa?.logo_url ? (
                <AvatarImage src={empresa.logo_url} alt="Logo" className="object-contain" />
              ) : null}
              <AvatarFallback className="rounded-md bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {empresa?.nome_fantasia || "Equipe"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">Seg. do Trabalho</p>
            </div>
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
