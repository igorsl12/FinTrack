# Prompt para Claude Code — App de Controle Financeiro Pessoal

## Contexto geral

Quero criar um aplicativo de controle financeiro pessoal chamado **FinTrack**. O objetivo é que ele funcione hoje como uma aplicação React web, mas que seja estruturado desde o início para migração futura para React Native (mobile). Por isso, toda a lógica de negócio deve ficar completamente separada da camada de apresentação.

---

## Stack tecnológica

- **React 18** com TypeScript
- **Vite** como bundler
- **Zustand** para gerenciamento de estado global
- **React Router v6** para navegação entre telas
- **Recharts** para gráficos
- **date-fns** para manipulação de datas (com locale pt-BR)
- **Tailwind CSS** para estilização (utility-first, fácil de portar para NativeWind no React Native)
- **Lucide React** para ícones
- **localStorage** para persistência local dos dados (via uma camada de abstração que facilite troca futura por AsyncStorage no React Native)

---

## Estrutura de pastas

Organize o projeto da seguinte forma:

```
src/
├── app/
│   ├── App.tsx
│   └── routes.tsx
├── features/
│   ├── transactions/
│   │   ├── components/
│   │   │   ├── TransactionForm.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   └── TransactionItem.tsx
│   │   ├── hooks/
│   │   │   └── useTransactions.ts
│   │   ├── store/
│   │   │   └── transactionStore.ts
│   │   └── types.ts
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── MetricCard.tsx
│   │   │   ├── FlowChart.tsx
│   │   │   └── CategoryBreakdown.tsx
│   │   └── hooks/
│   │       └── useDashboardMetrics.ts
│   └── reports/
│       ├── components/
│       │   ├── HealthBadge.tsx
│       │   ├── CategoryRanking.tsx
│       │   └── MonthlyComparison.tsx
│       └── hooks/
│           └── useReportData.ts
├── shared/
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── BottomNav.tsx
│   │   └── Button.tsx
│   ├── lib/
│   │   └── storage.ts          ← abstração sobre localStorage/AsyncStorage
│   └── utils/
│       ├── currency.ts
│       └── date.ts
└── pages/
    ├── DashboardPage.tsx
    ├── AddTransactionPage.tsx
    ├── HistoryPage.tsx
    └── ReportPage.tsx
```

---

## Modelo de dados

```typescript
// src/features/transactions/types.ts

export type TransactionType = 'income' | 'expense';

export type IncomeCategory =
  | 'Salário'
  | 'Freelance'
  | 'Investimentos'
  | 'Outros (receita)';

export type ExpenseCategory =
  | 'Moradia'
  | 'Alimentação'
  | 'Transporte'
  | 'Saúde'
  | 'Lazer'
  | 'Educação'
  | 'Outros (despesa)';

export type Category = IncomeCategory | ExpenseCategory;

export interface Transaction {
  id: string;           // uuid v4
  description: string;
  amount: number;       // sempre positivo
  category: Category;
  date: string;         // ISO 8601 'YYYY-MM-DD'
  type: TransactionType;
  createdAt: string;    // ISO 8601 timestamp
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: Category;
  month?: string;       // 'YYYY-MM'
  search?: string;
}
```

---

## Store Zustand (transactionStore)

O store deve:

1. Manter o array `transactions: Transaction[]` como fonte de verdade
2. Persistir automaticamente no localStorage via middleware `persist` do Zustand
3. Expor as seguintes actions:
   - `addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): void`
   - `deleteTransaction(id: string): void`
   - `updateTransaction(id: string, data: Partial<Transaction>): void`
4. Expor os seguintes selectors computados (use `useMemo` ou selectors puros):
   - `getTotalIncome(filters?): number`
   - `getTotalExpenses(filters?): number`
   - `getBalance(filters?): number`
   - `getByCategory(type: TransactionType, filters?): Record<Category, number>`
   - `getMonthlyFlow(months: number): MonthlyData[]` — últimos N meses
   - `getFilteredTransactions(filters: TransactionFilters): Transaction[]`

---

## Funcionalidades por página

### 1. Dashboard (`/`)

- Cards de métricas: Receitas totais, Despesas totais, Saldo líquido
- Indicador visual no saldo: verde se positivo, vermelho se negativo
- Gráfico de barras agrupadas (Recharts `BarChart`) mostrando receitas vs despesas dos últimos 6 meses
- Barras horizontais de progresso mostrando top 5 categorias de despesa com valor e percentual
- Todos os dados reativos ao store

### 2. Lançar transação (`/add`)

- Toggle visual entre "Receita" e "Despesa" que troca as opções de categoria
- Campos: descrição (text), valor (number, formatação BR), categoria (select), data (date, padrão = hoje)
- Validação inline em tempo real:
  - Descrição: mínimo 2 caracteres
  - Valor: maior que zero
  - Todos os campos obrigatórios
- Feedback visual de sucesso e reset do formulário após submit
- Ao salvar, redirecionar para `/` após 1 segundo

### 3. Extrato (`/history`)

- Lista de todas as transações ordenadas por data (mais recente primeiro)
- Filtro por tipo (Todos / Receitas / Despesas)
- Barra de busca por descrição (debounce 300ms)
- Filtro por mês (select com os meses disponíveis)
- Cada item mostra: ícone, descrição, data formatada, badge de categoria, valor (+/-) e botão de exclusão
- Confirmação antes de deletar (modal simples)
- Estado vazio com mensagem amigável

### 4. Relatório (`/report`)

- Badge de saúde financeira com três estados:
  - **Saudável**: saldo positivo e taxa de gastos < 70%
  - **Atenção**: saldo positivo mas gastos entre 70% e 100%
  - **Déficit**: saldo negativo
- Resumo financeiro em grid 2x2: total receitas, total despesas, saldo, taxa de gastos
- Gráfico de pizza (Recharts `PieChart`) com distribuição de despesas por categoria
- Ranking completo de despesas por categoria com barra de progresso e percentual
- Comparativo mês anterior vs mês atual (variação em %)
- Botão "Ver análise completa" que abre um modal com insights automáticos baseados nos dados

---

## Componentes compartilhados

### `<MetricCard>`
Props: `label: string`, `value: string`, `color?: 'default' | 'green' | 'red' | 'blue'`, `icon?: LucideIcon`

### `<Button>`
Props: `variant: 'primary' | 'secondary' | 'danger' | 'ghost'`, `size: 'sm' | 'md' | 'lg'`, `loading?: boolean`, `icon?: LucideIcon`

### `<BottomNav>`
Navegação inferior estilo mobile com 4 ícones (Dashboard, Lançar, Extrato, Relatório). Highlight na rota ativa. Pensado para ser 1:1 com React Native Tab Navigator futuramente.

### `<Layout>`
Container centralizado com max-width 480px (simula viewport mobile), padding lateral, e espaço para o BottomNav.

---

## Camada de persistência (storage.ts)

Crie uma abstração simples:

```typescript
// src/shared/lib/storage.ts
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// implementação web
export const webStorage: StorageAdapter = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
};
```

Use esta abstração no store Zustand em vez de acessar `localStorage` diretamente.

---

## Utilitários

### `currency.ts`
```typescript
export function formatCurrency(value: number): string
// Retorna "R$ 1.500,00" com Intl.NumberFormat pt-BR

export function parseCurrency(value: string): number
// Converte string formatada de volta para number
```

### `date.ts`
```typescript
export function formatDate(date: string): string
// "2024-06-15" → "15 jun. 2024"

export function getMonthLabel(month: string): string
// "2024-06" → "Jun/24"

export function getCurrentMonthKey(): string
// Retorna "YYYY-MM" do mês atual
```

---

## Design system / Tailwind

Configure o `tailwind.config.ts` com as seguintes cores customizadas:

```js
colors: {
  income: { light: '#EAF3DE', DEFAULT: '#639922', dark: '#3B6D11' },
  expense: { light: '#FCEBEB', DEFAULT: '#E24B4A', dark: '#A32D2D' },
  balance: { light: '#E6F1FB', DEFAULT: '#378ADD', dark: '#185FA5' },
  warning: { light: '#FAEEDA', DEFAULT: '#EF9F27', dark: '#854F0B' },
}
```

O layout deve ter aparência de app mobile: largura máxima 480px, centralizado, com sombra lateral em telas maiores.

---

## Dados de demonstração

Ao iniciar o app pela primeira vez (localStorage vazio), popule com 15 transações realistas dos últimos 3 meses, cobrindo várias categorias. Isso facilita o teste e demonstração do app.

---

## Qualidade de código

- TypeScript strict mode (`"strict": true` no tsconfig)
- Sem `any` explícito
- Todos os componentes com tipagem explícita de props
- Custom hooks para toda lógica de dados (sem lógica de negócio dentro de componentes)
- Nomes em inglês para código, português para textos visíveis ao usuário
- Comentários JSDoc nos hooks e funções utilitárias principais

---

## Comandos esperados ao final

```bash
npm run dev      # desenvolvimento
npm run build    # build de produção
npm run preview  # preview do build
npm run lint     # ESLint
```

---

## Observação sobre futura migração para React Native

Ao implementar, mantenha em mente que no futuro este projeto será portado para React Native. Por isso:

- Nenhum componente deve usar APIs exclusivas do browser (window, document, etc.) diretamente — sempre abstraia
- A lógica de estado (Zustand store) e os custom hooks devem funcionar sem alteração
- Evite dependências que não tenham equivalente no React Native
- O `BottomNav` deve ser implementado de forma que sua estrutura seja espelhável em um Tab Navigator do React Navigation
