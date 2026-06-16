# Pick'em Dashboard – Esportiva Bet

Painel interno para análise de eventos de palpites esportivos.

## Pré-requisitos
- Node 18+
- Conta no [Supabase](https://supabase.com)

## 1. Banco de dados (Supabase)

1. Crie um projeto no Supabase.
2. Vá em **SQL Editor** e execute o conteúdo de `supabase/schema.sql`.
3. Copie a **URL** e a **anon key** do projeto (Settings → API).

## 2. Rodar localmente

```bash
# instalar dependências
npm install

# criar arquivo de variáveis de ambiente
cp .env.example .env
# edite .env com sua URL e anon key do Supabase

# iniciar servidor de desenvolvimento
npm run dev
```

Abra http://localhost:5173.

## 3. Subir no GitHub

```bash
git init
git add .
git commit -m "feat: pickem dashboard"
git remote add origin https://github.com/SEU_USUARIO/pickem-dashboard.git
git push -u origin main
```

## 4. Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e importe o repositório.
2. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL` → URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` → anon key do seu projeto Supabase
3. Framework preset: **Vite**. Build command: `npm run build`. Output: `dist`.
4. Clique em **Deploy**.

## Formato do CSV esperado

Colunas (em ordem):
`Timestamp, User External ID, User Test, Restricted, Brand, Currency, Status, No. Questions, Correct Picks, Points, Prize Value`

- `Timestamp`: `DD/MM/AAAA, HH:MM`
- `User Test` / `Restricted`: `true` ou `false`
- `Status`: `WON`, `LOST` ou `PENDING`
- `Prize Value`: `BRL 888.89` ou `BRL 0`

Linhas com `User Test = true` ou `Restricted = true` são excluídas automaticamente.
