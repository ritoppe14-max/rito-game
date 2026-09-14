const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const elements=new Map();
function el(id){if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',style:{},value:'',classList:{add(){},remove(){},toggle(){},contains(){return false;}},appendChild(){},insertAdjacentHTML(){},remove(){},addEventListener(){},parentElement:{appendChild(){}}});return elements.get(id);}
const c=vm.createContext({console,Math,Set,Map,JSON,Date,document:{getElementById:el,querySelector:el,querySelectorAll:()=>[],createElement:()=>el('new'),addEventListener(){}},window:{addEventListener(){},removeEventListener(){}},localStorage:{getItem(){return null;},setItem(){}},setTimeout:fn=>fn(),clearTimeout(){},setInterval(){},clearInterval(){},alert:msg=>{throw Error(msg);}});
const html=fs.readFileSync('index.html','utf8');
for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))vm.runInContext(m[1],c);
vm.runInContext(fs.readFileSync('multi-battle.js','utf8'),c);
vm.runInContext(`
  function check(ok,msg){if(!ok)throw Error(msg);}
  for(const size of [2,3]){
    battleSize=size;mode='friend';
    const p=Array.from({length:size*2},()=>({sp:SP_BY_ID.duraludon,item:'none'}));
    startBattleWith(p,p.map((_,i)=>i),p,p.map((_,i)=>i));
    check(multiLiving('me').length===size,'active slots');
    check(multiBench('me').length===size,'bench');
    const old=multi.slots.me[0],next=multiBench('me')[0];
    multiSwitch({side:'me',mon:old,replacement:next},()=>{});
    check(multi.slots.me[0]===next&&!multiLiving('me').includes(old),'switch');
    const cover=multiLiving('me')[0],hidden=multiLiving('me')[1];
    multiSetBehind(hidden,cover);check(hidden.behindOf===cover&&!multiVisible('me').includes(hidden),'behind ally cannot be targeted');
    multiClearBehind(cover);check(!hidden.behindOf,'behind state clears with ally');
    const order=[];const realAttack=attack;attack=(a,d,m,img,cb)=>{order.push(a);cb();};
    multi.actions=['me','foe'].flatMap(side=>multiLiving(side).map((mon,i)=>{mon.base.spe=20+i+(side==='me'?30:0);return {side,mon,type:'move',move:M.thunderbolt,target:multiLiving(multiOther(side))[0]};}));
    multiResolve();
    check(order.length===size*2,'all slots act');
    check(order.every((m,i)=>i===0||effSpeed(order[i-1])>=effSpeed(m)),'speed order');
    attack=realAttack;
    // A real attack should resolve without a DOM or callback exception.
    const a=multiLiving('me')[0],d=multiLiving('foe')[0];me=a;foe=d;
    const hp=d.curHp;attack(a,d,M.thunderbolt,multiImage(d),()=>{});
    check(d.curHp<hp,'real damage');
    show('home');check(!multi,'leave battle');
  }
  const dura=makeMon(SP_BY_ID.duraludon,'none','p1'), fire=makeMon(SP_BY_ID.centiskorch,'none','cpu');
  me=dura;foe=fire;battleSize=1;
  const single=calcDamage(dura,fire,M.duraludonCannon,false);
  check(single.eff===1,'Duraludon cannon ignores type effectiveness');
  battleSize=2;const multiDmg=calcDamage(dura,fire,M.duraludonCannon,false).dmg;
  check(multiDmg>=Math.floor(single.dmg*1.49),'Duraludon cannon multi boost');
  const fairy=makeMon(SP_BY_ID.marilli,'none','cpu');
  check(M.duraludonDisaster.type==='dragon','Duraludon Disaster is Dragon type');
  check(M.duraludonDisaster.onceBattle&&M.duraludonDisaster.onceFlag==='usedDuraludonDisaster','Duraludon Disaster is once per battle');
  check(SP_BY_ID.empoleon!==undefined&&M.hydrocannon.power===120&&M.hydrocannon.trapTurns===3&&M.hydrocannon.trapDenom===10,'Empoleon Hydro Cannon and residual effect');
  battleSize=1;const intelSingle=makeMon(SP_BY_ID.inteleon,'none','p1');battleSize=2;const intelMulti=makeMon(SP_BY_ID.inteleon,'none','p1');
  check(intelSingle.base.spa===140&&intelMulti.base.spa===125&&intelSingle.base.spe===150,'Inteleon single and multi stats');
  intelSingle.isDynamax=true;intelSingle.isGigantamax=true;const gmaxSnipe=maxMoveFor(intelSingle,M.snipeshot);
  check(gmaxSnipe.name==='キョダイソゲキ'&&gmaxSnipe.power===140&&gmaxSnipe.ignoreAbility&&gmaxSnipe.forceCrit,'Inteleon G-Max Snipe Shot');
  const normalCrit=Object.assign({},intelSingle,{abilEff:null});
  check(calcDamage(intelSingle,fire,M.snipeshot,true).dmg>calcDamage(normalCrit,fire,M.snipeshot,true).dmg,'Sniper raises critical damage');
  const wool=makeMon(SP_BY_ID.dubwool,'none','p1'),woolPlain=Object.assign({},wool,{abilEff:null});
  check(wool.base.hp===100&&wool.base.def===100&&calcDamage(fire,wool,M.crunch,false).dmg<calcDamage(fire,woolPlain,M.crunch,false).dmg,'Dubwool Fluffy halves physical damage');
  const gengar=SPECIES[SP_BY_ID.gengar];
  check(gengar.types.includes('ghost')&&gengar.types.includes('poison')&&gengar.megas[0].base.spa===170&&gengar.megas[0].abil==='shadowtag','Gengar and Mega Gengar');
  const corviknight=SPECIES[SP_BY_ID.corviknight];
  check(corviknight.types.includes('flying')&&corviknight.types.includes('steel')&&corviknight.base.def===105&&corviknight.abil==='mirrorarmor','Corviknight');
  const thievul=SPECIES[SP_BY_ID.thievul];
  check(thievul.types[0]==='dark'&&thievul.base.spa===87&&thievul.base.spe===90&&thievul.abil==='unburden','Thievul');
  const obstagoon=SPECIES[SP_BY_ID.obstagoon];
  check(obstagoon.types.includes('dark')&&obstagoon.types.includes('normal')&&obstagoon.base.def===101&&obstagoon.abil==='defiant','Obstagoon');
  const drednaw=makeMon(SP_BY_ID.drednaw,'none','p1'),drednawPlain=Object.assign({},makeMon(SP_BY_ID.drednaw,'none','p1'),{abilEff:null});
  check(drednaw.types.includes('water')&&drednaw.types.includes('rock')&&drednaw.base.atk===115&&calcDamage(drednaw,fire,M.crunch,false).dmg>calcDamage(drednawPlain,fire,M.crunch,false).dmg,'Drednaw Strong Jaw');
  const hold=makeMon(SP_BY_ID.hold,'none','p1'),holdPlain=Object.assign({},makeMon(SP_BY_ID.hold,'none','p1'),{abilEff:null});
  check(hold.types.includes('normal')&&hold.types.includes('ground')&&calcDamage(hold,fire,M.earthquake,false).dmg>calcDamage(holdPlain,fire,M.earthquake,false).dmg,'Hold Huge Power');
  const galvantula=SPECIES[SP_BY_ID.galvantula];
  check(galvantula.types.includes('bug')&&galvantula.types.includes('electric')&&galvantula.base.spa===97&&galvantula.abil==='compoundeyes','Galvantula');
  const joltik=makeMon(SP_BY_ID.joltik,'eviolite','p1'),joltikPlain=makeMon(SP_BY_ID.joltik,'none','p1');
  check(joltik.base.hp===75&&joltik.base.def===75&&joltik.base.spd===75&&calcDamage(fire,joltik,M.fireblast,false).dmg<calcDamage(fire,joltikPlain,M.fireblast,false).dmg,'Boosted Joltik receives Eviolite bulk');
  const mamoswine=makeMon(SP_BY_ID.mamoswine,'none','p1'),mamoswinePlain=Object.assign({},makeMon(SP_BY_ID.mamoswine,'none','p1'),{abilEff:null});
  check(mamoswine.base.hp===110&&mamoswine.base.atk===130&&calcDamage(fire,mamoswine,M.fireblast,false).dmg<calcDamage(fire,mamoswinePlain,M.fireblast,false).dmg,'Mamoswine Thick Fat');
  const glalie=SPECIES[SP_BY_ID.glalie];
  check(glalie.types[0]==='ice'&&Object.values(glalie.base).every(v=>v===80)&&glalie.abil==='moody','Glalie');
  const crustle=SPECIES[SP_BY_ID.crustle];
  check(crustle.types.includes('bug')&&crustle.types.includes('rock')&&M.crustlerockTomb.power===80&&M.crustlerockTomb.switchLock===2&&M.crustlerockTomb.targetDrop.stats.spe===-1,'Crustle Rock Tomb');
  const kingler=SPECIES[SP_BY_ID.kingler];
  check(kingler.types[0]==='water'&&kingler.base.atk===150&&kingler.base.spe===50&&kingler.moves.includes('crabhammer'),'Kingler custom stats');
  const cloyster=SPECIES[SP_BY_ID.cloyster];
  check(cloyster.types.includes('water')&&cloyster.types.includes('ice')&&cloyster.base.atk===85&&cloyster.base.def===180,'Cloyster custom attack');
  const wishiwashi=makeMon(SP_BY_ID.wishiwashi,'none','p1');
  check(wishiwashi.base.hp===90&&wishiwashi.base.def===120&&wishiwashi.base.spd===120,'Wishiwashi school form stats');
  wishiwashi.curHp=Math.floor(wishiwashi.maxHp/4); updateWishiwashiForm(wishiwashi,'myImg');
  check(!wishiwashi.schoolForm&&wishiwashi.base.def===20&&wishiwashi.base.spd===25,'Wishiwashi solo form at quarter HP');
  const pyukumuku=SPECIES[SP_BY_ID.pyukumuku];
  check(pyukumuku.base.hp===150&&pyukumuku.base.def===70&&pyukumuku.base.spd===70&&pyukumuku.abil==='innardsout','Pyukumuku custom stats and Innards Out');
  check(SPECIES[SP_BY_ID.joltik].learnset.includes('stickyweb')&&M.stickyweb.hazard==='stickyweb','Joltik Sticky Web');
  check(COMPETITIVE_MOVE_55.length===55&&SPECIES[SP_BY_ID.sableye].learnset.includes('reflect')&&M.reflect.reflect,'Competitive 55 and Sableye Reflect');
  const excadrill=SPECIES[SP_BY_ID.excadrill],gigalith=SPECIES[SP_BY_ID.gigalith];
  check(excadrill.types.includes('ground')&&excadrill.types.includes('steel')&&excadrill.base.atk===135&&excadrill.abil==='sandrush'&&gigalith.base.def===130&&gigalith.abil==='sandstream','Excadrill and Gigalith');
  const absolMega=makeMon(SP_BY_ID.absol,'absolzite','p1'); absolMega.base={hp:65,atk:164,def:60,spa:115,spd:60,spe:151}; absolMega.abilEff='sharpness'; absolMega.isMega=true;
  const absolPlain=Object.assign({},absolMega,{abilEff:null});
  check(calcDamage(absolMega,fire,M.nightslash,false).dmg>calcDamage(absolPlain,fire,M.nightslash,false).dmg&&calcDamage(absolMega,fire,M.psychocut,false).dmg>calcDamage(absolPlain,fire,M.psychocut,false).dmg&&M.xscissor.cut,'Sharpness boosts cutting moves');
  check(calcDamage(dura,fairy,M.duraludonDisaster,false).eff===2,'Duraludon Disaster pierces Fairy immunity for 2x damage');
  const duraEviolite=makeMon(SP_BY_ID.duraludon,'eviolite','p1'),duraPlain=makeMon(SP_BY_ID.duraludon,'none','p1');
  check(calcDamage(fire,duraEviolite,M.fireblast,false).dmg<calcDamage(fire,duraPlain,M.fireblast,false).dmg,'Duraludon receives Eviolite bulk');
  hazards=emptyHazards();setHazard('foe','rocks',dura);setHazard('foe','rocks',dura);setHazard('foe','rocks',dura);
  check(hazards.foe.rocks===3,'Stealth Rock three layers');
  dura.duraludonShieldTurns=3;const shielded=calcDamage(fire,dura,M.fireblast,false).dmg;dura.duraludonShieldTurns=0;const plain=calcDamage(fire,dura,M.fireblast,false).dmg;
  check(shielded<=Math.ceil(plain*2/3),'Duraludon disaster shield');
  const cream=makeMon(SP_BY_ID.alcremie,'none','p1'),ally=makeMon(SP_BY_ID.duraludon,'none','p1'),enemy=makeMon(SP_BY_ID.centiskorch,'none','cpu');
  battleSize=2;me=cream;foe=enemy;ally.curHp=Math.floor(ally.maxHp*.4);
  attack(cream,ally,M.alcremieRecover,'myImg',()=>{});
  check(ally.curHp>Math.floor(ally.maxHp*.4),'Alcremie ally recovery');
  attack(cream,enemy,Object.assign({},M.magicalshine,{allyTarget:ally}),'foeImg',()=>{});
  check(ally.stages.atk===1&&ally.stages.spa===1,'Magical Shine decoration');
  cream.holeCakeTurns=3;ally.curHp=1;applyHoleCake([cream,ally]);
  check(ally.alcremieShieldHp===Math.floor(ally.maxHp*.25)&&ally.curHp>1,'Hole Cake ally shield and recovery');
`,c);
console.log('Double/triple, Duraludon and Alcremie features: battle actions, support, shields and hazards OK');
vm.runInContext(`
  multi=null;battleSize=1;mode='cpu';
  for(const [id,old] of Object.entries({escavalier:'shellarmor',mandibuzz:'roughskin',cramorant:'damp',durant:'sandforce'})){
    builds.p1[id].ability=old;
    check(makeMon(SP_BY_ID[id],'none','p1').abilEff===SPECIES[SP_BY_ID[id]].abil,'saved ability migration '+id);
    check(makeMon(SP_BY_ID[id],'none','cpu').abilEff===SPECIES[SP_BY_ID[id]].abil,'NPC ability '+id);
  }
  renderHome();renderTrain();openPartyBuilder('cpu');
  for(const id of ['clobbopus','grapploct','dracovish','arctovish','arctozolt','dracozolt','zamazenta']){
    const name=SPECIES[SP_BY_ID[id]].name;
    for(const grid of ['homeDex','trainGrid','dexGrid'])check(document.getElementById(grid).innerHTML.includes(name),grid+' shows '+name);
    check(makeMon(SP_BY_ID[id],'none').moves.every(Boolean),'valid moves '+id);
  }
  me=makeMon(SP_BY_ID.zamazenta,'rustedshield');foe=makeMon(SP_BY_ID.clobbopus,'none');
  applyEntry(me,'myImg',()=>{});check(me.name==='ザマゼンタ(王)'&&me.types.includes('steel')&&me.stages.def===1,'shield form and defense');
  me=makeMon(SP_BY_ID.mandibuzz,'none');foe=makeMon(SP_BY_ID.clobbopus,'none');me.curHp=10;foe.curHp=1;
  attack(me,foe,M.airslash,'foeImg',()=>{});check(me.curHp===me.maxHp,'KO full recovery');
  for(const fraction of [.9,.3]){
    me=makeMon(SP_BY_ID.cramorant,'none');foe=makeMon(SP_BY_ID.clobbopus,'none');
    me.curHp=Math.floor(me.maxHp*fraction);me.gulpReady=true;
    const hp=foe.curHp;
    attack(foe,me,{name:'test',type:'normal',cat:'phys',power:1},'myImg',()=>{});
    check(!me.gulpReady&&foe.curHp===hp-Math.floor(foe.maxHp/(fraction>.5?8:4)),'missile damage');
    check(fraction>.5?foe.stages.def===-1:foe.status==='paralyze','missile effect');
  }
`,c);
console.log('Saved abilities, all new Pokemon in three screens, shield form and custom effects OK');
vm.runInContext(`
  me=makeMon(SP_BY_ID.falinks,'none');foe=makeMon(SP_BY_ID.clobbopus,'none');
  for(const names of [['末っ子','甥っ子'],['次男','三男'],['四男']]){
    openHeiActions('me',{type:'move',move:M.beatup});
    for(const name of names)pickHei(name,{disabled:false});
    const menu=document.getElementById('cmd').innerHTML;
    check(menu.includes('決定')&&!menu.includes('[object Object]'),'repeat summon move menu');
    check(menu.includes('value="heicare"'),'existing and new helpers have valid move keys');
    check(summonFalinksHeis(me),'summon succeeds');
  }
  check(me.heis.length===5&&new Set(me.heis.map(h=>h.name)).size===5,'2+2+1 distinct helpers');
  check(!summonFalinksHeis(me),'fourth summon rejected');
`,c);
console.log('Falinks repeat summon: selection and 2+2+1 helpers OK');
vm.runInContext(`
  me=makeMon(SP_BY_ID.escavalier,'none');foe=makeMon(SP_BY_ID.clobbopus,'none');
  const noItemDamage=calcDamage(me,foe,M.escavalierKnockoff,false).dmg;
  foe.itemKey='rustedshield';foe.stoneMatches=true;
  check(calcDamage(me,foe,M.escavalierKnockoff,false).dmg===Math.floor(noItemDamage*1.5)||calcDamage(me,foe,M.escavalierKnockoff,false).dmg===Math.floor(noItemDamage*1.5)+1,'held item boosts Knock Off');
  attack(me,foe,M.escavalierKnockoff,'foeImg',()=>{});
  check(foe.itemKey==='none'&&!foe.stoneMatches,'Knock Off removes held item and transformation access');
  foe=makeMon(SP_BY_ID.clobbopus,'none');
  attack(me,foe,M.escavalierLunge,'foeImg',()=>{});
  check(foe.stages.atk===-1,'Lunge lowers attack');
  check(movePriority(me,M.escavalierBulletPunch)===1,'Bullet Punch priority');
  for(const move of [M.escavalierKnockoff,M.escavalierLunge,M.escavalierBulletPunch]){
    const boosted=calcDamage(me,foe,move,false).dmg;
    const plain=calcDamage({...me,abilEff:null},foe,move,false).dmg;
    check(boosted>plain,'Steel Knight boosts each new move');
  }
`,c);
console.log('Escavalier moves: item removal, attack drop, priority and Steel Knight OK');
vm.runInContext(`
  const aegIndex=SP_BY_ID.aegislash, aeg=SPECIES[aegIndex];
  check(aegIndex!==undefined&&aeg.name==='ギルガルド','Aegislash is registered');
  check(spMoves(aeg).length===5&&spMoves(aeg)[4]==='gilgamesh','Aegislash has its fixed fifth move');
  me=makeMon(aegIndex,'none');foe=makeMon(SP_BY_ID.clobbopus,'none');
  check(me.aegislashForm==='shield'&&me.base.def===150&&me.base.atk===50,'Aegislash starts in shield form');
  attack(me,foe,M.aegislashShadowClaw,'foeImg',()=>{});
  check(me.aegislashForm==='blade'&&me.base.atk===150&&me.base.def===50,'attacking changes Aegislash to blade form');
  attack(me,foe,M.kingsshield,'foeImg',()=>{});
  check(me.aegislashForm==='shield'&&me.protectActive&&me.kingShieldActive,'King Shield changes to shield form and protects');
  const physical={name:'test',type:'normal',cat:'phys',power:1};
  attack(foe,me,physical,'myImg',()=>{});
  check(foe.stages.atk===-1,'King Shield lowers a physical attacker attack');
  check(M.gilgamesh.type==='ghost'&&M.gilgamesh.power===170&&M.gilgamesh.ignoreDefBoost&&M.gilgamesh.koBoost.atk===1,'Gilgamesh is the requested Ghost fifth move');
`,c);
console.log('Aegislash: forms, shields, and Ghost fifth move OK');
vm.runInContext(`{
  const oldRandom=Math.random;Math.random=()=>.6;
  try {
    multi=null;battleSize=1;weather=null;
    renderHome();renderTrain();curParty=[];renderParty();
    for(const id of ['articuno','zapdos','moltres']){
      const sp=SPECIES[SP_BY_ID[id]];
      for(const screen of ['homeDex','trainGrid','dexGrid'])check(document.getElementById(screen).innerHTML.includes(sp.name),'bird visible in '+screen);
      check(spMoves(sp)[4]===BIRD_FIFTH[id]&&sp.learnset.every(k=>M[k]),'valid bird moves');
      check(makeMon(SP_BY_ID[id],'none','cpu').moves[4]===M[BIRD_FIFTH[id]],'CPU fifth slot');
    }
    const reset=(id='articuno')=>{me=makeMon(SP_BY_ID[id],'none');foe=makeMon(SP_BY_ID.clobbopus,'none');foe.maxHp=foe.curHp=100000;myTeam=[me];foeTeam=[foe];};
    reset();
    const normal=calcDamage(foe,me,M.icepunch,false).dmg;
    me.birdHail=true;check(calcDamage(foe,me,M.icepunch,false).dmg<normal,'snow cloak defense');
    attack(me,foe,M.iceAvalanche,'foeImg',()=>{});
    const hp=me.curHp;
    attack(foe,me,{type:'fire',cat:'spec',name:'shield test',power:100000},'myImg',()=>{});
    check(me.curHp===hp&&me.iceShieldHp===0,'huge hit breaks shield without overflow');
    attack(me,foe,M.iceAvalanche,'foeImg',()=>{});check(me.iceShieldHp===0,'shield once per battle');
    reset();attack(me,foe,M.birdBlizzard,'foeImg',()=>{});
    check(me.birdHail&&foe.birdBlizzardDot.turns===5,'blizzard hail and duration');
    const beforeDot=foe.curHp;for(let i=0;i<5;i++)birdEndTurn(foe,'foeImg');
    check(!foe.birdBlizzardDot&&foe.curHp<beforeDot,'five turns residual expire');
    const afterDot=foe.curHp;birdEndTurn(foe,'foeImg');check(foe.curHp===afterDot,'no sixth residual');
    reset('zapdos');let before=foe.curHp;
    attack(me,foe,M.birdZapCannon,'foeImg',()=>{});check(foe.curHp===before,'zap cannon misses at 60 percent roll');
    me.birdNextSure=true;attack(me,foe,M.birdZapCannon,'foeImg',()=>{});
    check(foe.curHp<before&&foe.status==='paralyze'&&!me.birdNextSure,'next move guaranteed hit and paralysis');
    Math.random=()=>.1;birdContact(foe,me,M.icebeam,10);check(me.birdNextSure,'static activates');Math.random=()=>.6;
    reset('moltres');for(let i=0;i<30;i++)birdContact(me,foe,M.birdSkyAttack,1);
    check(me.birdFlameMult===2,'flame body capped at twice attack');
    attack(me,foe,M.volcanoReign,'foeImg',()=>{});check(me.volcanoTurns===6,'volcano buff set');
    const boosted=calcDamage(me,foe,M.flamethrower,false).dmg;me.volcanoTurns=0;
    check(boosted>calcDamage(me,foe,M.flamethrower,false).dmg,'volcano damage boost');
    reset('zapdos');const other=makeMon(SP_BY_ID.clobbopus,'none');other.curHp=other.maxHp=100000;
    multi={teams:{me:[me],foe:[foe,other]},slots:{me:[me],foe:[foe,other]}};
    [me,foe,other].forEach((m,i)=>m.multiId=i);
    const damage=calcDamage(me,foe,M.thunderRoar,false).dmg;
    attack(me,foe,M.thunderRoar,'foeImg',()=>{});
    check(foe.curHp===100000-3*damage&&other.curHp===100000-3*damage,'three hits on both enemies');
    check(foe.birdSpdMult===.9&&other.birdSpdMult===.9&&me.birdSureTurns===3,'spread defense drop and two future turns sure hit');
    multi=null;reset('moltres');applyEntry(me,'myImg',()=>{});
    attack(me,foe,M.roost,'foeImg',()=>{});birdEndTurn(me,'myImg');
    check(me.birdFirstAttackReady,'status move and turn end preserve first attack');
    const heat=calcDamage(me,foe,M.birdHeatWave,false).dmg;
    attack(me,foe,M.birdHeatWave,'foeImg',()=>{});check(foe.curHp===100000-2*heat,'entry heat wave double hit');
    const afterFirst=foe.curHp;attack(me,foe,M.birdHeatWave,'foeImg',()=>{});
    check(foe.curHp===afterFirst-heat,'second heat wave hits once');
    applyEntry(me,'myImg',()=>{});check(me.birdFirstAttackReady,'reentry restores first attack');
    attack(me,foe,M.flamethrower,'foeImg',()=>{});
    check(!me.birdFirstAttackReady,'other attacking move consumes first attack');
    const afterOther=foe.curHp;attack(me,foe,M.birdHeatWave,'foeImg',()=>{});
    check(foe.curHp===afterOther-heat,'heat wave after another attack hits once');
    reset();const ally=makeMon(SP_BY_ID.zapdos,'none');
    multi={teams:{me:[me,ally],foe:[foe]},slots:{me:[me,ally],foe:[foe]}};
    attack(me,foe,M.iceAvalanche,'foeImg',()=>{});
    check(ally.iceShieldHp===Math.floor(me.maxHp*1.5),'ally shield based on Articuno HP');
  }finally{Math.random=oldRandom;multi=null;}
}`,c);
console.log('Legendary birds: visibility, shields, residuals, abilities, spread multi-hits and entry Heat Wave OK');
vm.runInContext(`{
  for(const size of [2,3]){
    battleSize=size;mode='friend';
    const team=Array.from({length:size*2},()=>({sp:SP_BY_ID.clobbopus,item:'none'}));
    startBattleWith(team,team.map((_,i)=>i),team,team.map((_,i)=>i));
    const actor=multiLiving('foe')[0],replacement=multiBench('foe').at(-1);
    [...multi.teams.me,...multi.teams.foe].forEach(m=>{m.maxHp=m.curHp=100000;m.moves=[M.icepunch];});
    for(const mon of multiLiving('foe')){
      document.getElementById('multi-action-'+mon.multiId).value=mon===actor?'s'+replacement.multiId:'m0';
      document.getElementById('multi-target-'+mon.multiId).value=String(multiLiving('me')[0].multiId);
      document.getElementById('multi-ally-'+mon.multiId).value=String(mon.multiId);
    }
    const before=multi.round;
    multiConfirm('foe');
    check(multi.slots.foe.includes(replacement),'switch from actual command input');
    check(multi.round===before+1&&!busy,'turn resumes after command switch');
    const [a,b]=multiLiving('me');multiSetBehind(a,b);multiSetBehind(b,a);
    check(multiVisible('me').length>0,'cover cannot hide every target');
    mode='cpu';
    multiLiving('foe').forEach(m=>{m.moves=[M.gilgamesh];m.usedGilgamesh=true;});
    multiLiving('me').forEach(m=>{
      document.getElementById('multi-action-'+m.multiId).value='m0';
      document.getElementById('multi-target-'+m.multiId).value=String(multiLiving('foe')[0].multiId);
      document.getElementById('multi-ally-'+m.multiId).value=String(m.multiId);
    });
    const nextRound=multi.round;multiConfirm('me');
    check(multi.round===nextRound+1&&!busy,'CPU without usable moves does not halt turn');
    const dead=multiLiving('me')[0],reserve=multiBench('me')[0];
    faintMon(dead,multiImage(dead));multiReplace();
    check(document.getElementById('cmd').innerHTML.includes('代わりを選択'),'replacement prompt shown');
    multiPickReplacement('me',dead.multiId,reserve.multiId);
    check(multiLiving('me').includes(reserve)&&!busy,'replacement resumes input');
    multi.teams.foe.forEach(m=>{m.curHp=0;m.fainted=true;});multiReplace();
    check(document.getElementById('resultTxt').textContent.includes('勝ち'),'battle reaches result');
    show('home');
  }
}`,c);
console.log('Double/triple command switches and cover remain actionable');
vm.runInContext(`{
  multi=null;battleSize=1;weather=null;
  renderHome();renderTrain();curParty=[];renderParty();
  for(const [id,stat] of [['spectrier','spa'],['glastrier','atk']]){
    const sp=SPECIES[SP_BY_ID[id]];
    for(const screen of ['homeDex','trainGrid','dexGrid'])check(document.getElementById(screen).innerHTML.includes(sp.name),id+' visible in '+screen);
    check(sp.learnset.every(k=>M[k]),id+' valid learnset');
    me=makeMon(SP_BY_ID[id],'none');foe=makeMon(SP_BY_ID.clobbopus,'none');myTeam=[me];foeTeam=[foe];
    foe.curHp=1;
    attack(me,foe,{name:'KO test',cat:'spec',type:'ghost',power:100,accuracy:1},'foeImg',()=>{});
    check(foe.fainted&&me.stages[stat]===1,id+' KO ability activates once');
    applyNeigh(me,foe);check(me.stages[stat]===1,id+' no double activation');
  }
}`,c);
console.log('Spectrier and Glastrier: visible, valid moves, KO abilities OK');
vm.runInContext(`{
  multi=null;battleSize=1;
  renderHome();renderTrain();curParty=[];renderParty();
  for(const screen of ['homeDex','trainGrid','dexGrid'])check(document.getElementById(screen).innerHTML.includes('ジュペッタ'),'Banette visible');
  const sp=SPECIES[SP_BY_ID.banette];check(sp.learnset.every(k=>M[k]),'Banette moves valid');
  me=makeMon(SP_BY_ID.banette,'banettite');foe=makeMon(SP_BY_ID.clobbopus,'none');
  check(me.stoneMatches&&me.base.atk===115,'Banettite enables mega');
  doMega(me,'myImg',()=>{});
  check(me.isMega&&me.name==='メガジュペッタ'&&me.base.atk===135&&me.abilEff==='prankster','Mega Banette uses requested Attack 135');
}`,c);
console.log('Banette: visible, Banettite and Mega Attack 135 OK');
