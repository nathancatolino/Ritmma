# Reforma do Painel do Médico, Validação Cadastral e Farmacovigilância

Reestruturar o Painel do Médico (`DoctorView.tsx`) para uma experiência de consulta clínica executiva em tela única, implementar fluxo de conferência cadastral profissional com envio de documento antes de liberar o aceite de pacientes, restringir bulas e moléculas exclusivamente ao médico, e introduzir marcadores discretos de correlação entre sintomas e efeitos adversos conhecidos de medicamentos.

---

## Decisões Confirmadas com o Usuário

> [!IMPORTANT]
> Respostas alinhadas na etapa de clarificação e integradas ao plano:
> - **Conferência Cadastral**: Validação com envio de documento profissional e status pendente antes de liberar o aceite ou vínculo de pacientes.
> - **Visualização da Consulta**: Resumo clínico executivo em tela única (essencial para a tomada de decisão rápida e contato humanizado durante o atendimento).
> - **Correlação de Efeitos Adversos**: Marcador discreto ao lado dos sintomas relatados (visível apenas para o médico, sem alarmar o paciente).
> - **Restrição de Acesso**: Bulas e biociências/moléculas (`ScienceWorkbench`) removidas do paciente e disponibilizadas exclusivamente no portal médico.

---

## 1. Arquitetura e Fluxo do Portal Médico

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PORTAL DO MÉDICO (RITMA)                        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
          ┌──────────────────────────┴──────────────────────────┐
          ▼                                                     ▼
┌─────────────────────────────────┐           ┌──────────────────────────────────┐
│   STATUS: PENDENTE DE ANÁLISE   │           │         STATUS: VERIFICADO       │
│  (Conferência de CRM / Doc)     │           │       (Acesso Clínico Pleno)     │
├─────────────────────────────────┤           ├──────────────────────────────────┤
│ • Banner de análise documental  │           │ • Lista de pacientes vinculados  │
│ • Upload de doc profissional    │           │ • Resumo clínico executivo (1 pág│
│ • Bloqueio de aceite/convites   │           │ • Marcador discreto de ADRs      │
│ • Simulação de aprovação rápida │           │ • Bulas & Moléculas exclusivas   │
└─────────────────────────────────┘           └──────────────────────────────────┘
```

---

## 2. Detalhamento dos Módulos

### A. Conferência Interna de Dados e Perfil Médico
- **Estrutura de Cadastro Profissional**:
  - Dados obrigatórios: Nome completo, CRM, UF do conselho, RQE / Especialidade principal, telefone e instituição/clínica.
  - Envio de documento profissional: interface de upload de comprovante (carteira do CRM, certidão de regularidade do CFM ou diploma) com prévia e confirmação.
- **Barreira de Segurança (Gatekeeper)**:
  - Enquanto o perfil estiver com status `pending_verification` ou sem conferência:
    - O médico **não pode** aceitar novos pacientes nem gerar códigos de vínculo.
    - Exibição de banner profissional amigável com status "Cadastro em análise pela equipe clínica do RITMA".
    - Botão de validação/conferência imediata para testes e demonstrações sem atrito.
  - Uma vez conferido (`verified`), todos os recursos de vínculo e prontuário são desbloqueados.

### B. Resumo Clínico Executivo em Tela Única para Consulta
- **Painel Inicial Limpo e Funcional**:
  - **Identificação & Queixa Principal**: Idade, diagnóstico reumatológico de base, tempo de evolução e queixa atual.
  - **Evolução dos Últimos 30 Dias**: Indicador visual compacto das curvas de Dor, Sono e Fadiga do paciente.
  - **Mapa de Dor Atual**: Miniatura da silhueta com as áreas ativas de dor registradas na última semana.
  - **Medicações Vigentes & Adesão**: Lista das medicações em uso contínuo, dosagem e taxa de adesão recente.
  - **Sintomas da Semana & Alertas Discretos**: Lista sucinta dos sintomas reportados pelo paciente.
  - **Evolução da Consulta**: Campo rápido para notas do médico, conduta e prescrição ajustada.

### C. Correlação entre Sintomas e Efeitos Adversos (Farmacovigilância Médica)
- **Base de Conhecimento Farmacológico**:
  - Mapeamento das medicações clássicas e avançadas em reumatologia e dor crônica (ex.: Metotrexato, Leflunomida, Hidroxicloroquina, Sulfassalazina, Prednisona/Corticoides, AINEs, Anti-TNF, Inibidores de JAK).
  - Tabela de reações adversas frequentes (náusea, aftas, queimação gástrica, cefaleia, alterações de humor/sono, edema, elevação de PA).
- **Marcador Discreto na Consulta**:
  - Nos sintomas relatados pelo paciente, renderizar um badge discreto e elegante: `[!] Possível efeito adverso`.
  - Ao passar o mouse ou tocar, abre um popover médico com:
    - Nome do medicamento causador potencial (ex: *"Compatível com uso de Metotrexato 15mg"*).
    - Incidência clínica e recomendação sugerida (ex: *"Avaliar dose de ácido fólico"*).
  - **Totalmente oculto do paciente**, preservando a relação médico-paciente e evitando interrupções indevidas de medicação pelo paciente.

### D. Restrição Exclusiva de Bulas e Moléculas
- **Remoção no Paciente (`PatientView.tsx`)**:
  - Retirar "Biociências & Bulas" (`ScienceWorkbench`) do menu lateral e de qualquer atalho acessível pelo paciente.
  - Paciente foca no diário de dor, mapa corporal, remédios e orientações de autocuidado.
- **Integração no Médico (`DoctorView.tsx`)**:
  - Aba e painel dedicado "Biociências & Moléculas" no painel médico para consulta farmacológica, mecanismos de ação, alvos moleculares e bulas técnicas.

---

## 3. Plano de Execução Técnica

1. **Restringir Bulas no Painel do Paciente (`PatientView.tsx`)**:
   - Remover o item de menu `science` ("Biociências & Bulas") do sidebar do paciente.
   - Remover a renderização do `ScienceWorkbench` no `PatientView`.

2. **Base de Dados de Farmacovigilância (`src/data/adverseDrugReactions.ts`)**:
   - Criar estrutura de dados correlacionando fármacos comuns (Metotrexato, Prednisona, Ibuprofeno, etc.) com sintomas conhecidos e notas de conduta médica.

3. **Fluxo de Cadastro e Conferência do Médico (`DoctorView.tsx` / `DoctorProfileModal.tsx`)**:
   - Adicionar estado de verificação cadastral (`account.verificationStatus`: `'pending' | 'verified' | 'rejected'`).
   - Implementar formulário de conferência com upload de documento profissional e checklist de CRM.
   - Bloquear aceite de solicitações e emissão de convites caso o status seja `'pending'`, com interface instrutiva e opção de conferência rápida.

4. **Reformulação da Tela de Consulta Médica (`DoctorView.tsx`)**:
   - Criar componente de visualização executiva em tela única para a consulta com paciente selecionado.
   - Incluir mini-mapa anatômico, evolução de 30 dias, medicações vigentes, notas rápidas e sintomas com marcadores discretos de efeitos adversos.
   - Adicionar aba dedicada para "Bulas & Moléculas" (`ScienceWorkbench`) exclusiva para o profissional.

5. **Validação & Testes**:
   - Executar `lint_applet` e `compile_applet`.
   - Verificar ausência de acesso do paciente ao `ScienceWorkbench`.
   - Testar o fluxo de conferência documental do médico e o bloqueio/desbloqueio de pacientes.
