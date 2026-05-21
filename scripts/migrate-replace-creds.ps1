# =============================================
# Script: Reemplazar credenciales Appwrite en todos los archivos
# Uso: .\scripts\migrate-replace-creds.ps1
# =============================================

# REEMPLAZAR CON VALORES DEL NUEVO PROYECTO
$NewEndpoint   = "https://NUEVO_ENDPOINT/v1"
$NewProjectId  = "NUEVO_PROJECT_ID"
$NewDatabaseId = "NUEVO_DATABASE_ID"
$NewApiKey     = "NUEVO_API_KEY"

# Valores actuales (los que se van a reemplazar)
$OldEndpoint   = "https://nyc.cloud.appwrite.io/v1"
$OldProjectId  = "6a0a4e8d0032177f3f90"
$OldDatabaseId = "6a0a58ca001798410d86"
$OldApiKey     = "standard_dea4a8654ed430bf3626a6cd6506a562cbfcebb7caeb417a1e83c8228ed1de0a84d60b11cc4776d023d0c5ac8d1dcb0ba59e43fef5fb8831a7252aaf5b2f13896769e2a5af222f9853d7f7abcada2d034e1d92e3b73d8de53d1c29adde00cd723aa5612189b2ee702e798acb0dffeb9ff154714a5f7af060c78567391d49923d"

# Cuenta antigua muerta (en init-theme-config)
$DeadProjectId  = "698f6de50012f9df7ebd"
$DeadDatabaseId = "67f1dc940037b3d367bb"
$DeadApiKey     = "standard_ea10b9d7d4414fec61778bdc7f569b0de82bb3aca157f5949bbb8c7320b379f12e15649cae18dc0512f75fd8d575dd5f59058125598e0a0491fa9ea9760ff67b2f792df372b838bf5bd1a9acfef29f201ccb20105285ee2787343eebf89234a4b0a6977ae7447cc5d9c0742d0f9d364d03730c97261748a019bf592ce7cd2025"

Write-Host "🔄 Reemplazando credenciales Appwrite..." -ForegroundColor Cyan

# 1. Actualizar .env.local
Write-Host "`n📝 Actualizando .env.local..." -ForegroundColor Yellow
$envContent = @"
NEXT_PUBLIC_APPWRITE_ENDPOINT=$NewEndpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=$NewProjectId
NEXT_PUBLIC_APPWRITE_DATABASE_ID=$NewDatabaseId
APPWRITE_API_KEY=$NewApiKey
"@
Set-Content -Path ".env.local" -Value $envContent -NoNewline
Write-Host "  ✅ .env.local actualizado" -ForegroundColor Green

# 2. Archivos hardcodeados con credenciales actuales
$hardcodedFiles = @(
  "src/app/api/template/route.ts",
  "src/app/api/theme-config/route.ts",
  "src/app/api/version/route.ts",
  "src/lib/appwrite-server.ts"
)

foreach ($f in $hardcodedFiles) {
  if (Test-Path $f) {
    $content = Get-Content $f -Raw
    $content = $content -replace [regex]::Escape($OldEndpoint), $NewEndpoint
    $content = $content -replace [regex]::Escape($OldProjectId), $NewProjectId
    $content = $content -replace [regex]::Escape($OldDatabaseId), $NewDatabaseId
    $content = $content -replace [regex]::Escape($OldApiKey), $NewApiKey
    Set-Content -Path $f -Value $content -NoNewline
    Write-Host "  ✅ $f" -ForegroundColor Green
  } else {
    Write-Host "  ⚠️  No encontrado: $f" -ForegroundColor Yellow
  }
}

# 3. init-theme-config (cuenta antigua muerta)
$initTheme = "src/app/api/init-theme-config/route.ts"
if (Test-Path $initTheme) {
  $content = Get-Content $initTheme -Raw
  $content = $content -replace [regex]::Escape($DeadProjectId), $NewProjectId
  $content = $content -replace [regex]::Escape($DeadDatabaseId), $NewDatabaseId
  $content = $content -replace [regex]::Escape($DeadApiKey), $NewApiKey
  Set-Content -Path $initTheme -Value $content -NoNewline
  Write-Host "  ✅ $initTheme (cuenta antigua → nueva)" -ForegroundColor Green
}

# 4. Scripts
$scriptFiles = @(
  "scripts/add-missing-attributes.ts",
  "scripts/fix-perms.js",
  "scripts/create-collections.ts",
  "scripts/migrate-create-collections.ts",
  "scripts/migrate-data.ts"
)

foreach ($s in $scriptFiles) {
  if (Test-Path $s) {
    $content = Get-Content $s -Raw
    # Reemplazar old creds
    $content = $content -replace [regex]::Escape($OldEndpoint), $NewEndpoint
    $content = $content -replace [regex]::Escape($OldProjectId), $NewProjectId
    $content = $content -replace [regex]::Escape($OldDatabaseId), $NewDatabaseId
    $content = $content -replace [regex]::Escape($OldApiKey), $NewApiKey
    # Reemplazar placeholders NUEVO_*
    $content = $content -replace "https://NUEVO_ENDPOINT/v1", $NewEndpoint
    $content = $content -replace "NUEVO_PROJECT_ID", $NewProjectId
    $content = $content -replace "NUEVO_DATABASE_ID", $NewDatabaseId
    $content = $content -replace "NUEVO_API_KEY", $NewApiKey
    Set-Content -Path $s -Value $content -NoNewline
    Write-Host "  ✅ $s" -ForegroundColor Green
  }
}

Write-Host "`n🎉 Credenciales reemplazadas!" -ForegroundColor Green
Write-Host "⚠️  Ejecutar 'npm run build' para verificar que compila" -ForegroundColor Yellow
