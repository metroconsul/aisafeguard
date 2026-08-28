import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { canManageRestaurant } from "@/lib/product-access";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";
import { DEFAULT_BRAND } from "@/restaurant/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function RestaurantConfiguracoes() {
  const { perfil } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { settings, loading } = useRestaurantSettings();
  const empresaId = perfil?.empresa_id;
  const podeEditar = canManageRestaurant(perfil?.role);

  const [form, setForm] = useState({
    brand_name: DEFAULT_BRAND.BRAND_NAME,
    portal_brand_name: DEFAULT_BRAND.PORTAL_BRAND_NAME,
    brand_logo_url: "",
    primary_color: DEFAULT_BRAND.PRIMARY_COLOR,
    accent_color: DEFAULT_BRAND.ACCENT_COLOR,
    carga_semanal_max_horas: 44,
    intervalo_minimo_horas: 11,
    permite_troca_turno: true,
    exige_ciencia_escala: true,
    origem_regra: "configuracao_empresa",
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      brand_name: settings.brand_name,
      portal_brand_name: settings.portal_brand_name,
      brand_logo_url: settings.brand_logo_url ?? "",
      primary_color: settings.primary_color,
      accent_color: settings.accent_color,
      carga_semanal_max_horas: Number(settings.carga_semanal_max_horas),
      intervalo_minimo_horas: Number(settings.intervalo_minimo_horas),
      permite_troca_turno: settings.permite_troca_turno,
      exige_ciencia_escala: settings.exige_ciencia_escala,
      origem_regra: settings.origem_regra,
    });
  }, [settings]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!empresaId) return;
      const payload = {
        empresa_id: empresaId,
        ...form,
        brand_logo_url: form.brand_logo_url.trim() || null,
      };
      const { error } = await supabase
        .from("restaurant_product_settings")
        .upsert(payload, { onConflict: "empresa_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurant-settings", empresaId] });
      toast({ title: "Configurações salvas" });
    },
    onError: (e: Error) =>
      toast({ title: "Não foi possível salvar", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Configurações do produto</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Marca, limites de jornada e regras de operação — tudo por empresa. Nada aqui afeta os módulos
          industriais do Ava Safeguard.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identidade</CardTitle>
          <CardDescription>
            O nome definitivo do produto ainda pode mudar: estes campos são o placeholder configurável.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nome do produto</Label>
            <Input value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} disabled={!podeEditar} />
          </div>
          <div className="space-y-1.5">
            <Label>Nome no portal do colaborador</Label>
            <Input value={form.portal_brand_name} onChange={(e) => setForm({ ...form, portal_brand_name: e.target.value })} disabled={!podeEditar} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>URL do logo</Label>
            <Input value={form.brand_logo_url} onChange={(e) => setForm({ ...form, brand_logo_url: e.target.value })} placeholder="https://…" disabled={!podeEditar} />
          </div>
          <div className="space-y-1.5">
            <Label>Cor primária</Label>
            <Input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-24 p-1" disabled={!podeEditar} />
          </div>
          <div className="space-y-1.5">
            <Label>Cor de destaque</Label>
            <Input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="h-10 w-24 p-1" disabled={!podeEditar} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Limites de jornada</CardTitle>
          <CardDescription>
            Parâmetros usados para gerar alertas operacionais. Não são conclusões jurídicas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Carga semanal máxima (h)</Label>
            <Input
              type="number"
              min={1}
              value={form.carga_semanal_max_horas}
              onChange={(e) => setForm({ ...form, carga_semanal_max_horas: Number(e.target.value) })}
              disabled={!podeEditar}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Intervalo mínimo entre jornadas (h)</Label>
            <Input
              type="number"
              min={0}
              value={form.intervalo_minimo_horas}
              onChange={(e) => setForm({ ...form, intervalo_minimo_horas: Number(e.target.value) })}
              disabled={!podeEditar}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Origem da regra (documentada)</Label>
            <Input value={form.origem_regra} onChange={(e) => setForm({ ...form, origem_regra: e.target.value })} disabled={!podeEditar} />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={form.permite_troca_turno} onCheckedChange={(v) => setForm({ ...form, permite_troca_turno: v })} disabled={!podeEditar} />
            Permitir solicitação de troca de turno pelo colaborador
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={form.exige_ciencia_escala} onCheckedChange={(v) => setForm({ ...form, exige_ciencia_escala: v })} disabled={!podeEditar} />
            Registrar ciência da escala no portal
          </label>
        </CardContent>
      </Card>

      {podeEditar && (
        <Button onClick={() => salvar.mutate()} disabled={salvar.isPending || loading}>
          {salvar.isPending ? "Salvando…" : "Salvar configurações"}
        </Button>
      )}
    </div>
  );
}
