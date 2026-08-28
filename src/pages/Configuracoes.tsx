import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Building2, Upload, Loader2 } from "lucide-react";

export default function Configuracoes() {
  const { user, perfil, loading: authLoading, refreshEmpresa, empresa } = useAuth();
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadEmpresa = useCallback(async () => {
    if (authLoading) return;

    if (!user || !perfil?.empresa_id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("empresas")
      .select("nome_fantasia, cnpj, logo_url")
      .eq("id", perfil.empresa_id)
      .maybeSingle();

    if (error) {
      toast.error("Erro ao carregar dados da empresa");
      setLoading(false);
      return;
    }

    if (!data) {
      setNomeFantasia(empresa?.nome_fantasia ?? "");
      setLogoUrl(empresa?.logo_url ?? null);
      setCnpj("");
      setLoading(false);
      return;
    }

    setNomeFantasia(data.nome_fantasia);
    setCnpj(data.cnpj);
    setLogoUrl((data as any).logo_url ?? null);
    setLoading(false);
  }, [authLoading, user, perfil?.empresa_id, empresa?.nome_fantasia, empresa?.logo_url]);

  useEffect(() => {
    void loadEmpresa();
  }, [loadEmpresa]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setLogoFile(file);
  };

  const handleSave = async () => {
    if (!user || !perfil?.empresa_id) {
      toast.error("Sessão inválida. Faça login novamente.");
      return;
    }
    setSaving(true);
    let finalLogoUrl = logoUrl;

    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${perfil.empresa_id}/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, logoFile, { upsert: true });

      if (uploadError) {
        toast.error("Erro ao enviar logo: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicData } = supabase.storage.from("logos").getPublicUrl(path);
      finalLogoUrl = publicData.publicUrl;
    }

    const { error } = await supabase
      .from("empresas")
      .update({ nome_fantasia: nomeFantasia, cnpj, logo_url: finalLogoUrl } as any)
      .eq("id", perfil.empresa_id);

    setSaving(false);

    if (error) {
      toast.error("Erro ao salvar alterações");
    } else {
      setLogoUrl(finalLogoUrl);
      setLogoFile(null);
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
      refreshEmpresa();
      toast.success("Dados da empresa atualizados!");
    }
  };

  const displayImage = previewUrl || logoUrl;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[980px] space-y-6">
      <div><p className="app-eyebrow">Administração do workspace</p><h1 className="mt-1 text-[27px] font-bold tracking-tight text-foreground">Configurações</h1><p className="mt-2 text-sm text-muted-foreground">Gerencie os dados que aparecem nos documentos e relatórios.</p></div>

      <Card>
        <CardHeader className="px-4 sm:px-6"><p className="app-eyebrow">Identidade da empresa</p>
          <CardTitle className="mt-1 flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5 text-primary" />
            Dados da Empresa
          </CardTitle>
          <CardDescription>Informações visíveis nos documentos e relatórios gerados pelo sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-4 sm:px-6">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo da Empresa</Label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                {displayImage ? (
                  <img src={displayImage} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" />
                Enviar Logo
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
            <Input id="nome_fantasia" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardContent>
      </Card>

      <PoliticaEpiCard />
    </div>

  );
}
