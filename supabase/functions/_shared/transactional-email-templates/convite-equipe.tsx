/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SafeGuard"

interface ConviteEquipeProps {
  nome?: string
  email?: string
  senha?: string
  cargo?: string
  empresaNome?: string
  loginUrl?: string
}

const ConviteEquipeEmail = ({ nome, email, senha, cargo, empresaNome, loginUrl }: ConviteEquipeProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidado para acessar o {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bem-vindo ao {SITE_NAME}! 🛡️</Heading>
        <Text style={text}>
          Olá{nome ? `, ${nome}` : ''}!
        </Text>
        <Text style={text}>
          Você foi convidado para fazer parte da equipe
          {empresaNome ? ` da empresa <strong>${empresaNome}</strong>` : ''} no {SITE_NAME} como <strong>{cargo || 'Membro'}</strong>.
        </Text>
        <Hr style={hr} />
        <Section style={credentialsBox}>
          <Text style={credentialsTitle}>Seus dados de acesso:</Text>
          <Text style={credentialItem}>📧 <strong>E-mail:</strong> {email || '—'}</Text>
          {senha ? (
            <Text style={credentialItem}>🔑 <strong>Senha temporária:</strong> {senha}</Text>
          ) : (
            <Text style={credentialItem}>🔑 Use sua senha atual para fazer login.</Text>
          )}
        </Section>
        {senha && (
          <Text style={warningText}>
            ⚠️ Por segurança, recomendamos que você altere sua senha no primeiro acesso.
          </Text>
        )}
        <Section style={buttonSection}>
          <Button style={button} href={loginUrl || '#'}>
            Acessar o Painel
          </Button>
        </Section>
        <Text style={footer}>
          Se você não esperava este convite, ignore este e-mail.
        </Text>
        <Text style={footer}>
          Equipe {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ConviteEquipeEmail,
  subject: (data: Record<string, any>) => `Você foi convidado para o ${SITE_NAME}${data.empresaNome ? ` — ${data.empresaNome}` : ''}`,
  displayName: 'Convite de equipe',
  previewData: {
    nome: 'João Silva',
    email: 'joao@empresa.com',
    senha: 'abc123temp',
    cargo: 'Técnico de Segurança',
    empresaNome: 'Empresa Exemplo',
    loginUrl: 'https://wear-and-sign.lovable.app/login',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '28px 32px', maxWidth: '520px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const credentialsBox = { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const credentialsTitle = { fontSize: '14px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 8px' }
const credentialItem = { fontSize: '14px', color: '#333333', margin: '0 0 6px', lineHeight: '1.5' }
const warningText = { fontSize: '13px', color: '#b45309', backgroundColor: '#fef3c7', padding: '10px 14px', borderRadius: '6px', margin: '0 0 20px' }
const buttonSection = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: '#7c3aed', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0' }
