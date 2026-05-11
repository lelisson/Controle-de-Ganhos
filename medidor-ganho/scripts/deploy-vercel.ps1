# Publica usando o vercel.json da RAIZ do repositório (pasta pai de "medidor-ganho").
#
# Uso:
#   $env:VERCEL_TOKEN = "vcp_..."   # opcional; ou faça npx vercel login antes
#   .\scripts\deploy-vercel.ps1

$ErrorActionPreference = "Stop"
$medidorRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent $medidorRoot
Set-Location $repoRoot
Write-Host "Diretório do deploy: $repoRoot" -ForegroundColor Cyan
if (-not $env:VERCEL_TOKEN) {
  Write-Host "Dica: sem VERCEL_TOKEN, use antes: npx vercel login" -ForegroundColor Yellow
}
npx vercel deploy --prod --yes
