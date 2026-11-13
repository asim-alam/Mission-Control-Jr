// Normalize the bundled original responses; do not fabricate missing records.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=new URL('../public/data/',import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const donki=await readFile(new URL('raw/donki-sep-2024-05.json',base));
const horizons=await readFile(new URL('raw/horizons-mars-earth-2026-11.txt',base));
const osdr=await readFile(new URL('raw/osdr-osd-269.json',base));
const ntrs=await readFile(new URL('raw/ntrs-20210024855.json',base));
const lunarRaw=await readFile(new URL('raw/lunar-illumination/patches.json',base));
const eds=await readFile(new URL('raw/nasa-blue-ghost-eds-2025.html',base));
const moonHorizons=await readFile(new URL('raw/horizons-moon-earth-2026-11.txt',base));
const propagation=await readFile(new URL('raw/nasa-lunar-propagation.html',base));
const curiosityRaw=await readFile(new URL('raw/curiosity-rad-2024-05-20.json',base));
const curiosity=JSON.parse(curiosityRaw);
if(curiosity.id!=='curiosity-rad-2024-05-20' || curiosity.eventDate!=='2024-05-20' ||
  !Number.isFinite(curiosity.reportedAbsorbedDoseMicrogray) || curiosity.reportedAbsorbedDoseMicrogray<=0) {
  throw Error('Missing or invalid Curiosity radiation summary');
}
const lunar=JSON.parse(lunarRaw);
const sep=JSON.parse(donki).find(e=>e.sepID==='2024-05-10T13:35:00-SEP-001');
const text=horizons.toString('utf8');
const row=text.match(/2026-Nov-14\s+00:00\s+([\d.]+)/);
const moonText=moonHorizons.toString('utf8'),moonRow=moonText.match(/2026-Nov-14\s+00:00\s+([\d.]+)/);
const study=JSON.parse(osdr).study?.['OSD-269']?.studies?.[0];
const photoperiod=study?.processSequence?.[0]?.parameterValues?.find(p=>p.value==='16:8 light:dark');
const reference=JSON.parse(ntrs);
if(!sep || !row || !moonRow || !moonText.includes('Moon (301)') || !moonText.includes('Earth (399)') || !text.includes('1-way_down_LT') || !text.includes('Mars (499)') || !text.includes('Earth (399)') || !photoperiod || reference.id!==20210024855 || !eds.toString().includes('glass and thermal radiator surfaces') || !propagation.toString().includes('Lunar Surface Propagation')) throw Error('Missing or changed source data');
for(const patch of lunar.patches){
  const bytes=await readFile(new URL(patch.rawFile.replace(/^data\//,''),base));
  if(hash(bytes)!==patch.sha256)throw Error(`Lunar patch hash mismatch: ${patch.id}`);
  const values=Array.from({length:25},(_,i)=>bytes.readInt16LE(Math.floor(i/5)*10116+(i%5)*2));
  if(values.some((n,i)=>n!==patch.rawDigitalNumbers[i]||n<0||n>25000))throw Error(`Lunar patch changed: ${patch.id}`);
  if(Math.abs(values.reduce((a,b)=>a+b,0)/25*lunar.scaleFactor-patch.meanFraction)>1e-12)throw Error(`Lunar mean mismatch: ${patch.id}`);
}
const result={
  sep:{id:sep.sepID,eventTime:sep.eventTime,instruments:sep.instruments,link:sep.link,versionId:sep.versionId},
  marsLightTime:{date:'2026-11-14T00:00:00Z',oneWayMinutes:Number(row[1]),target:'Mars (499)',observer:'Earth (399)',ephemeris:'mar099 / DE441'},
  lettuceReference:{studyId:study.identifier,title:study.title,lightHours:16,darkHours:8,context:'ISS Veggie experiment; cultivation timing is a reference, not a Mars growth-rate measurement.'},
  lunarIllumination:{productId:lunar.productId,pixelSizeMeters:60,averagingYears:18.6,patches:lunar.patches.map(({id,centerRow1Based,centerSample1Based,meanFraction})=>({id,centerRow1Based,centerSample1Based,meanFraction}))},
  curiosityRad:curiosity,
  moonLightTime:{date:'2026-11-14T00:00:00Z',oneWayMinutes:Number(moonRow[1]),target:'Moon (301)',observer:'Earth (399)',ephemeris:'DE441'}
};
// These records are maintained by their own extraction workflows.
const provenanceFile=new URL('provenance.json',base);
const existing=JSON.parse(await readFile(provenanceFile,'utf8'));
const separatelyMaintainedIds=['hirise-jezero-dtm-023524','opportunity-2018-dust-storm-power','osd-269-veggie-fan-anomaly'];
const metadata=[
  {id:'donki-sep-2024-05-10-goes',basisKind:'observation',title:'DONKI Solar Energetic Particle event',agency:'NASA CCMC',sourceUrl:sep.link,recordId:sep.sepID,version:String(sep.versionId),observationTime:sep.eventTime,retrievedAt:'2026-11-07T19:32:52Z',location:'GOES-P: SEISS',units:{energy:'>10 MeV'},qualityNotes:['Catalog record near Earth; not a measurement at Mars.'],rawFile:'data/raw/donki-sep-2024-05.json',sha256:hash(donki),transforms:['Select event by sepID; retain event time and instrument.'],usedBy:['solar-shelter'],limitation:'Historical context only; the training hazard and shielding factors are authored, not a Mars forecast or a medical dose.'},
  {id:'horizons-mars-earth-2026-11-14',basisKind:'derived',title:'JPL Horizons observer ephemeris, Mars from Earth',agency:'NASA JPL',sourceUrl:'https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND=%27499%27&OBJ_DATA=%27YES%27&MAKE_EPHEM=%27YES%27&EPHEM_TYPE=%27OBSERVER%27&CENTER=%27500%40399%27&START_TIME=%272026-11-14%27&STOP_TIME=%272026-11-16%27&STEP_SIZE=%271%20d%27&QUANTITIES=%2721%27',recordId:'499 / 500@399 / quantity 21',version:'Horizons API 1.2; mar099 / DE441',observationTime:'2026-11-14T00:00:00Z',retrievedAt:'2026-11-07T19:32:44Z',location:'Earth and Mars centers',units:{oneWayLightTime:'minutes'},qualityNotes:['Ephemeris prediction; surface locations and two-way asymmetry are approximated.'],rawFile:'data/raw/horizons-mars-earth-2026-11.txt',sha256:hash(horizons),transforms:['Select 2026-Nov-14 00:00 row; convert minutes to seconds in the scenario.'],usedBy:['earth-delay','extended'],limitation:'Center-to-center down-leg light time approximates both directions; Earth processing time is authored.'},
  {id:'osdr-osd-269',basisKind:'reference',title:study.title,agency:'NASA OSDR',sourceUrl:'https://osdr.nasa.gov/bio/repo/data/studies/OSD-269',recordId:study.identifier,version:'Metadata API response; unversioned retrieval',observationTime:null,retrievedAt:'2026-11-07T19:47:17Z',location:'ISS Veggie and ground control',units:{photoperiod:'hours light:hours dark'},qualityNotes:['OSDR study metadata documents a 16:8 light-dark protocol.'],rawFile:'data/raw/osdr-osd-269.json',sha256:hash(osdr),transforms:['Extract a 16:8 light:dark protocol value; convert hours to seconds.'],usedBy:['greenhouse','extended'],limitation:'ISS lettuce study; fictional Mars yield, water, energy, stress and growth rates are not measured by this record.'},
  {id:'nasa-life-support-baseline',basisKind:'reference',title:reference.title,agency:'NASA',sourceUrl:'https://ntrs.nasa.gov/citations/20210024855',recordId:'20210024855',version:'NASA/TP-2015-218570/REV2',observationTime:null,retrievedAt:'2026-11-07T19:47:46Z',location:null,units:{},qualityNotes:['Reference context only; no numerical BVAD values are used by the game.'],rawFile:'data/raw/ntrs-20210024855.json',sha256:hash(ntrs),transforms:[],usedBy:['greenhouse'],limitation:'This document supplies life-support context, not the game’s fictional daily budget.'},
  {id:'lola-south-polar-illumination',basisKind:'derived',title:'LOLA average south polar solar illumination',agency:'NASA LRO LOLA',sourceUrl:'https://pgda.gsfc.nasa.gov/products/69',recordId:lunar.productId,version:lunar.productVersion,observationTime:null,retrievedAt:lunar.retrievedAt,location:'Lunar south polar stereographic raster',units:{illumination:'fraction of modeled timesteps'},qualityNotes:['5 by 5 pixel windows; 60 m per pixel; source label and byte-range excerpts are bundled.'],rawFile:'data/raw/lunar-illumination/patches.json',sha256:hash(lunarRaw),transforms:['Read little-endian signed 16-bit pixels, apply 0.00004 scale, average each 5-by-5 window.'],usedBy:['lunar-sunlight'],limitation:'Long-term modeled averages do not predict illumination during the fictional training window; the example windows are not claimed to be adjacent.'},
  {id:'nasa-blue-ghost-eds-2025',basisKind:'reference',title:'Blue Ghost Begins Surface Operations, Captures Descent Video, Sunrise',agency:'NASA',sourceUrl:'https://www.nasa.gov/blogs/missions/2025/03/04/blue-ghost-begins-surface-operations-captures-descent-video-sunrise/',recordId:'NASA Blue Ghost surface operations, 2025-03-04',version:'Unversioned web page',observationTime:null,retrievedAt:'2026-11-08T02:36:55Z',location:'Lunar surface',units:{},qualityNotes:['Article reports dust removal from glass and thermal radiator surfaces.'],rawFile:'data/raw/nasa-blue-ghost-eds-2025.html',sha256:hash(eds),transforms:[],usedBy:['lunar-dust'],limitation:'Technology inspiration only. The game rack, dust, cleaning rates, filter and air-cycle parameters are authored; it is not a demonstrated whole-suit cleaner.'},
  {id:'horizons-moon-earth-2026-11-14',basisKind:'derived',title:'JPL Horizons observer ephemeris, Moon from Earth',agency:'NASA JPL',sourceUrl:'https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND=%27301%27&OBJ_DATA=%27YES%27&MAKE_EPHEM=%27YES%27&EPHEM_TYPE=%27OBSERVER%27&CENTER=%27500%40399%27&START_TIME=%272026-11-14%27&STOP_TIME=%272026-11-16%27&STEP_SIZE=%271%20d%27&QUANTITIES=%2721%27',recordId:'301 / 500@399 / quantity 21',version:'Horizons API 1.2; DE441',observationTime:'2026-11-14T00:00:00Z',retrievedAt:'2026-11-08T02:41:18Z',location:'Earth and Moon centers',units:{oneWayLightTime:'minutes'},qualityNotes:['Ephemeris calculation; surface locations are approximated.'],rawFile:'data/raw/horizons-moon-earth-2026-11.txt',sha256:hash(moonHorizons),transforms:['Select 2026-Nov-14 00:00 row; convert minutes to seconds.'],usedBy:['lunar-relay'],limitation:'Center-to-center light time approximates the fictional surface route; link blockage is an authored geometry model.'},
  {id:'nasa-lunar-propagation',basisKind:'reference',title:'Lunar Surface Propagation',agency:'NASA Glenn',sourceUrl:'https://www.nasa.gov/glenn/glenn-expertise-space-exploration/scan/lunar-surface-propagation/',recordId:'NASA Glenn Lunar Surface Propagation',version:'Unversioned web page',observationTime:null,retrievedAt:'2026-11-08T02:41:19Z',location:'Lunar surface',units:{},qualityNotes:['Background on lunar surface communications.'],rawFile:'data/raw/nasa-lunar-propagation.html',sha256:hash(propagation),transforms:[],usedBy:['lunar-relay'],limitation:'The fictional ridge geometry and relay budget are teaching assumptions rather than a validated radio-link calculation.'},
  ...separatelyMaintainedIds.map(id=>{
    const source=existing.find(record=>record.id===id);
    if(!source)throw Error(`Missing separately maintained source: ${id}`);
    return source;
  }),
  {
    id:curiosity.id,basisKind:'reference',title:'Curiosity RAD and the 20 May 2024 solar particle event',
    agency:'NASA/JPL',sourceUrl:curiosity.sourceUrl,recordId:curiosity.id,version:curiosity.publicationDate,
    observationTime:curiosity.eventDate,location:curiosity.location,units:{reportedAbsorbedDose:'microgray'},
    qualityNotes:['Manually transcribed from a dated NASA/JPL event summary. This record does not contain raw RAD telemetry.'],
    rawFile:'data/raw/curiosity-rad-2024-05-20.json',sha256:hash(curiosityRaw),
    transforms:['Divide the reported absorbed dose by 81 µGy per training point to set the outdoor baseline.'],
    usedBy:['extended'],
    limitation:'The detector reference is specific to one event at Curiosity. Base Boss shelter factors and exposure points are authored and do not estimate astronaut dose.'
  }
];
await writeFile(new URL('normalized.json',base),JSON.stringify(result,null,2)+'\n');
const moduleData=new URL('../data/',import.meta.url);await mkdir(moduleData,{recursive:true});
await writeFile(new URL('normalized.json',moduleData),JSON.stringify(result,null,2)+'\n');
await writeFile(provenanceFile,JSON.stringify(metadata,null,2)+'\n');
console.log(`Normalized ${sep.sepID} and ${result.marsLightTime.oneWayMinutes} min one-way light time.`);
