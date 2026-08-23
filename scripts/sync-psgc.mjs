import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_FILE = resolve(ROOT, 'src/data/philippine-localities.json');
const SOURCE_URL = 'https://psgc.cloud/api/v2/cities-municipalities';
const PSA_URL = 'https://psa.gov.ph/classification/psgc';

const EXPECTED_COUNTS = Object.freeze({
  cities: 149,
  municipalities: 1493,
  total: 1642,
});

// Corrections after the mirror's base snapshot, verified against PSA PSGC releases.
const CURRENT_NAME_BY_CODE = Object.freeze({
  '0201522000': 'Sanchez Mira',
  '0402104000': 'City of Carmona',
  '1004217000': 'Don Victoriano',
  '1102324000': 'Sawata',
  '1999901000': 'Kapalawan',
  '1999902000': 'Old Kaabakan',
  '1999903000': 'Kadayangan',
  '1999904000': 'Nabalawag',
  '1999905000': 'Pahamuddin',
  '1999906000': 'Malidegao',
  '1999907000': 'Ligawasan',
  '1999908000': 'Tugunan',
});

const clean = (value = '') => value.trim().replace(/\s+/g, ' ');
const NIR_PROVINCES = new Set(['Negros Occidental', 'Negros Oriental', 'Siquijor']);

const fetchSourceLocalities = async () => {
  const response = await fetch(SOURCE_URL, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`PSGC source returned HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload?.data)) {
    throw new Error('PSGC source returned an unexpected response shape');
  }

  return payload.data;
};

const normalizeLocality = (entry) => {
  const name = CURRENT_NAME_BY_CODE[entry.code] ?? clean(entry.name);
  const sourceProvince = clean(entry.province);
  const isSulu = sourceProvince === 'Sulu';
  const isNir = NIR_PROVINCES.has(sourceProvince);
  const isNcr = clean(entry.region) === 'National Capital Region (NCR)';

  return {
    code: isNir ? `18${entry.code.slice(2)}` : (isSulu ? `09${entry.code.slice(2)}` : entry.code),
    name,
    type: /\bcity\b/i.test(name) ? 'city' : 'municipality',
    province: entry.code.startsWith('19999')
      ? 'Special Geographic Area'
      : (isNcr ? '' : sourceProvince),
    region: isNir
      ? 'Negros Island Region (NIR)'
      : (isSulu ? 'Region IX (Zamboanga Peninsula)' : clean(entry.region)),
  };
};

const validateLocalities = (localities) => {
  const counts = localities.reduce((result, locality) => {
    const countKey = locality.type === 'city' ? 'cities' : 'municipalities';
    result[countKey] += 1;
    return result;
  }, { cities: 0, municipalities: 0 });
  counts.total = localities.length;

  for (const [key, expected] of Object.entries(EXPECTED_COUNTS)) {
    if (counts[key] !== expected) {
      throw new Error(`PSGC validation failed: expected ${expected} ${key}, received ${counts[key]}`);
    }
  }

  if (new Set(localities.map(({ code }) => code)).size !== localities.length) {
    throw new Error('PSGC validation failed: duplicate locality codes detected');
  }

  if (localities.some(({ code, name, region }) => !/^\d{10}$/.test(code) || !name || !region)) {
    throw new Error('PSGC validation failed: malformed locality record detected');
  }

  if (localities.some(({ province, region }) => (
    NIR_PROVINCES.has(province) && region !== 'Negros Island Region (NIR)'
  ))) {
    throw new Error('PSGC validation failed: stale Negros Island Region record detected');
  }

  for (const [code, expectedName] of Object.entries(CURRENT_NAME_BY_CODE)) {
    if (!localities.some((locality) => locality.code === code && locality.name === expectedName)) {
      throw new Error(`PSGC validation failed: missing current record ${expectedName} (${code})`);
    }
  }

  return counts;
};

const main = async () => {
  const sourceLocalities = await fetchSourceLocalities();
  const subMunicipalities = sourceLocalities.filter(({ type }) => type === 'SubMun');

  if (subMunicipalities.length !== 14) {
    throw new Error(`PSGC validation failed: expected 14 Manila sub-municipalities, received ${subMunicipalities.length}`);
  }

  const localities = sourceLocalities
    .filter(({ type }) => type !== 'SubMun')
    .map(normalizeLocality)
    .sort((left, right) => (
      left.name.localeCompare(right.name)
      || left.province.localeCompare(right.province)
      || left.code.localeCompare(right.code)
    ));
  const counts = validateLocalities(localities);
  const output = {
    metadata: {
      title: 'Philippine cities and municipalities',
      authority: 'Philippine Statistics Authority - Philippine Standard Geographic Code',
      authorityUrl: PSA_URL,
      mirror: SOURCE_URL,
      asOf: '2026-06-30',
      counts,
    },
    localities,
  };

  await writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${counts.total} validated Philippine LGUs to ${OUTPUT_FILE}`);
};

await main();
