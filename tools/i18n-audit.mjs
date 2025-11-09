import fs from 'fs';
import path from 'path';

const root = process.cwd();
const i18nDir = path.join(root, 'assets', 'i18n');

const languages = ['en', 'fa', 'ar', 'tr', 'de', 'fr', 'es', 'ru', 'zh', 'it'];

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return { json: JSON.parse(raw), valid: true, error: null };
  } catch (err) {
    return { json: null, valid: false, error: err.message };
  }
}

function isPlainObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function flattenKeys(obj, prefix = '') {
  const out = [];
  if (isPlainObject(obj)) {
    for (const key of Object.keys(obj)) {
      const p = prefix ? `${prefix}.${key}` : key;
      out.push(...flattenKeys(obj[key], p));
    }
  } else if (Array.isArray(obj)) {
    // Arrays are uncommon in i18n values; include indices for completeness
    obj.forEach((item, idx) => {
      const p = `${prefix}[${idx}]`;
      out.push(...flattenKeys(item, p));
    });
  } else {
    // leaf value (string/number/boolean/null)
    out.push(prefix);
  }
  return out;
}

function getValueByPath(obj, pathStr) {
  if (!pathStr) return obj;
  // handle array indices like key[0]
  const parts = pathStr
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function syncToRef(refNode, transNode) {
  if (isPlainObject(refNode)) {
    const result = {};
    for (const key of Object.keys(refNode)) {
      result[key] = syncToRef(refNode[key], transNode ? transNode[key] : undefined);
    }
    return result;
  }
  if (Array.isArray(refNode)) {
    // Keep array length as in ref; map by index
    return refNode.map((item, idx) => syncToRef(item, Array.isArray(transNode) ? transNode[idx] : undefined));
  }
  // Primitive: prefer translation if exists and is same type; otherwise fallback to ref
  if (transNode != null && typeof transNode === typeof refNode) {
    return transNode;
  }
  return refNode;
}

function writeJson(filePath, obj) {
  const jsonStr = JSON.stringify(obj, null, 2) + '\n';
  fs.writeFileSync(filePath, jsonStr, { encoding: 'utf8' });
}

function firstFivePairs(refKeys, langJson) {
  const firstFive = refKeys.slice(0, 5).map(k => ({ key: k, value: getValueByPath(langJson, k) }));
  return firstFive;
}

function main() {
  const args = new Set(process.argv.slice(2));
  const refPathArgIdx = process.argv.indexOf('--ref');
  const refPath = refPathArgIdx !== -1 ? process.argv[refPathArgIdx + 1] : path.join(i18nDir, 'en.remote.json');
  const refRead = readJson(refPath);
  if (!refRead.valid) {
    console.error(`Failed to read reference JSON at ${refPath}: ${refRead.error}`);
    process.exit(1);
  }
  const refJson = refRead.json;
  const refKeys = flattenKeys(refJson);

  const report = { referencePath: refPath, totalKeys: refKeys.length, languages: {} };

  for (const lang of languages) {
    const filePath = path.join(i18nDir, `${lang}.json`);
    const exists = fs.existsSync(filePath);
    let langObj = null;
    let valid = false;
    let error = null;
    if (exists) {
      const rd = readJson(filePath);
      valid = rd.valid;
      error = rd.error;
      langObj = rd.json;
    }
    // If missing or invalid, start from empty object
    if (!exists || !valid) {
      langObj = {};
    }

    let transKeys = flattenKeys(langObj);
    let missing = refKeys.filter(k => !transKeys.includes(k));
    let extra = transKeys.filter(k => !refKeys.includes(k));

    // Synchronize structure if requested
    if (args.has('--sync')) {
      const synced = syncToRef(refJson, langObj);
      // Keep en identical to ref; for others, synced preserves existing translations
      const outPath = filePath;
      writeJson(outPath, lang === 'en' ? refJson : synced);
      // Recompute after sync
      const rd2 = readJson(outPath);
      langObj = rd2.json;
      valid = rd2.valid;
      error = rd2.error;
      // recompute keys and diffs after sync
      transKeys = flattenKeys(langObj);
      missing = refKeys.filter(k => !transKeys.includes(k));
      extra = transKeys.filter(k => !refKeys.includes(k));
    }

    const first5 = firstFivePairs(refKeys, langObj);

    report.languages[lang] = {
      exists,
      valid,
      error,
      keyCount: flattenKeys(langObj).length,
      missingCount: missing.length,
      extraCount: extra.length,
      missingKeys: missing,
      extraKeys: extra,
      firstFive: first5,
      filePath: filePath
    };
  }

  const reportPath = path.join(i18nDir, 'audit-report.json');
  writeJson(reportPath, report);
  console.log(`Audit complete. Report written to ${path.relative(root, reportPath)}`);
  console.log(`Reference keys: ${refKeys.length}`);
  for (const lang of languages) {
    const info = report.languages[lang];
    console.log(`${lang}: exists=${info.exists} valid=${info.valid} keys=${info.keyCount} missing=${info.missingCount} extra=${info.extraCount}`);
  }

  // Write a concise first-five summary file for quick review
  const lines = [];
  for (const lang of languages) {
    const info = report.languages[lang];
    lines.push(`[${lang}] keys=${info.keyCount} missing=${info.missingCount} extra=${info.extraCount}`);
    info.firstFive.forEach(pair => {
      // ensure single-line values
      const v = typeof pair.value === 'string' ? pair.value.replace(/\n/g, ' ') : String(pair.value);
      lines.push(`  - ${pair.key} = ${v}`);
    });
  }
  const summaryPath = path.join(i18nDir, 'audit-first5.txt');
  fs.writeFileSync(summaryPath, lines.join('\n') + '\n', { encoding: 'utf8' });
  console.log(`First-five summary written to ${path.relative(root, summaryPath)}`);
}

main();

