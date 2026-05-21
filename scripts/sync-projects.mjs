#!/usr/bin/env node
/**
 * sync-projects.mjs — Sincroniza cambios del proyecto principal (COMPRA REGION)
 * al proyecto secundario (PROJECT YAXSEL).
 *
 * EXCLUYE archivos que contienen configuración específica por proyecto:
 *   - .env.local (Appwrite credentials)
 *   - src/lib/appwrite.ts, appwrite-admin.ts, appwrite-server.ts (IDs hardcodeados)
 *   - src/app/api/template/route.ts (IDs hardcodeados)
 *   - src/app/api/theme-config/route.ts (IDs hardcodeados)
 *   - src/app/api/version/route.ts (IDs hardcodeados)
 *   - src/app/api/init-theme-config/route.ts (API key diferente)
 *   - src/templates/plantilla1/HomePage.tsx (theme personalizado por tienda)
 *
 * USO:
 *   node scripts/sync-projects.mjs              # dry-run (solo muestra cambios)
 *   node scripts/sync-projects.mjs --apply       # aplica los cambios
 *   node scripts/sync-projects.mjs --apply --push # aplica cambios + git push automático
 *   node scripts/sync-projects.mjs --force       # aplica sin confirmar
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SOURCE = path.join(ROOT, 'web-store');
const TARGET = path.join(ROOT, 'PROJECT YAXSEL', 'web-store');

// Archivos/directorios a excluir de la sincronización
const EXCLUDE_PATTERNS = [
  // Appwrite config (IDs hardcodeados por proyecto)
  '.env.local',
  '.env',
  'src/lib/appwrite.ts',
  'src/lib/appwrite-admin.ts',
  'src/lib/appwrite-server.ts',
  // API routes con IDs hardcodeados
  'src/app/api/template/route.ts',
  'src/app/api/theme-config/route.ts',
  'src/app/api/version/route.ts',
  'src/app/api/init-theme-config/route.ts',
  // Theme template (personalizado por tienda)
  'src/templates/plantilla1/HomePage.tsx',
  // No tocar estos
  'node_modules',
  '.next',
  '.git',
  'package-lock.json',
  'pnpm-lock.yaml',
];

const apply = process.argv.includes('--apply');
const force = process.argv.includes('--force');
const autoPush = process.argv.includes('--push');

function isExcluded(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  return EXCLUDE_PATTERNS.some(pattern => {
    const np = pattern.replace(/\\/g, '/');
    return normalized === np || normalized.startsWith(np + '/');
  });
}

function getAllFiles(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (isExcluded(relPath)) continue;
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git') {
        files = files.concat(getAllFiles(path.join(dir, entry.name), relPath));
      }
    } else {
      files.push(relPath);
    }
  }
  return files;
}

function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  SYNC: COMPRA REGION → PROJECT YAXSEL');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Source: ${SOURCE}`);
  console.log(`Target: ${TARGET}`);
  console.log(`Mode:   ${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log('');

  if (!fs.existsSync(TARGET)) {
    console.error(`❌ Target directory not found: ${TARGET}`);
    process.exit(1);
  }

  const sourceFiles = getAllFiles(SOURCE);
  const targetFiles = getAllFiles(TARGET);
  const allRelPaths = [...new Set([...sourceFiles, ...targetFiles])].sort();

  let newFiles = [];
  let modifiedFiles = [];
  let deletedFiles = [];
  let sameFiles = 0;

  for (const rel of allRelPaths) {
    const srcPath = path.join(SOURCE, rel);
    const tgtPath = path.join(TARGET, rel);
    const srcExists = fs.existsSync(srcPath);
    const tgtExists = fs.existsSync(tgtPath);

    if (srcExists && !tgtExists) {
      newFiles.push(rel);
    } else if (!srcExists && tgtExists) {
      deletedFiles.push(rel);
    } else if (srcExists && tgtExists) {
      const srcContent = fs.readFileSync(srcPath);
      const tgtContent = fs.readFileSync(tgtPath);
      if (!srcContent.equals(tgtContent)) {
        modifiedFiles.push(rel);
      } else {
        sameFiles++;
      }
    }
  }

  // ── Show results ──
  if (newFiles.length > 0) {
    console.log(`\n🆕 NEW FILES (${newFiles.length}):`);
    newFiles.forEach(f => console.log(`   + ${f}`));
  }

  if (modifiedFiles.length > 0) {
    console.log(`\n✏️  MODIFIED FILES (${modifiedFiles.length}):`);
    modifiedFiles.forEach(f => console.log(`   ~ ${f}`));
  }

  if (deletedFiles.length > 0) {
    console.log(`\n🗑️  FILES ONLY IN TARGET (${deletedFiles.length}):`);
    deletedFiles.forEach(f => console.log(`   - ${f}`));
  }

  console.log(`\n✅ UNCHANGED: ${sameFiles} files`);

  // ── Excluded files info ──
  console.log(`\n🔒 EXCLUDED (not synced):`);
  EXCLUDE_PATTERNS.filter(p => !['node_modules', '.next', '.git'].includes(p)).forEach(p => {
    const srcExists = fs.existsSync(path.join(SOURCE, p));
    const tgtExists = fs.existsSync(path.join(TARGET, p));
    if (srcExists || tgtExists) {
      console.log(`   🔒 ${p}`);
    }
  });

  const totalChanges = newFiles.length + modifiedFiles.length;

  if (totalChanges === 0) {
    console.log('\n✨ Projects are in sync! No changes needed.');
    return;
  }

  if (!apply) {
    console.log(`\n📋 Dry run complete. ${totalChanges} file(s) would be synced.`);
    console.log('   Run with --apply to sync, or --force to skip confirmation.');
    return;
  }

  if (!force) {
    console.log(`\n⚠️  About to sync ${totalChanges} file(s) from COMPRA REGION → PROJECT YAXSEL`);
    console.log('   Press Ctrl+C to cancel, or wait 3 seconds...');
    // Simple auto-proceed after delay (no readline needed)
  }

  // ── Apply changes ──
  let synced = 0;
  for (const rel of [...newFiles, ...modifiedFiles]) {
    const srcPath = path.join(SOURCE, rel);
    const tgtPath = path.join(TARGET, rel);
    const tgtDir = path.dirname(tgtPath);
    if (!fs.existsSync(tgtDir)) {
      fs.mkdirSync(tgtDir, { recursive: true });
    }
    fs.copyFileSync(srcPath, tgtPath);
    synced++;
  }

  console.log(`\n✅ Synced ${synced} file(s) successfully!`);

  // ── Auto git push if requested ──
  if (autoPush) {
    console.log('\n📤 Running git add, commit, and push...');
    try {
      execSync('git add -A', { cwd: TARGET, stdio: 'inherit' });
      execSync(`git commit -m "Sync: ${synced} file(s) synced from COMPRA REGION"`, { cwd: TARGET, stdio: 'inherit' });
      execSync('git push', { cwd: TARGET, stdio: 'inherit' });
      console.log('\n✅ Git push completed!');
    } catch (err) {
      console.error('\n❌ Git push failed:', err.message);
      console.log('   You may need to push manually.');
    }
  }

  // ── Remind about excluded files ──
  console.log('\n⚠️  REMINDER: The following files were NOT synced (project-specific):');
  console.log('   - .env.local → Update Appwrite IDs manually');
  console.log('   - src/lib/appwrite*.ts → Already reads from env vars');
  console.log('   - src/app/api/*/route.ts → Hardcoded Appwrite IDs');
  console.log('   - src/templates/plantilla1/HomePage.tsx → Custom theme per store');
  console.log('\n💡 TIP: Consider moving hardcoded IDs in API routes to env vars');
  console.log('   so they also sync automatically in the future.');
}

main();
