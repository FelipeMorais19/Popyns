# Cloudflare Tunnel para desenvolvimento local
# Expoe localhost:3000 com HTTPS publico para o webhook do Clerk funcionar
#
# Como usar:
#   1) Em um terminal: npm run dev  (dentro de front-end/)
#   2) Em outro terminal: .\start-tunnel.ps1
#   3) Copie a URL gerada (https://xxxx.trycloudflare.com)
#   4) No Clerk Dashboard -> Configure -> Webhooks -> seu endpoint -> cole a URL + /api/webhooks/clerk

$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")

Write-Host ""
Write-Host "Iniciando Cloudflare Tunnel para http://localhost:3000 ..." -ForegroundColor Cyan
Write-Host "Aguarde a URL aparecer abaixo (linha com 'trycloudflare.com')" -ForegroundColor Yellow
Write-Host ""
Write-Host "Quando a URL aparecer, configure no Clerk Dashboard:" -ForegroundColor Green
Write-Host "  Dashboard -> Configure -> Webhooks -> Edit Endpoint" -ForegroundColor Green
Write-Host "  URL: https://TUNNEL_URL/api/webhooks/clerk" -ForegroundColor Green
Write-Host ""

cloudflared tunnel --url http://localhost:3000
