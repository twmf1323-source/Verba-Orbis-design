import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const sandbox = { console };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.runInNewContext(fs.readFileSync(path.join(dir, 'schema.js'), 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync(path.join(dir, 'demo.js'), 'utf8'), sandbox);

const S = sandbox.VerbaAthanor.schema;
const D = sandbox.VerbaAthanor.demo;
let failed = 0;

function assert(name, cond) {
  if (!cond) {
    failed += 1;
    console.error('FAIL', name);
  } else {
    console.log('ok  ', name);
  }
}

assert('incroyable', S.normalizeQuery('Incroyable!') === 'incroyable');
assert("aujourd'hui keeps apostrophe", S.normalizeQuery("Aujourd’hui") === "aujourd'hui");
assert('empty gate', S.queryTooLong('').reason === 'empty');
assert('kind prefix', S.normalizeKind('préfixe') === 'pfx');
assert('kind root', S.normalizeKind('racine') === 'root');
assert('demo incroyable morphs', D.lookupAnalysis('incroyable').morphemes.length === 3);
assert('demo parapluie', D.lookupAnalysis('parapluie').morphemes[0].surface === 'para-');
assert('demo soudain splits', D.lookupAnalysis('soudain').morphemes.length === 2);
assert('demo soudain suffix', D.lookupAnalysis('soudain').morphemes[1].surface === '-ain');
assert('demo bibliotheque fold', D.lookupAnalysis('bibliotheque').lemma === 'bibliothèque');
assert('expand croy derive', D.lookupExpand('incroyable', { surface: 'croy' }, 'derive').items.length >= 5);
assert('expand para compound', D.lookupExpand('parapluie', { surface: 'para-' }, 'compound').items.some((x) => x.word === 'parachute'));
assert('coniunctio para pluie', D.lookupConiunctio('para-', 'pluie').items.some((x) => x.word === 'parapluie'));
assert('coniunctio order independent', D.lookupConiunctio('pluie', 'para-').items.some((x) => x.word === 'parapluie'));
assert('coniunctio same empty', D.lookupConiunctio('para-', 'para-').items.length === 0);

const a = S.normalizeAnalysis(D.lookupAnalysis('incroyable'), 'incroyable');
assert('normalize keeps 3 morphs', a.morphemes.length === 3);
assert('path oldest first-ish', a.path[0].era === 'PIE');
assert('era latin→Lat', S.normalizeEra('latin') === 'Lat');
assert('era old french→OF', S.normalizeEra('Old French') === 'OF');
assert('era vulgar latin→VL', S.normalizeEra('vulgar latin') === 'VL');
assert('era english period→ModE', S.normalizeEra('english') === 'ModE');
assert('origin english language→Eng', S.normalizeOrigin('english') === 'Eng');
assert('via inherit', S.normalizeVia('inherited') === 'inherit');
assert('certainty star form', S.normalizeCertainty('', '*ḱred-', '') === 'reconstructed');
assert('PIE path has note', Boolean(a.path[0].noteZh));
assert('PIE path via reconstruct', a.path[0].via === 'reconstruct');
assert('path has VL step', a.path.some((p) => p.era === 'VL'));
assert('croy originPath', /credere/.test(a.morphemes.find((m) => m.surface === 'croy')?.originPath || ''));

const parsed = S.parseOriginPath('PIE *ḱred-dʰeh₁- → Lat credere → OF croire');
assert('parse originPath length', parsed.length === 3);
assert('parse originPath first era', parsed[0].era === 'PIE');
assert('parse originPath lat form', parsed[1].form === 'credere');

const dup = S.normalizeAnalysis(
  {
    word: 'test',
    lemma: 'test',
    glossZh: '試',
    morphemes: [{ surface: 'test', kind: 'root', meaningZh: '試', origin: 'Lat', originForm: 'testis' }],
    path: [
      { era: 'latin', form: 'testis', glossZh: '證人' },
      { era: 'Lat', form: 'testis', glossZh: '證人', noteZh: '較長的說明應該保留' },
      { era: 'Fr', form: 'test', glossZh: '試' },
    ],
  },
  'test'
);
assert('dedupe consecutive same form', dup.path.filter((p) => S.bareForm(p.form) === 'testis').length === 1);
assert('dedupe keeps longer note', /較長/.test(dup.path[0].noteZh || ''));
assert('filled originPath', Boolean(dup.morphemes[0].originPath));
assert('firstAttested year', a.firstAttested.year === '1549');
assert('firstAttested where', a.firstAttested.whereZh === '法國書面語');
assert('year 12c', S.normalizeYear('12th century') === '12c');
assert('year 1549 from prose', S.normalizeYear('約 1549 年') === '1549');
assert('yearLabel 12c', S.yearLabel('12c') === '12 世紀');
assert('format attested head', /1549/.test(S.formatFirstAttested(a.firstAttested)?.head || ''));
assert('attested author', a.firstAttested.author === 'Du Bellay');
assert('attested work cite', /Deffence/.test(S.formatFirstAttested(a.firstAttested)?.cite || ''));
assert('cite wraps title', S.formatWorkCite('Du Bellay', 'La Deffence') === 'Du Bellay 《La Deffence》');
assert('cite work only', S.formatWorkCite('', '万葉集') === '《万葉集》');

if (failed) {
  console.error('\n' + failed + ' failed');
  process.exit(1);
}
console.log('\nall passed');
