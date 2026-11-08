// After regenerating a voice set, record which text each clip now speaks.
// Usage: node scripts/mark-voices-recorded.mjs storm|m2|orbit
import {readFileSync,writeFileSync} from 'node:fs';
const files={storm:'dialogue-lines.json',m2:'dialogue-lines-m2.json',orbit:'dialogue-lines-orbit.json'};
const set=process.argv[2];if(!files[set]){console.error('Choose one of: '+Object.keys(files).join(', '));process.exit(1);}
const root=new URL('../',import.meta.url),recorded=JSON.parse(readFileSync(new URL('voice-recorded.json',root),'utf8'));
recorded[set]=Object.fromEntries(Object.entries(JSON.parse(readFileSync(new URL(files[set],root),'utf8'))).map(([id,line])=>[id,line.text]));
writeFileSync(new URL('voice-recorded.json',root),JSON.stringify(recorded,null,1)+'\n');console.log(`Marked ${Object.keys(recorded[set]).length} ${set} clips as matching their text.`);
