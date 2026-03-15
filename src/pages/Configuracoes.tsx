import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Building2, Upload, Loader2 } from "lucide-react";

export default function Configuracoes() {
  const { perfil } = useAuth();
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!perfil?.empresa_id) return;
    supabase
      .from("empresas")
      .select("nome_fantasia, cnpj, logo_url")
      .eq("id", perfil.empresa_id)
      .single()
      .then(({ data, error }) => {
        if (data) {
          setNomeFantasia(data.nome_fantasia);
          setCnpj(data.cnpj);
          setLogoUrl((data as any).logo_url ?? null);
        }
        if (error) toast.error("Erro ao carregar dados da empresa");
        setLoading(false);
      });
  }, [perfil?.empresa_id]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !perfil?.empresa_id) return;
    setUploading(true);
    const path = `${perfil.empresa_id}/logo-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error("Erro ao enviar logo");
      setUploading(false);
      return;
    }
    const { data: publicData } = supabase.storage.from("logos").getPublicUrl(path);
    setLogoUrl(publicData.publicUrl);
    setUploading(false);
    toast.success("Logo enviada com sucesso");
  };

  const handleSave = async () => {
    if (!perfil?.empresa_id) return;
    setSaving(true);
    const { error } = await supabase
      .from("empresas")
      .update({ nome_fantasia: nomeFantasia, cnpj, logo_url: logoUrl } as any)
      .eq("id", perfil.empresa_id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar alterações");
    } else {
      toast.success("Dados da empresa atualizados!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie os dados da sua empresa</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Dados da Empresa
          </CardTitle>
          <CardDescription>Informações visíveis nos documentos e relatórios gerados pelo sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo da Empresa</Label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild disabled={uploading}>
                  <span>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                    {uploading ? "Enviando..." : "Enviar Logo"}
                  </span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>

          {/* Nome Fantasia */}
          <div className="space-y-2">
            <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
            <Input id="nome_fantasia" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
          </div>

          {/* CNPJ */}
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Salvar Alterações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
