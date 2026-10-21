import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
for(const key of ['id="lobby"','id="dormModal"','id="sanctuary"','id="sanctModal"','id="storeModal"','id="portalModal"','id="menuModal"','id="roster"','id="lobbyHero"','id="lobbyNav"','id="summon','id="characters"','id="inventory"','id="world"','id="lobbyActions"','class="lobby']){
 const p=html.indexOf(key);console.log('MARK',key,p,p<0?'':html.slice(p-130,p+950).replace(/\s+/g,' ').slice(0,1080));
}
const s=html.match(/<section[^>]*id="lobby"[\s\S]{0,15000}/);
console.log('LOBBY',s?.[0]?.slice(0,12500).replace(/\s+/g,' '));
const area=html.indexOf('const portalBody=');
console.log('DYNAMIC',html.slice(area,area+7000).replace(/\s+/g,' '));
