// Multiple active slots are independent party members, not summoned helpers.
let multi=null;
const multiOriginal={renderHp,renderStages,renderHeis,renderActive,faintMon,enemyTargets,show};
const multiOther=s=>s==='me'?'foe':'me';
const multiLiving=s=>multi.slots[s].filter(m=>m&&!m.fainted&&m.curHp>0);
const multiBench=s=>multi.teams[s].filter(m=>!m.fainted&&m.curHp>0&&!multi.slots[s].includes(m));
function multiImage(m){return 'multi-img-'+m.multiId;}
function renderMulti(){
  if(!multi)return;
  document.getElementById('multiField').innerHTML=['foe','me'].map(s=>`<div class="sub">${sideLabel(s)}・${battleSize===2?'ダブル':'トリプル'}（残り${multi.teams[s].filter(m=>!m.fainted).length}体）</div><div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap">${multi.slots[s].map(m=>m?`<div class="mon-card" style="flex:1;min-width:100px;text-align:center"><img id="${multiImage(m)}" src="${IMG(m.img)}" style="width:100px;height:100px;object-fit:contain;opacity:${m.fainted?.35:1}"><div>${m.name}</div><div>HP ${m.curHp} / ${m.maxHp}</div><progress value="${m.curHp}" max="${m.maxHp}" style="width:100%"></progress><div>${stgText(m)||'能力変化なし'}</div></div>`:'').join('')}</div>`).join('');
}
renderHp=function(){if(multi)renderMulti();else multiOriginal.renderHp();};
renderStages=function(){if(multi)renderMulti();else multiOriginal.renderStages();};
renderHeis=function(){if(multi)renderMulti();else multiOriginal.renderHeis();};
renderActive=function(){if(multi)renderMulti();else multiOriginal.renderActive();};
faintMon=function(m,img){if(!multi)return multiOriginal.faintMon(m,img);if(!m.fainted){m.fainted=true;m.curHp=0;pushLog(`${m.name} は たおれた！`);}renderMulti();};
enemyTargets=function(s){return multi?multiLiving(multiOther(s)):multiOriginal.enemyTargets(s);};
show=function(id){if(id!=='battle'&&multi){multi=null;document.getElementById('multiField')?.remove();document.querySelector('#battle .field').style.display='';}multiOriginal.show(id);};
function startMultiFriend(size){battleSize=size;mode='friend';openPartyBuilder('p1');}
const singleFriendSetup=startFriendSetup;
startFriendSetup=function(){battleSize=1;singleFriendSetup();};
const singleFriendSelect=startFriendSelect;
startFriendSelect=function(){
  if(battleSize===1)return singleFriendSelect();
  const count=battleSize*2;
  const select=(owner,src,reveal,cb)=>{selCtx={owner,src,reveal,sel:[],count,label:`${owner==='p1'?'プレイヤー1':'プレイヤー2'}：${count}体選択（最初の${battleSize}体が先発）`,cb};show('preview');renderPreview();};
  select('p1',party,party2,()=>{const p1=selCtx.sel.slice();select('p2',party2,party,()=>startBattleWith(party,p1,party2,selCtx.sel.slice()));});
};
document.querySelector('#home .menu').insertAdjacentHTML('beforeend','<button class="btn ghost" onclick="startMultiFriend(2)">👥 ダブル・フレンド対戦（同じ端末）</button><button class="btn ghost" onclick="startMultiFriend(3)">👥 トリプル・フレンド対戦（同じ端末）</button>');
function startMultiBattle(p1,sel1,p2,sel2){
  multiOriginal.show('battle');
  myTeam=sel1.map(i=>makeMon(p1[i].sp,p1[i].item,'p1'));
  foeTeam=sel2.map(i=>makeMon(p2[i].sp,p2[i].item,mode==='friend'?'p2':'cpu'));
  multi={teams:{me:myTeam,foe:foeTeam},slots:{me:myTeam.slice(0,battleSize),foe:foeTeam.slice(0,battleSize)},actions:[],round:0};
  [...myTeam,...foeTeam].forEach((m,i)=>{m.multiId=i;m.isHei=false;});
  me=myTeam[0];foe=foeTeam[0];weather=null;weatherTurns=grassTurns=electricTurns=psychicTurns=mistTurns=0;hazards=emptyHazards();
  document.querySelector('#battle .field').style.display='none';
  document.getElementById('multiField')?.remove();
  document.getElementById('battle').insertAdjacentHTML('afterbegin','<div id="multiField"></div>');
  document.getElementById('log').innerHTML='';document.getElementById('endArea').classList.add('hidden');
  renderMulti();
  series(['me','foe'].flatMap(s=>multi.slots[s].map(m=>cb=>multiEntry(s,m,cb))),multiNext);
}
function multiEntry(s,m,cb){
  me=s==='me'?m:multiLiving('me')[0]||myTeam[0];foe=s==='foe'?m:multiLiving('foe')[0]||foeTeam[0];
  pushLog(`${sideLabel(s)} は ${m.name} を くりだした！`);
  if(m.id==='zacian'&&m.stoneMatches&&!m.isMega){transformZacian(m,multiImage(m),cb);return;}
  applyEntry(m,multiImage(m),cb);
}
function multiNext(){
  if(!multi)return;multi.round++;multi.actions=[];
  [...multiLiving('me'),...multiLiving('foe')].forEach(m=>{m.turnMoved=false;m.flinched=false;m.protectActive=false;m.hitBeforeMove=false;if(m.protectCooldown>0)m.protectCooldown--;});
  multiChoose('me');
}
function multiChoose(s){
  busy=false;inputSide=s;renderMulti();
  const enemies=multiLiving(multiOther(s)),bench=multiBench(s);
  document.getElementById('cmd').innerHTML=`<div class="sub">${sideLabel(s)}：全員の技と対象を選択（${multi.round}ターン目）</div>`+multiLiving(s).map(m=>`<div class="mon-card"><div>${m.name}</div><select id="multi-action-${m.multiId}">${m.moves.map((mv,i)=>`<option value="m${i}" ${m.electroBeamReady&&!mv.chargeTurn?'disabled':''}>${mv.name}（${catLabel(mv)}・威力${mv.power}）</option>`).join('')}${bench.map(b=>`<option value="s${b.multiId}">交代：${b.name}</option>`).join('')}</select><select id="multi-target-${m.multiId}">${enemies.map(t=>`<option value="${t.multiId}">${t.name} HP${t.curHp}</option>`).join('')}</select></div>`).join('')+`<button class="btn" onclick="multiConfirm('${s}')">全員の行動を決定</button>`;
}
function multiConfirm(s){
  const actions=multiLiving(s).map(mon=>{const v=document.getElementById('multi-action-'+mon.multiId).value;return {side:s,mon,type:v[0]==='s'?'switch':'move',replacement:multi.teams[s].find(m=>m.multiId===Number(v.slice(1))),move:mon.electroBeamReady?M.electrobeam:mon.moves[Number(v.slice(1))],target:multi.teams[multiOther(s)].find(m=>m.multiId===Number(document.getElementById('multi-target-'+mon.multiId).value))};});
  const switches=actions.filter(a=>a.type==='switch');
  if(new Set(switches.map(a=>a.replacement)).size!==switches.length){alert('同じ控えを複数の場所へ出すことはできません。');return;}
  if(switches.some(a=>a.mon.switchLock>0)){alert('交代不能のポケモンがいます。');return;}
  multi.actions.push(...actions);
  if(s==='me'&&mode==='friend'){document.getElementById('cmd').innerHTML='<div class="sub">プレイヤー2に交代してください</div><button class="btn" onclick="multiChoose(\'foe\')">プレイヤー2の入力へ</button>';return;}
  if(s==='me')multiLiving('foe').forEach(mon=>{
    const options=mon.moves.flatMap(move=>multiLiving('me').map(target=>({side:'foe',mon,type:'move',move:mon.electroBeamReady?M.electrobeam:move,target})));
    const valid=options.filter(a=>a.move.cat==='status'||calcDamage(mon,a.target,a.move,false).eff>0);
    const pool=valid.length?valid:options;
    pool.sort((a,b)=>calcDamage(mon,b.target,b.move,false).dmg-calcDamage(mon,a.target,a.move,false).dmg);
    multi.actions.push(Math.random()<.8?pool[0]:pickOne(pool));
  });
  multiResolve();
}
function multiSwitch(a,cb){
  const slots=multi.slots[a.side],i=slots.indexOf(a.mon);
  if(i<0||!multiBench(a.side).includes(a.replacement)){cb();return;}
  a.mon.stages={atk:0,spa:0,def:0,spd:0,spe:0};a.mon.subHp=0;a.mon.electroBeamReady=false;
  slots[i]=a.replacement;a.replacement.firstTurnReady=true;a.replacement.acted=0;
  me=a.side==='me'?a.replacement:multiLiving('me')[0]||myTeam[0];foe=a.side==='foe'?a.replacement:multiLiving('foe')[0]||foeTeam[0];
  renderMulti();applyHazards(a.side,()=>a.replacement.fainted?cb():multiEntry(a.side,a.replacement,cb));
}
function multiResolve(){
  busy=true;clearCmd();
  const actions=multi.actions.slice().sort((a,b)=>(b.type==='switch'?10:movePriority(b.mon,b.move))-(a.type==='switch'?10:movePriority(a.mon,a.move))||effSpeed(b.mon)-effSpeed(a.mon));
  series(actions.map(a=>cb=>{
    if(!multi.slots[a.side].includes(a.mon)||a.mon.fainted){cb();return;}
    if(a.type==='switch'){multiSwitch(a,cb);return;}
    const enemies=multiLiving(multiOther(a.side));
    const target=enemies.includes(a.target)?a.target:enemies[0];if(!target){cb();return;}
    const m=a.mon;
    if(m.flinched||m.status==='paralyze'&&Math.random()<.2||m.status==='hypersleep'&&Math.random()<.25){pushLog(`${m.name} は動けない！`);cb();return;}
    if(m.status==='sleep'&&--m.sleepTurns>0){pushLog(`${m.name} は眠っている！`);cb();return;}if(m.status==='sleep')m.status=null;
    if(m.status==='freeze'){if(Math.random()>=.25){cb();return;}m.status=null;}
    me=a.side==='me'?m:target;foe=a.side==='foe'?m:target;
    turnAct={me:{type:'move'},foe:{type:'move'}};
    m.turnMoved=true;
    attack(m,target,a.move,multiImage(target),()=>{renderMulti();cb();});
  }),multiEnd);
}
function multiEnd(){
  ['me','foe'].forEach(s=>multiLiving(s).slice().forEach(m=>{
    const target=multiLiving(multiOther(s))[0]||multi.teams[multiOther(s)][0];
    me=s==='me'?m:target;foe=s==='foe'?m:target;
    applyResidual(m,multiImage(m),target);
    if(m.curHp<=0){faintMon(m,multiImage(m));return;}
    if(m.itemKey==='toxicorb'&&!m.status)applyStatus(m,'poison',m);
    if(m.abilEff==='poisonheal'&&(m.status==='poison'||m.status==='toxic'))m.curHp=Math.min(m.maxHp,m.curHp+Math.max(1,Math.floor(m.maxHp/7)));
    if(m.itemKey==='leftovers')m.curHp=Math.min(m.maxHp,m.curHp+Math.max(1,Math.floor(m.maxHp/16)));
    if(m.abilEff==='speedboost')applyDrop(m,{spe:1});
    if(m.yawnTurns>0&&--m.yawnTurns===0&&!m.status){m.status='sleep';m.sleepTurns=2+Math.floor(Math.random()*2);}
    if(m.switchLock>0)m.switchLock--;
  }));
  if(weatherTurns>0&&--weatherTurns===0)weather=null;
  if(electricTurns>0)electricTurns--;if(grassTurns>0)grassTurns--;if(psychicTurns>0)psychicTurns--;if(mistTurns>0)mistTurns--;
  renderMulti();multiReplace();
}
function multiReplace(){
  if(!multi.teams.foe.some(m=>!m.fainted)||!multi.teams.me.some(m=>!m.fainted)){finish(multi.teams.me.some(m=>!m.fainted));return;}
  for(const s of ['me','foe']){
    const dead=multi.slots[s].find(m=>m.fainted),bench=multiBench(s);
    if(!dead||!bench.length)continue;
    if(s==='foe'&&mode==='cpu'){multiSwitch({side:s,mon:dead,replacement:bench[0]},multiReplace);return;}
    busy=false;
    document.getElementById('cmd').innerHTML=`<div>${sideLabel(s)}：${dead.name} の代わりを選択</div>`+bench.map(m=>`<button class="btn" onclick="multiPickReplacement('${s}',${dead.multiId},${m.multiId})">${m.name} HP${m.curHp}</button>`).join('');return;
  }
  multiNext();
}
function multiPickReplacement(side,id,next){busy=true;clearCmd();multiSwitch({side,mon:multi.teams[side].find(m=>m.multiId===id),replacement:multi.teams[side].find(m=>m.multiId===next)},multiReplace);}
