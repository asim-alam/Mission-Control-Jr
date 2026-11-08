import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateSource} from '../simulation/provenance.js';
const base=new URL('../public/data/',import.meta.url);
test('archived NASA source records retain valid hashes and normalized values',()=>{
  const sources=JSON.parse(readFileSync(new URL('provenance.json',base)));
  const normalized=JSON.parse(readFileSync(new URL('normalized.json',base)));
  assert.deepEqual(JSON.parse(readFileSync(new URL('../data/normalized.json',import.meta.url))),normalized);
  for(const source of sources){assert.ok(validateSource(source));const bytes=readFileSync(new URL(source.rawFile.replace('data/',''),base));assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);}
  const sep=JSON.parse(readFileSync(new URL('raw/donki-sep-2024-05.json',base))).find(e=>e.sepID===normalized.sep.id);
  assert.equal(sep.eventTime,normalized.sep.eventTime);
  const text=readFileSync(new URL('raw/horizons-mars-earth-2026-11.txt',base),'utf8');
  assert.equal(Number(text.match(/2026-Nov-14\s+00:00\s+([\d.]+)/)[1]),normalized.marsLightTime.oneWayMinutes);
  const moon=readFileSync(new URL('raw/horizons-moon-earth-2026-11.txt',base),'utf8');assert.equal(Number(moon.match(/2026-Nov-14\s+00:00\s+([\d.]+)/)[1]),normalized.moonLightTime.oneWayMinutes);
  const study=JSON.parse(readFileSync(new URL('raw/osdr-osd-269.json',base))).study['OSD-269'].studies[0];
  assert.equal(study.identifier,normalized.lettuceReference.studyId);
  assert.ok(study.processSequence[0].parameterValues.some(p=>p.value===`${normalized.lettuceReference.lightHours}:${normalized.lettuceReference.darkHours} light:dark`));
  const lunar=JSON.parse(readFileSync(new URL('raw/lunar-illumination/patches.json',base)));
  for(const [i,patch] of lunar.patches.entries()){
    const bytes=readFileSync(new URL(patch.rawFile.replace('data/',''),base));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),patch.sha256);
    const samples=Array.from({length:25},(_,j)=>bytes.readInt16LE(Math.floor(j/5)*10116+(j%5)*2));
    assert.deepEqual(samples,patch.rawDigitalNumbers);
    assert.ok(Math.abs(samples.reduce((a,b)=>a+b,0)/25*lunar.scaleFactor-normalized.lunarIllumination.patches[i].meanFraction)<1e-12);
  }
});
