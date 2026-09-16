const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const elements=new Map();
function el(id){if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',style:{},value:'',classList:{add(){},remove(){},toggle(){},contains(){return false;}},appendChild(){},insertAdjacentHTML(){},remove(){},addEventListener(){},parentElement:{appendChild(){}}});return elements.get(id);}
const c=vm.createContext({console,Math,Set,Map,JSON,Date,document:{getElementById:el,querySelector:el,querySelectorAll:()=>[],createElement:()=>el('new'),addEventListener(){}},window:{addEventListener(){},removeEventListener(){}},localStorage:{getItem(){return null;},setItem(){}},setTimeout:fn=>fn(),clearTimeout(){},setInterval(){},clearInterval(){},alert:msg=>{throw Error(msg);}});
const html=fs.readFileSync('index.html','utf8');
for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))vm.runInContext(m[1],c);
vm.runInContext(fs.readFileSync('multi-battle.js','utf8'),c);
vm.runInContext(`
  function check(ok,msg){if(!ok)throw Error(msg);}
  check(battlePartyCount(2)===4&&battlePartyCount(3)===6&&battlePartyCount(6)===6,'Battle party counts include 6 vs 6');
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
  sixBattle=true;battleSize=1;mode='friend';
  const sixParty=Array.from({length:6},()=>({sp:SP_BY_ID.duraludon,item:'none'}));
  startBattleWith(sixParty,[0,1,2,3,4,5],sixParty,[0,1,2,3,4,5]);
  check(!multi&&myTeam.length===6&&foeTeam.length===6&&me===myTeam[0]&&foe===foeTeam[0],'6 vs 6 is one active Pokemon with five on the bench');
  sixBattle=false;
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
  check(wool.base.hp===100&&wool.base.def===130&&calcDamage(fire,wool,M.crunch,false).dmg<calcDamage(fire,woolPlain,M.crunch,false).dmg,'Dubwool Fluffy halves physical damage');
  const gengar=SPECIES[SP_BY_ID.gengar];
  check(gengar.types.includes('ghost')&&gengar.types.includes('poison')&&gengar.megas[0].base.spa===170&&gengar.megas[0].abil==='shadowtag','Gengar and Mega Gengar');
  const corviknight=SPECIES[SP_BY_ID.corviknight];
  check(corviknight.types.includes('flying')&&corviknight.types.includes('steel')&&corviknight.base.def===135&&corviknight.abil==='mirrorarmor','Corviknight');
  const thievul=SPECIES[SP_BY_ID.thievul];
  check(thievul.types[0]==='dark'&&thievul.base.spa===87&&thievul.base.spe===90&&thievul.abil==='unburden','Thievul');
  const obstagoon=SPECIES[SP_BY_ID.obstagoon];
  check(obstagoon.types.includes('dark')&&obstagoon.types.includes('normal')&&obstagoon.base.def===131&&obstagoon.abil==='defiant','Obstagoon');
  const drednaw=makeMon(SP_BY_ID.drednaw,'none','p1'),drednawPlain=Object.assign({},makeMon(SP_BY_ID.drednaw,'none','p1'),{abilEff:null});
  check(drednaw.types.includes('water')&&drednaw.types.includes('rock')&&drednaw.base.atk===115&&calcDamage(drednaw,fire,M.crunch,false).dmg>calcDamage(drednawPlain,fire,M.crunch,false).dmg,'Drednaw Strong Jaw');
  const hold=makeMon(SP_BY_ID.hold,'none','p1'),holdPlain=Object.assign({},makeMon(SP_BY_ID.hold,'none','p1'),{abilEff:null});
  check(hold.types.includes('normal')&&hold.types.includes('ground')&&calcDamage(hold,fire,M.earthquake,false).dmg>calcDamage(holdPlain,fire,M.earthquake,false).dmg,'Hold Huge Power');
  const galvantula=SPECIES[SP_BY_ID.galvantula];
  check(galvantula.types.includes('bug')&&galvantula.types.includes('electric')&&galvantula.base.spa===97&&galvantula.abil==='compoundeyes','Galvantula');
  const joltik=makeMon(SP_BY_ID.joltik,'eviolite','p1'),joltikPlain=makeMon(SP_BY_ID.joltik,'none','p1');
  check(joltik.base.hp===75&&joltik.base.def===105&&joltik.base.spd===105&&calcDamage(fire,joltik,M.fireblast,false).dmg<calcDamage(fire,joltikPlain,M.fireblast,false).dmg,'Boosted Joltik receives Eviolite bulk');
  const mamoswine=makeMon(SP_BY_ID.mamoswine,'none','p1'),mamoswinePlain=Object.assign({},makeMon(SP_BY_ID.mamoswine,'none','p1'),{abilEff:null});
  check(mamoswine.base.hp===110&&mamoswine.base.atk===130&&calcDamage(fire,mamoswine,M.fireblast,false).dmg<calcDamage(fire,mamoswinePlain,M.fireblast,false).dmg,'Mamoswine Thick Fat');
  const glalie=SPECIES[SP_BY_ID.glalie];
  check(glalie.types[0]==='ice'&&glalie.base.hp===80&&glalie.base.atk===80&&glalie.base.def===110&&glalie.base.spa===80&&glalie.base.spd===110&&glalie.base.spe===80&&glalie.abil==='moody','Glalie');
  const crustle=SPECIES[SP_BY_ID.crustle];
  check(crustle.types.includes('bug')&&crustle.types.includes('rock')&&M.crustlerockTomb.power===80&&M.crustlerockTomb.switchLock===2&&M.crustlerockTomb.targetDrop.stats.spe===-1,'Crustle Rock Tomb');
  const kingler=SPECIES[SP_BY_ID.kingler];
  check(kingler.types[0]==='water'&&kingler.base.atk===150&&kingler.base.spe===50&&kingler.moves.includes('crabhammer'),'Kingler custom stats');
  const cloyster=SPECIES[SP_BY_ID.cloyster];
  check(cloyster.types.includes('water')&&cloyster.types.includes('ice')&&cloyster.base.atk===85&&cloyster.base.def===210,'Cloyster custom attack');
  const wishiwashi=makeMon(SP_BY_ID.wishiwashi,'none','p1');
  check(wishiwashi.base.hp===90&&wishiwashi.base.def===150&&wishiwashi.base.spd===150,'Wishiwashi school form stats');
  wishiwashi.curHp=Math.floor(wishiwashi.maxHp/4); updateWishiwashiForm(wishiwashi,'myImg');
  check(!wishiwashi.schoolForm&&wishiwashi.base.def===50&&wishiwashi.base.spd===55,'Wishiwashi solo form at quarter HP');
  const pyukumuku=SPECIES[SP_BY_ID.pyukumuku];
  check(pyukumuku.base.hp===150&&pyukumuku.base.def===80&&pyukumuku.base.spd===80&&pyukumuku.abil==='innardsout','Pyukumuku custom stats and Innards Out');
  check(SPECIES[SP_BY_ID.joltik].learnset.includes('stickyweb')&&M.stickyweb.hazard==='stickyweb','Joltik Sticky Web');
  check(COMPETITIVE_MOVE_55.length===55&&SPECIES[SP_BY_ID.sableye].learnset.includes('reflect')&&M.reflect.reflect,'Competitive 55 and Sableye Reflect');
  const excadrill=SPECIES[SP_BY_ID.excadrill],gigalith=SPECIES[SP_BY_ID.gigalith];
  check(excadrill.types.includes('ground')&&excadrill.types.includes('steel')&&excadrill.base.atk===135&&excadrill.abil==='sandrush'&&gigalith.base.def===160&&gigalith.abil==='sandstream','Excadrill and Gigalith');
  const absolMega=makeMon(SP_BY_ID.absol,'absolzite','p1'); absolMega.base={hp:65,atk:164,def:60,spa:115,spd:60,spe:151}; absolMega.abilEff='sharpness'; absolMega.isMega=true;
  const absolPlain=Object.assign({},absolMega,{abilEff:null});
  check(calcDamage(absolMega,fire,M.nightslash,false).dmg>calcDamage(absolPlain,fire,M.nightslash,false).dmg&&calcDamage(absolMega,fire,M.psychocut,false).dmg>calcDamage(absolPlain,fire,M.psychocut,false).dmg&&M.xscissor.cut,'Sharpness boosts cutting moves');
  check(calcDamage(dura,fairy,M.duraludonDisaster,false).eff===2,'Duraludon Disaster pierces Fairy immunity for 2x damage');
  const duraEviolite=makeMon(SP_BY_ID.duraludon,'eviolite','p1'),duraPlain=makeMon(SP_BY_ID.duraludon,'none','p1');
  check(calcDamage(fire,duraEviolite,M.fireblast,false).dmg<calcDamage(fire,duraPlain,M.fireblast,false).dmg,'Duraludon receives Eviolite bulk');
  hazards=emptyHazards();setHazard('foe','rocks',dura);setHazard('foe','rocks',dura);setHazard('foe','rocks',dura);
  check(hazards.foe.rocks===3,'Stealth Rock three layers');
  check(M.stealthrock.cat==='status'&&M.stealthrock.power===0&&M.stealthrock.hazard==='rocks','Stealth Rock is an entry hazard for normal users');
  check(M.duraludonStealthRock.power===65&&M.duraludonStealthRock.hazardAfterDamage==='rocks'&&spMoves(SPECIES[SP_BY_ID.duraludon]).includes('duraludonStealthRock'),'Only Duraludon has direct-damage Stealth Rock');
  const rockTarget=makeMon(SP_BY_ID.gyarados,'none','cpu');me=dura;foe=rockTarget;hazards.foe=emptyHazards().foe;setHazard('foe','rocks',dura);const entryHp=rockTarget.curHp;applyHazards('foe',()=>{});check(rockTarget.curHp<entryHp,'Stealth Rock damages on switching in');
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
  check(me.aegislashForm==='shield'&&me.base.def===180&&me.base.atk===50,'Aegislash starts in shield form');
  attack(me,foe,M.aegislashShadowClaw,'foeImg',()=>{});
  check(me.aegislashForm==='blade'&&me.base.atk===150&&me.base.def===80,'attacking changes Aegislash to blade form');
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
      const cpuBird=makeMon(SP_BY_ID[id],'none','cpu');
      check(cpuBird.moves[4].name===M[BIRD_FIFTH[id]].name&&cpuBird.moves[4].fifthSlot,'CPU fifth slot');
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
  check(me.isMega&&me.name==='メガジュペッタ'&&me.base.atk===165&&me.abilEff==='prankster','Mega Banette uses Attack 165');
}`,c);
console.log('Banette: visible, Banettite and Mega Attack 165 OK');
vm.runInContext(`{
  battleSize=1;multi=null;
  for(const npcMode of ['cpu','lunatic','lunatic2','lunatic3','lunatic4','lunatic5','dynamaxUnlock']){
    mode=npcMode;
    myTeam=[makeMon(SP_BY_ID.dracovish,'none')];myA=0;me=myTeam[0];
    foeTeam=[makeMon(SP_BY_ID.dracozolt,'none'),makeMon(SP_BY_ID.arctovish,'none')];foeA=0;foe=foeTeam[0];
    hazards=emptyHazards();clearCmd();let resumed=0;
    requestForcedSwitch('foe',()=>resumed++);
    check(foeA===1&&resumed===1,'NPC switch resumes automatically: '+npcMode);
    check(!document.getElementById('cmd').innerHTML.includes('pickForced'),'No NPC picker: '+npcMode);
    foeTeam[0].fainted=true;resumed=0;
    requestForcedSwitch('foe',()=>resumed++);
    check(foeA===1&&resumed===1,'No bench safely resumes');
  }
  mode='friend';foeTeam[0].fainted=false;let resumed=0;
  requestForcedSwitch('foe',()=>resumed++);
  check(inputSide==='foe'&&document.getElementById('cmd').innerHTML.includes('プレイヤー2'),'Friend selects own replacement');
  pickForced('foe',0);check(foeA===0&&resumed===1,'Friend choice resumes');
  requestForcedSwitch('me',()=>{});
  check(inputSide==='me'&&document.getElementById('cmd').innerHTML.includes('プレイヤー1'),'Player 1 retains picker');
}`,c);
console.log('Forced switching: NPC automatic, friend ownership and no-bench continuation OK');
vm.runInContext(`{
  battleSize=1;multi=null;mode='cpu';weather=null;
  me=makeMon(SP_BY_ID.dracovish,'mougekiScarf');foe=makeMon(SP_BY_ID.gengar,'none');
  myTeam=[me,makeMon(SP_BY_ID.arctovish,'none')];myA=0;foeTeam=[foe];foeA=0;hazards=emptyHazards();
  const plain={...me,itemKey:'none'};
  check(Math.abs(effSpeed(me)/effSpeed(plain)-1.5)<.02,'Mougeki speed boost');
  check(calcDamage(plain,foe,M.quickattack,false).eff===0&&calcDamage(me,foe,M.quickattack,false).eff===1,'Type immunity bypass');
  foe.types=['normal'];foe.abilEff='flashfire';
  check(calcDamage(me,foe,M.flamethrower,false).dmg>0,'Ability immunity bypass');
  foe.protectActive=true;foe.maxHp=foe.curHp=100000;
  let calls=0;attack(me,foe,{...M.flamethrower,forceHit:true},'foeImg',()=>calls++);
  check(foe.curHp<100000&&calls===1&&me.mougekiLock===M.flamethrower.name,'Protect bypass and move lock');
  const hp=foe.curHp;attack(me,foe,M.waterfall,'foeImg',()=>calls++);
  check(foe.curHp===hp&&calls===2,'Different move blocked');
  const out=me;doSwitch('me',1,()=>{});check(!out.mougekiLock,'Switch clears move lock');
}`,c);
console.log('Mougeki scarf: speed, immunity/protect bypass and move lock OK');
for(const name of ['メタグロス','メガメタグロス','シャワーズ','サンダース','ブースター','リーフィア','エーフィ','グレイシア'])assert.ok(fs.existsSync('image/image/'+name+'.gif'),'Existing image: '+name);
vm.runInContext(`{
  const ids=['metagross','vaporeon','jolteon','flareon','leafeon','espeon','glaceon'];
  for(const id of ids){
    const sp=SPECIES[SP_BY_ID[id]];check(sp&&sp.moves.every(k=>M[k])&&sp.learnset.every(k=>M[k]),id+' data and moves');
    if(id!=='metagross')for(const owner of ['p1','p2','cpu']){
      const mon=makeMon(SP_BY_ID[id],'none',owner);
      check(mon.moves.length===5&&mon.moves[4].name===M[BIRD_FIFTH[id]].name&&mon.moves[4].fifthSlot,id+' fixed fifth for '+owner);
    }
  }
  const reset=(id)=>{
    multi=null;battleSize=1;mode='cpu';weather=null;grassTurns=electricTurns=psychicTurns=mistTurns=0;hazards=emptyHazards();
    me=makeMon(SP_BY_ID[id],id==='metagross'?'metagronite':'none');
    foe=makeMon(SP_BY_ID.clobbopus,'none');foe.abilEff=null;foe.maxHp=foe.curHp=100000;
    myTeam=[me,makeMon(SP_BY_ID.vaporeon,'none')];foeTeam=[foe,makeMon(SP_BY_ID.glaceon,'none')];myA=foeA=0;
    return me;
  };
  const hit=(move)=>{let calls=0;attack(me,foe,{...move,forceHit:true},'foeImg',()=>calls++);check(calls===1,'callback '+move.name);};
  reset('metagross');check(me.stoneMatches,'Metagronite match');doMega(me,'myImg',()=>{});
  check(me.isMega&&me.name==='メガメタグロス'&&me.base.atk===145&&me.base.spe===110&&me.abilEff==='moldbreaker','Mega stats and Mold Breaker');
  foe.types=['normal'];
  for(const ability of ['flashfire','levitate','disguise','thickfat','multiscale','prankster','aurashield']){
    foe.abilEff=ability;
    const move=ability==='levitate'?M.earthquake:M.flamethrower;
    check(calcDamage(me,foe,move,false).dmg===calcDamage(me,{...foe,abilEff:null},move,false).dmg,'Mold Breaker '+ability);
  }
  foe.abilEff='roughskin';const hp=me.curHp;hit(M.meteorMash);check(me.curHp===hp,'Mold Breaker prevents contact ability');
  reset('vaporeon');const ally=myTeam[1];me.heis=[ally];me.curHp=me.maxHp-80;ally.curHp=ally.maxHp-80;hit(M.hydroVortex);
  const startHp=me.curHp,startAlly=ally.curHp,startFoe=foe.curHp;
  for(let i=0;i<4;i++){eeveeEndTurn(me,'myImg');eeveeEndTurn(foe,'foeImg');}
  check(me.curHp===startHp+60&&ally.curHp===startAlly+60&&foe.curHp===startFoe-60,'Hydro exactly three ticks and ally healing');
  reset('jolteon');hit(M.divineThunder);for(let i=0;i<4;i++)eeveeEndTurn(me,'myImg');check(me.stages.spe===3,'Thunder exactly three boosts');
  reset('glaceon');hit(M.glacialAurora);for(let i=0;i<6;i++)eeveeEndTurn(foe,'foeImg');check(foe.stages.spd===-5,'Aurora exactly five drops');
  reset('glaceon');foe.protectActive=true;hit(M.glacialAurora);check(!foe.auroraTurns,'Protected target gets no aurora');
  reset('vaporeon');hit(M.hydroVortex);const oldMe=me,oldFoe=foe;doSwitch('me',1,()=>{});doSwitch('foe',1,()=>{});check(!oldMe.hydroTurns&&!oldFoe.hydroDot,'Switch clears ongoing effects');
  reset('flareon');hit(M.infernoFlame);const fireHp=me.curHp;
  check(me.status==='burn'&&me.safeBurn,'Flareon self burn');
  check(calcDamage({...me,abilEff:null},foe,M.quickattack,false).dmg===calcDamage({...me,abilEff:null,status:null},foe,M.quickattack,false).dmg,'No self-burn attack penalty');
  applyResidual(me,'myImg',foe);check(me.curHp===fireHp,'No self-burn residual');
  reset('espeon');const original=foe;hit(M.psychicEndless);check(foe!==original&&foeA===1,'Single forced switch');
  foeTeam=[foe];foeA=0;hit(M.psychicEndless);check(foeTeam[0]===foe,'No bench completes');
  for(const size of [2,3]){
    battleSize=size;mode='friend';
    const a=Array.from({length:size*2},()=>({sp:SP_BY_ID.leafeon,item:'none'}));
    const b=Array.from({length:size*2},()=>({sp:SP_BY_ID.clobbopus,item:'none'}));
    startBattleWith(a,a.map((_,i)=>i),b,b.map((_,i)=>i));
    const attacker=multiLiving('me')[0],targets=multiLiving('foe').slice();
    targets.forEach(t=>{t.maxHp=t.curHp=100000;t.abilEff=null;});
    multiSetBehind(targets[1],targets[0]);
    let done=0;attack(attacker,targets[0],{...M.grassCrusher,forceHit:true},multiImage(targets[0]),()=>done++);
    check(done===1&&targets.every(t=>t.curHp<100000),'Leaf hits all '+size);
    const guarded=targets[1],guardHp=guarded.curHp;guarded.wideGuardActive=true;
    attack(attacker,targets[0],{...M.grassCrusher,forceHit:true},multiImage(targets[0]),()=>{});
    check(guarded.curHp===guardHp,'Wide guard still blocks spread');
    const before=multiLiving('foe').slice(),incoming=multiBench('foe').slice();
    psychicForceSwitch(attacker,M.psychicEndless,()=>done++);
    check(done===2&&multiLiving('foe').every(t=>incoming.includes(t))&&before.every(t=>!multiLiving('foe').includes(t)),'Unique multi replacements '+size);
  }
  multi=null;
}`,c);
console.log('Metagross and six Eevee evolutions: fifth slots, mega, Mold Breaker, durations, safe burn and multi forced switches OK');
for(const name of ['ストライク','ハッサム'])assert.ok(fs.existsSync('image/image/'+name+'.gif'));
vm.runInContext(`{
  multi=null;battleSize=1;mode='cpu';weather='hail';hazards=emptyHazards();
  const scyther=SPECIES[SP_BY_ID.scyther],scizor=SPECIES[SP_BY_ID.scizor];
  check(scyther.base.spe===125&&scizor.base.spe===65,'Scyther +20 speed, Scizor standard speed');
  for(const sp of [scyther,scizor])check(sp.moves.every(k=>M[k])&&sp.learnset.every(k=>M[k]),sp.name+' valid move pool');
  me=makeMon(SP_BY_ID.scyther,'none');foe=makeMon(SP_BY_ID.glaceon,'none');
  myTeam=[me];foeTeam=[foe];myA=foeA=0;foe.maxHp=foe.curHp=100000;
  const move=M.scytherDoubleWing,random=Math.random;let hits=0,calls=0;
  try{
    Math.random=()=>.99;
    const damage=calcDamage(me,foe,move,false).dmg;
    attack(me,foe,{...move,birdOnHit:()=>hits++},'foeImg',()=>calls++);
    check(hits===2&&calls===1&&foe.curHp===100000-2*damage,'Both 40-power hits land through Snow Cloak');
    check(calcDamage(me,foe,move,false).dmg>calcDamage({...me,abilEff:null},foe,move,false).dmg,'Technician boosts low-power hits');
    foe.protectActive=true;const hp=foe.curHp;
    attack(me,foe,move,'foeImg',()=>{});check(foe.curHp===hp,'Sure hit does not bypass Protect');
  }finally{Math.random=random;weather=null;}
}`,c);
console.log('Scyther and Scizor: move pools, speed, Technician and sure-hit double wing OK');
vm.runInContext(`{
  const reset=(a,b)=>{
    multi=null;battleSize=1;mode='cpu';weather=null;hazards=emptyHazards();grassTurns=electricTurns=psychicTurns=mistTurns=0;
    me=makeMon(SP_BY_ID[a],'none');foe=makeMon(SP_BY_ID[b],'none');
    myTeam=[me];foeTeam=[foe];myA=foeA=0;me.maxHp=me.curHp=foe.maxHp=foe.curHp=100000;
    turnAct={me:{type:'move'},foe:{type:'move'}};
  };
  const use=move=>{let calls=0;attack(me,foe,{...move,forceHit:true},'foeImg',()=>calls++);check(calls===1,'New abilities callback: '+move.name);};
  const random=Math.random;
  try{
    Math.random=()=>.1;
    reset('jolteon','gyarados');check(SPECIES[SP_BY_ID.jolteon].learnset.includes('electroball'),'Jolteon can learn Electro Ball');
    const speed=effSpeed;
    try{effSpeed=m=>m.testSpeed;
      for(const [a,b,p] of [[1,10,20],[1,1,30],[2,1,60],[3,1,90],[4,1,120],[8,1,120]])check(electroBallPower({testSpeed:a},{testSpeed:b})===p,'Electro Ball ratio '+a+'/'+b);
    }finally{effSpeed=speed;}
    const slow=calcDamage(me,foe,M.electroball,false).dmg;me.stages.spe=6;
    check(calcDamage(me,foe,M.electroball,false).dmg>slow,'Electro Ball reads current speed boosts');
    reset('gyarados','jolteon');use({...M.thunderbolt,multiHit:2});
    check(foe.curHp<100000&&foe.stages.spe===1,'Jolteon takes electric damage and gains speed once per move');
    foe.protectActive=true;use(M.waterfall);check(foe.stages.spe===1,'No speed boost when protected');
    reset('metagross','jolteon');use(M.earthquake);check(foe.stages.spe===0,'Mold Breaker bypasses voltage');
    reset('flareon','gyarados');foe.abilEff=null;
    const normal=calcDamage(me,foe,M.quickattack,false).dmg;
    for(const status of ['burn','poison','paralyze','sleep']){me.status=status;const damage=calcDamage(me,foe,M.quickattack,false).dmg;check(damage>=normal*1.5-1&&damage<=normal*1.5+1,'Guts '+status);}
    reset('leafeon','gyarados');use({...M.xscissor,multiHit:2});
    check(me.stages.atk===1&&me.stages.def===-1,'Chlorophyll once for multi-hit');
    use(M.swordsdance);check(me.stages.atk===3&&me.stages.def===-1,'No Chlorophyll on status move');
    reset('gyarados','espeon');use(M.toxic);check(me.status==='toxic'&&!foe.status,'Toxic reflected');
    reset('gyarados','espeon');use(M.thunderwave);check(me.status==='paralyze'&&!foe.status,'Thunder Wave reflected');
    reset('gyarados','espeon');use(M.charm);check(me.stages.atk===-1&&me.stages.spa===-1&&foe.stages.atk===0,'Stat status reflected');
    reset('espeon','espeon');use(M.toxic);check(me.status==='toxic'&&!foe.status,'Two mirrors do not loop');
    reset('gyarados','espeon');use(M.swordsdance);check(me.stages.atk===2&&foe.stages.atk===0,'Self buffs not reflected');
    reset('gyarados','espeon');use({...M.icebeam,freeze:1});check(foe.curHp<100000&&!foe.status&&me.status==='freeze','Damage retained but freeze reflected');
    reset('gyarados','espeon');use({...M.shadowball,targetDrop:{chance:1,stats:{spd:-1}}});check(me.stages.spd===-1&&foe.stages.spd===0,'Secondary stat drop reflected');
    reset('metagross','espeon');use(M.toxic);check(foe.status==='toxic'&&!me.status,'Mold Breaker bypasses mirror');
    reset('glaceon','espeon');use(M.glacialAurora);check(me.auroraTurns===5&&!foe.auroraTurns,'Custom ongoing effect reflected');
    reset('gyarados','glaceon');Math.random=()=>.49;use(M.rocktomb);check(foe.curHp===100000&&foe.stages.spe===0,'Snow Cloak cancels damage and speed drop below .5');
    Math.random=()=>.5;use(M.rocktomb);check(foe.curHp<100000&&foe.stages.spe===-1,'Snow Cloak does not cancel at .5');
    reset('gyarados','glaceon');Math.random=()=>.1;use(M.waterfall);check(foe.curHp<100000,'Snow Cloak does not block unrelated moves');
    reset('metagross','glaceon');use(M.rocktomb);check(foe.curHp<100000&&foe.stages.spe===-1,'Mold Breaker bypasses Snow Cloak');
    builds.p1.flareon={ability:'flashfire',moves:SPECIES[SP_BY_ID.flareon].moves.slice()};
    builds.p1.espeon={ability:'synchronize',moves:SPECIES[SP_BY_ID.espeon].moves.slice()};
    check(makeMon(SP_BY_ID.flareon,'none').abilEff==='guts'&&makeMon(SP_BY_ID.espeon,'none').abilEff==='magicmirror','Saved builds migrate to new abilities');
    for(const size of [2,3]){
      battleSize=size;mode='friend';
      const p1=Array.from({length:size},()=>({sp:SP_BY_ID.leafeon,item:'none'}));
      const p2=['espeon','glaceon','jolteon'].slice(0,size).map(id=>({sp:SP_BY_ID[id],item:'none'}));
      startBattleWith(p1,p1.map((_,i)=>i),p2,p2.map((_,i)=>i));
      const actor=multiLiving('me')[0],enemies=multiLiving('foe');
      enemies.forEach(m=>{m.maxHp=m.curHp=100000;});actor.maxHp=actor.curHp=100000;
      let done=0;
      attack(actor,enemies[0],{name:'spread speed test',type:'grass',cat:'phys',power:50,spread:true,forceHit:true,targetDrop:{chance:1,stats:{spe:-1}}},multiImage(enemies[0]),()=>done++);
      check(done===1&&enemies[0].curHp<100000&&enemies[0].stages.spe===0&&actor.stages.spe===-1,'Mirror reflects only debuff in multi '+size);
      check(enemies[1].curHp===100000&&enemies[1].stages.spe===0,'Snow Cloak cancels secondary spread target '+size);
      if(size===3)check(enemies[2].curHp<100000&&enemies[2].stages.spe===0,'Voltage and speed drop both resolve on third target');
      check(actor.stages.atk===1&&actor.stages.def===-1,'Chlorophyll once per spread');
    }
    multi=null;
  }finally{Math.random=random;}
}`,c);
console.log('Custom Eevee abilities: Electro Ball, voltage, Guts, Chlorophyll, mirror and Snow Cloak OK');
vm.runInContext(`
  check(COMPETITIVE_MOVE_100.length===100,'Competitive move collection has exactly 100 moves');
  check(new Set(COMPETITIVE_MOVE_100).size===100,'Competitive move collection has no duplicates');
  COMPETITIVE_MOVE_100.forEach(key=>{
    check(M[key],'Competitive move is defined: '+key);
    check(SPECIES.some(sp=>(sp.learnset||[]).includes(key)),'Competitive move has a learner: '+key);
  });
  check(NEW_COMPETITIVE_MOVE_40.length===40,'New competitive collection has exactly 40 moves');
  NEW_COMPETITIVE_MOVE_40.forEach(key=>{
    check(!COMPETITIVE_MOVE_100.includes(key),'New competitive move is not in the existing 100: '+key);
    check(M[key],'New competitive move is defined: '+key);
    check(SPECIES.some(sp=>(sp.learnset||[]).includes(key)),'New competitive move has a learner: '+key);
  });
  check(GLOBAL_DEF_SPD_BONUS===30,'Global defense bonus is 30');
  check(SPECIES[SP_BY_ID.gyarados].base.def===109&&SPECIES[SP_BY_ID.gyarados].base.spd===130,'Normal Pokemon received +30 defense and special defense');
  check(SPECIES[SP_BY_ID.banette].megas[0].base.def===105&&SPECIES[SP_BY_ID.banette].megas[0].base.spd===113,'Mega Pokemon received +30 defense and special defense');
  check(FALINKS_HEI[0].base.def===95&&FALINKS_HEI[0].base.spd===85,'Hei helpers received +30 defense and special defense');
  announceAbility({abilName:'テスト特性'});
  check(document.getElementById('abilityToast').textContent==='特性：テスト特性 発動！','Ability activation toast text');
  const clobbopus=SPECIES[SP_BY_ID.clobbopus];
  check(CLOBBOPUS_ADDED_MOVES.length===24&&CLOBBOPUS_ADDED_MOVES.every(key=>M[key]&&clobbopus.learnset.includes(key)),'Clobbopus receives all requested moves');
  check(M.machpunch.power===50&&M.machpunch.prio===1&&M.clobbopusBulletPunch.power===50&&M.clobbopusBulletPunch.prio===1,'Clobbopus priority moves');
  check(M.circlethrow.power===55&&M.circlethrow.prio===-6&&M.circlethrow.targetForceSwitch,'Circle Throw forces the target to switch');
  check(M.doublekick.power===30&&M.doublekick.multiHit===2&&M.clobbopusDualChop.power===45&&M.clobbopusDualChop.multiHit===2,'Clobbopus multi-hit moves');
  const clobNoItem=makeMon(SP_BY_ID.clobbopus,'none','p1'),clobWithItem=makeMon(SP_BY_ID.clobbopus,'leftovers','p1'),clobTarget=makeMon(SP_BY_ID.gyarados,'none','cpu');
  check(calcDamage(clobNoItem,clobTarget,M.clobbopusAcrobatics,false).dmg===calcDamage(clobWithItem,clobTarget,M.clobbopusAcrobatics,false).dmg*2,'Acrobatics doubles without an item');
  const clobEviolite=makeMon(SP_BY_ID.clobbopus,'eviolite','p1'),clobPlain=makeMon(SP_BY_ID.clobbopus,'none','p1');
  check(calcDamage(clobTarget,clobEviolite,M.waterfall,false).dmg<calcDamage(clobTarget,clobPlain,M.waterfall,false).dmg,'Clobbopus receives Eviolite bulk');
  const fifthUser=makeMon(SP_BY_ID.falinks,'none','p1'),fifthTarget=makeMon(SP_BY_ID.gigalith,'none','cpu');
  check(fifthUser.moves[4].fifthSlot,'Fifth move is marked as once per battle');
  me=fifthUser;foe=fifthTarget;let fifthDone=0;
  const testFifth={...M.thunderbolt,fifthSlot:true,forceHit:true};
  attack(fifthUser,fifthTarget,testFifth,'foeImg',()=>fifthDone++);const fifthHp=fifthTarget.curHp;
  attack(fifthUser,fifthTarget,testFifth,'foeImg',()=>fifthDone++);
  check(fifthDone===2&&fifthUser.usedFifthSlot&&fifthTarget.curHp===fifthHp,'Fifth move can only be used once per battle');
  const bax=makeMon(SP_BY_ID.baxcalibur,'none','p1'),baxTarget=makeMon(SP_BY_ID.gyarados,'none','cpu');
  check(bax.base.hp===115&&bax.base.atk===145&&bax.base.def===122&&bax.base.spa===75&&bax.base.spd===116&&bax.base.spe===87,'Baxcalibur base stats include global bulk bonus');
  check(bax.abilEff==='berserker'&&bax.img==='image/image/セグレイブ.gif'&&M.glaiveRush.power===120,'Baxcalibur has Berserker and Glaive Rush');
  applyNeigh(bax,{curHp:0,fainted:false});
  check(bax.berserkerForm&&bax.name==='バーサーカーセグレイブ'&&bax.img==='image/image/バーサーカーセグレイブ.gif'&&bax.base.hp===165&&bax.base.atk===185&&bax.base.def===115&&bax.base.spa===105&&bax.base.spd===101&&bax.base.spe===87,'First KO transforms Baxcalibur into Berserker form');
  check(bax.moves.some(m=>m.name==='ヒョウケツキョケン'&&m.power===140),'Berserker form replaces Glaive Rush with Frozen Huge Sword');
  applyNeigh(bax,{curHp:0,fainted:false});check(bax.stages.atk===1,'Berserker gains attack after each later KO');
  me=bax;foe=baxTarget;baxTarget.maxHp=baxTarget.curHp=100000;let swordDone=0;
  attack(bax,baxTarget,bax.moves.find(m=>m.frozenGlaive),'foeImg',()=>swordDone++);
  check(swordDone===1&&bax.frozenGlaiveSure&&bax.stages.def===-2&&bax.stages.spd===-2,'Frozen Huge Sword halves bulk and readies a sure-hit attack');
`,c);
console.log('Competitive 100 moves and learnsets OK');
