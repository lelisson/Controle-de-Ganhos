# GitHub + Vercel (passo a passo)

Este projeto já tem `vercel.json` na **raiz**: a Vercel deve usar a pasta do repositório inteiro, **sem** “Root Directory = medidor-ganho”.

---

## 1) Repositório no GitHub (site)

1. Acesse [github.com/new](https://github.com/new).
2. **Repository name:** por exemplo `medidor-ganho` ou `custo-km-medidor`.
3. **Public** ou **Private** (o que preferir).
4. **Não** marque “Add a README” (já existe conteúdo local).
5. Clique em **Create repository**.

Na página seguinte, o GitHub mostra comandos “push an existing repository”. Use os da seção 3 abaixo (com **seu** usuário e nome do repo).

---

## 2) Git local (já preparado nesta pasta)

Se ainda não fez o primeiro commit no **seu** PC, na pasta do projeto:

```powershell
cd "c:\Users\Lélisson\Desktop\APLICATIVO CUSTO KM POR HORA - PLANILHA FINANCEIRA"

git config user.name "Seu Nome"
git config user.email "seu-email@exemplo.com"

git init
git branch -M main
git add .
git commit -m "Medidor de ganho: PWA Expo + config Vercel"
```

(Se `git init` já foi feito antes, pule `git init` e só faça `git add` / `commit` / `remote` / `push`.)

---

## 3) Conectar ao GitHub e enviar o código

Substitua `SEU_USUARIO` e `NOME_DO_REPO`:

```powershell
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
git push -u origin main
```

Se pedir login, use **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens), não a senha antiga.

---

## 4) Conectar o GitHub à Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) (time **lelissons-projects**).
2. **Import Git Repository** → autorize o GitHub se pedir → escolha o repositório que você criou.
3. **Root Directory:** deixe em branco (raiz do repo).
4. **Framework Preset:** Other (o build vem do `vercel.json`).
5. **Deploy.**

Variáveis (opcional): **Settings → Environment Variables**  
`EXPO_PUBLIC_REQUIRE_SUBSCRIPTION` = `0` (ou não crie nada — app segue aberto).

---

## 5) Próximos deploys

Cada `git push` na branch `main` (ou a branch que você ligou no projeto) gera um novo deploy na Vercel automaticamente.
