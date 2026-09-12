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
`,c);
console.log('Double/triple: selection, slots, switching, all actions, speed order, damage and exit OK');
