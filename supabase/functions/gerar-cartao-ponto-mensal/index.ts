import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import autoTable from "https://esm.sh/jspdf-autotable@3.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TIPO_ORDER = ["entrada", "saida_almoco", "volta_almoco", "saida"];

interface DayBatidas {
  entrada?: string;
  saida_almoco?: string;
  volta_almoco?: string;
  saida?: string;
}

function parseHM(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function fmtHHMM(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function diffMinutes(a?: string, b?: string): number {
  if (!a || !b) return 0;
  const am = parseHM(a)!;
  const bm = parseHM(b)!;
  return Math.max(0, bm - am);
}

function minutesToHHMM(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

const DIA_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { empresa_id, mes, ano, funcionario_ids } = await req.json();
    if (!empresa_id || !mes || !ano) {
      return new Response(
        JSON.stringify({ error: "empresa_id, mes e ano são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: empresa } = await supabase
      .from("empresas")
      .select("id, nome_fantasia, cnpj")
      .eq("id", empresa_id)
      .maybeSingle();

    const monthNum = Number(mes);
    const yearNum = Number(ano);
    const refPeriod = `${String(monthNum).padStart(2, "0")}/${yearNum}`;
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);
    const daysInMonth = endDate.getDate();

    // Query batidas
    let entriesQuery = supabase
      .from("time_entries")
      .select("funcionario_id, tipo, recorded_at")
      .eq("empresa_id", empresa_id)
      .gte("recorded_at", startDate.toISOString())
      .lte("recorded_at", endDate.toISOString())
      .order("recorded_at", { ascending: true });

    if (funcionario_ids?.length) {
      entriesQuery = entriesQuery.in("funcionario_id", funcionario_ids);
    }

    const { data: entries, error: entriesErr } = await entriesQuery;
    if (entriesErr) throw entriesErr;

    // Agrupa funcionários
    const funcIds = Array.from(
      new Set((entries || []).map((e: any) => e.funcionario_id))
    );

    if (funcIds.length === 0) {
      return new Response(
        JSON.stringify({ gerados: 0, erros: [], mensagem: "Sem batidas no período" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: funcs } = await supabase
      .from("funcionarios")
      .select("id, nome, matricula, cargo, setor")
      .in("id", funcIds);

    const gerados: string[] = [];
    const erros: { funcionario_id: string; erro: string }[] = [];

    for (const func of funcs || []) {
      try {
        // Agrupa batidas por dia
        const byDay = new Map<string, DayBatidas>();
        for (const e of entries || []) {
          if (e.funcionario_id !== func.id) continue;
          const d = new Date(e.recorded_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const day = byDay.get(key) || {};
          if (TIPO_ORDER.includes(e.tipo) && !(day as any)[e.tipo]) {
            (day as any)[e.tipo] = e.recorded_at;
          }
          byDay.set(key, day);
        }

        // Linhas da tabela
        const rows: any[] = [];
        let totalMin = 0;
        let totalAtrasos = 0;
        let totalHE = 0;
        let totalFaltas = 0;

        for (let d = 1; d <= daysInMonth; d++) {
          const date = new Date(yearNum, monthNum - 1, d);
          const key = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const day = byDay.get(key) || {};
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          const minWorked =
            diffMinutes(day.entrada, day.saida_almoco) +
            diffMinutes(day.volta_almoco, day.saida);
          totalMin += minWorked;

          // Atraso (entrada > 08:15)
          let obs: string[] = [];
          if (day.entrada) {
            const m = parseHM(day.entrada)!;
            if (m > 8 * 60 + 15) {
              const atrasoMin = m - 8 * 60;
              totalAtrasos += atrasoMin;
              obs.push(`Atraso ${atrasoMin}min`);
            }
          }
          if (day.saida) {
            const m = parseHM(day.saida)!;
            if (m > 18 * 60 + 30) {
              const heMin = m - 18 * 60;
              totalHE += heMin;
              obs.push(`HE ${heMin}min`);
            }
          }
          if (isWeekend && (day.entrada || day.saida)) {
            obs.push("Fim de semana");
          }
          if (!isWeekend && !day.entrada && !day.saida) {
            totalFaltas++;
            obs.push("Falta");
          }

          rows.push([
            String(d).padStart(2, "0") + "/" + String(monthNum).padStart(2, "0"),
            DIA_SEMANA[date.getDay()],
            fmtHHMM(day.entrada),
            fmtHHMM(day.saida_almoco),
            fmtHHMM(day.volta_almoco),
            fmtHHMM(day.saida),
            minWorked > 0 ? minutesToHHMM(minWorked) : "—",
            obs.join(", "),
          ]);
        }

        // PDF
        const pdf = new jsPDF({ unit: "pt", format: "a4" });
        const pageW = pdf.internal.pageSize.getWidth();

        // Cabeçalho
        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, 0, pageW, 80, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("CARTÃO DE PONTO", 40, 32);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Referência: ${refPeriod}`, 40, 52);
        pdf.setFontSize(9);
        pdf.text(empresa?.nome_fantasia || "Empresa", pageW - 40, 32, { align: "right" });
        if (empresa?.cnpj) pdf.text(`CNPJ: ${empresa.cnpj}`, pageW - 40, 48, { align: "right" });

        // Dados funcionário
        pdf.setTextColor(15, 23, 42);
        pdf.setFontSize(10);
        let y = 105;
        pdf.setFont("helvetica", "bold");
        pdf.text("Funcionário:", 40, y);
        pdf.setFont("helvetica", "normal");
        pdf.text(func.nome, 120, y);
        pdf.setFont("helvetica", "bold");
        pdf.text("Matrícula:", 320, y);
        pdf.setFont("helvetica", "normal");
        pdf.text(func.matricula || "—", 380, y);
        y += 16;
        pdf.setFont("helvetica", "bold");
        pdf.text("Cargo:", 40, y);
        pdf.setFont("helvetica", "normal");
        pdf.text(func.cargo || "—", 120, y);
        pdf.setFont("helvetica", "bold");
        pdf.text("Setor:", 320, y);
        pdf.setFont("helvetica", "normal");
        pdf.text(func.setor || "—", 380, y);

        // Tabela
        autoTable(pdf, {
          head: [["Data", "Dia", "Entrada", "Saída Alm.", "Volta Alm.", "Saída", "Horas", "Observações"]],
          body: rows,
          startY: y + 18,
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [15, 23, 42], textColor: 255 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 30 },
            7: { cellWidth: "auto", fontSize: 7 },
          },
        });

        // Resumo
        const finalY = (pdf as any).lastAutoTable.finalY + 16;
        pdf.setFillColor(241, 245, 249);
        pdf.rect(40, finalY, pageW - 80, 60, "F");
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text("RESUMO DO MÊS", 50, finalY + 16);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(`Total trabalhado: ${minutesToHHMM(totalMin)}`, 50, finalY + 34);
        pdf.text(`Atrasos: ${minutesToHHMM(totalAtrasos)}`, 220, finalY + 34);
        pdf.text(`Horas extras: ${minutesToHHMM(totalHE)}`, 50, finalY + 50);
        pdf.text(`Faltas: ${totalFaltas}`, 220, finalY + 50);

        // Assinatura
        const sigY = finalY + 110;
        pdf.setDrawColor(100);
        pdf.line(80, sigY, pageW - 80, sigY);
        pdf.setFontSize(9);
        pdf.text(func.nome, pageW / 2, sigY + 14, { align: "center" });
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text(
          'Declaro que as marcações acima conferem com minha jornada de trabalho.',
          pageW / 2,
          sigY + 28,
          { align: "center" }
        );

        const pdfBytes = pdf.output("arraybuffer");
        const path = `${empresa_id}/${func.id}/cartao-ponto-${yearNum}-${String(monthNum).padStart(2, "0")}.pdf`;

        const { error: uploadErr } = await supabase.storage
          .from("employee_vault")
          .upload(path, new Uint8Array(pdfBytes), {
            contentType: "application/pdf",
            upsert: true,
          });
        if (uploadErr) throw uploadErr;

        const { data: pub } = supabase.storage.from("employee_vault").getPublicUrl(path);

        // Remove cartão antigo do mesmo período (evita duplicatas)
        await supabase
          .from("documents")
          .delete()
          .eq("empresa_id", empresa_id)
          .eq("funcionario_id", func.id)
          .eq("doc_category", "cartao_ponto")
          .eq("reference_period", refPeriod)
          .neq("signature_status", "assinado");

        const { error: docErr } = await supabase.from("documents").insert({
          empresa_id,
          funcionario_id: func.id,
          title: `Cartão de Ponto — ${refPeriod}`,
          doc_category: "cartao_ponto",
          signature_status: "pendente",
          reference_period: refPeriod,
          file_url: pub.publicUrl,
        });
        if (docErr) throw docErr;

        gerados.push(func.id);
      } catch (err: any) {
        erros.push({ funcionario_id: func.id, erro: err.message });
      }
    }

    return new Response(
      JSON.stringify({ gerados: gerados.length, erros, total: funcs?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
