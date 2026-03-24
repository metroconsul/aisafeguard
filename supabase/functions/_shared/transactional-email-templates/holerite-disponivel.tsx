/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SafeGuard"

interface HoleriteDisponivelProps {
  funcionarioNome?: string
  mesAno?: string
  portalUrl?: string
}

const HoleriteDisponivelEmail = ({ funcionarioNome, mesAno, portalUrl }: HoleriteDisponivelProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu holerite de {mesAno || 'referência'} está disponível</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Holerite Disponível</Heading>
        <Text style={text}>
          {funcionarioNome ? `Olá, ${funcionarioNome}!` : 'Olá!'}
        </Text>
        <Text style={text}>
          Seu holerite referente a <strong>{mesAno || 'este mês'}</strong> já está disponível
          para visualização e assinatura no Portal do Colaborador.
        </Text>
        <Button style={button} href={portalUrl || '#'}>
          Acessar Portal e Assinar
        </Button>
        <Text style={footer}>
          Este é um e-mail automático do {SITE_NAME}. Caso tenha dúvidas, procure o RH da sua empresa.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: HoleriteDisponivelEmail,
  subject: (data: Record<string, any>) => `Holerite de ${data.mesAno || 'referência'} disponível`,
  displayName: 'Notificação de holerite disponível',
  previewData: { funcionarioNome: 'João Silva', mesAno: '03/2026', portalUrl: 'https://episafe.com/portal' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#020817', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.5', margin: '0 0 25px' }
const button = {
  backgroundColor: 'hsl(239, 84%, 67%)',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '0.75rem',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
