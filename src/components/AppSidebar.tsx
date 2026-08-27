import {
  LayoutDashboard,
  PackagePlus,
  Users,
  HardHat,
  Building2,
  Settings,
  ShieldCheck,
  ChevronUp,
  FolderLock,
  GraduationCap,
  FileText,
  UserPlus,
  Clock,
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
  { title: "Holerites", url: "/app/holerites", icon: FileText },
  { title: "Cartão de Ponto", url: "/app/pontos", icon: Clock },
  { title: "Admissões", url: "/app/admissoes", icon: UserPlus },
];

const cadastroItems = [
  { title: "Funcionários", url: "/app/funcionarios", icon: Users },
  { title: "EPIs", url: "/app/epis", icon: HardHat },
  { title: "Treinamentos (NRs)", url: "/app/treinamentos", icon: GraduationCap },
  { title: "Setores", url: "/app/setores", icon: Building2 },
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
  const visibleSupport = filterMenuItems(role, supportItems);

  const renderGroup = (label: string, items: typeof generalItems) => {
    if (items.length === 0) return null;
    return (
      <SidebarGroup className="px-0">
        {!collapsed && (
          <SidebarGroupLabel className="mb-1 mt-4 px-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
            {label}
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu className={collapsed ? "gap-1" : "gap-0.5"}>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <NavLink
                    to={item.url}
                    end={item.url === "/app"}
                    className={[
                      "h-10 rounded-lg border-l-2 border-transparent text-sm font-medium text-white/60 transition-all duration-150 hover:bg-white/[0.08] hover:text-white",
                      collapsed ? "mx-1 justify-center px-0" : "mx-3 px-3",
                    ].join(" ")}
                    activeClassName="border-l-secondary-400 bg-white/[0.14] font-semibold text-white shadow-inner-glow backdrop-blur-sm hover:bg-white/[0.18] hover:text-white [&_svg]:opacity-100"
                  >
                    <item.icon className={collapsed ? "h-5 w-5 opacity-90" : "mr-3 h-[18px] w-[18px] opacity-70"} strokeWidth={1.8} />
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
    <Sidebar collapsible="icon" className="border-r border-white/[0.08] bg-primary-500 [&>div]:bg-primary-500">
      <SidebarContent className="bg-primary-500 pt-4">
        {/* Logo */}
        <div className={["flex items-center pb-2", collapsed ? "justify-center px-2" : "gap-2.5 px-4"].join(" ")}>
          <div className={[
            "flex shrink-0 items-center justify-center rounded-lg bg-white/[0.12] ring-1 ring-white/15",
            collapsed ? "h-10 w-10" : "h-9 w-9",
          ].join(" ")}>
            <ShieldCheck className={collapsed ? "h-6 w-6 text-white" : "h-5 w-5 text-white"} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[17px] font-bold tracking-tight text-white">Ava Safeguard</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-white/40">Gestão Industrial</p>
            </div>
          )}
        </div>

        {renderGroup("Geral", visibleGeneral)}
        {renderGroup("Cadastros", visibleCadastro)}
        {renderGroup("Suporte", visibleSupport)}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/[0.08] bg-primary-500 p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <Avatar className="h-9 w-9 rounded-full border-2 border-secondary-400/40">
              {empresa?.logo_url ? (
                <AvatarImage src={empresa.logo_url} alt="Logo" className="object-contain" />
              ) : null}
              <AvatarFallback className="rounded-full bg-white/10">
                <Building2 className="h-5 w-5 text-white" strokeWidth={1.5} />
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
            <Avatar className="h-8 w-8 rounded-full border-2 border-secondary-400/40">
              {empresa?.logo_url ? (
                <AvatarImage src={empresa.logo_url} alt="Logo" className="object-contain" />
              ) : null}
              <AvatarFallback className="rounded-full bg-white/10">
                <Building2 className="h-4 w-4 text-white" strokeWidth={1.5} />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{empresa?.nome_fantasia || "Equipe"}</p>
              <p className="truncate text-[11px] text-white/50">Seg. do Trabalho</p>
            </div>
            <ChevronUp className="h-4 w-4 text-white/40" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
