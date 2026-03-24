/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SafeGuard"

interface AssinaturaConfirmadaProps {
  funcionarioNome?: string
  documentoTitulo?: string
  dataAssinatura?: string
}

const AssinaturaConfirmadaEmail = ({ funcionarioNome, documentoTitulo, dataAssinatura }: AssinaturaConfirmadaProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Assinatura confirmada — {documentoTitulo || 'documento'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Assinatura Confirmada ✓</Heading>
        <Text style={text}>
          {funcionarioNome ? `O funcionário ${funcionarioNome}` : 'Um funcionário'} assinou
          o documento <strong>"{documentoTitulo || 'documento'}"</strong> em {dataAssinatura || 'hoje'}.
        </Text>
        <Text style={text}>
          O registro de auditoria com IP e dispositivo foi salvo automaticamente para validade jurídica.
        </Text>
        <Text style={footer}>
          Este é um e-mail automático do {SITE_NAME}. Acesse o painel para mais detalhes.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AssinaturaConfirmadaEmail,
  subject: (data: Record<string, any>) => `Assinatura confirmada: ${data.documentoTitulo || 'documento'}`,
  displayName: 'Confirmação de assinatura de documento',
  previewData: { funcionarioNome: 'João Silva', documentoTitulo: 'Holerite 03/2026', dataAssinatura: '24/03/2026 às 19:30' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#020817', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.5', margin: '0 0 25px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
