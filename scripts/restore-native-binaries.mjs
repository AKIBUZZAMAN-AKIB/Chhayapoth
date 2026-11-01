#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(path.join(root,'native-binaries.lock.json'),'utf8'));
const hash=data=>createHash('sha256').update(data).digest('hex');
for(const item of manifest.files){
 const dest=path.join(root,item.path);
 const existing=await fs.readFile(dest).catch(()=>null);
 if(existing&&hash(existing)===item.sha256){console.log('Verified:',item.path);continue;}
 if(process.argv.includes('--verify'))throw new Error('Missing or changed native binary: '+item.path);
 const url=`https://raw.githubusercontent.com/${manifest.upstream}/${manifest.commit}/${item.path}`;
 const response=await fetch(url,{signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw new Error(`Download failed (${response.status}): ${item.path}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length!==item.bytes||hash(bytes)!==item.sha256)throw new Error('Native binary integrity mismatch: '+item.path);
 await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest+'.tmp',bytes);await fs.rename(dest+'.tmp',dest);
 console.log('Restored and verified:',item.path);
}
