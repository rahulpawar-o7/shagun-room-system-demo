// ALL data access lives here. Swap with Firebase later without touching the UI.
import {useState,useEffect} from 'react'
import {HOTEL,rooms} from '../hotel.config'
const K='shagun_db',ch=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('shagun'):null,subs=new Set()
const rk=()=>Math.random().toString(36).slice(2,10),now=()=>Date.now()
const IMG=['masala-omelette', 'aloo-paratha', 'idli-sambar', 'paneer-tikka', 'chicken-tikka', 'veg-spring-rolls', 'butter-chicken', 'dal-makhani', 'paneer-butter-masala', 'veg-biryani', 'butter-naan', 'jeera-rice', 'masala-chai', 'cold-coffee', 'fresh-lime-soda', 'gulab-jamun', 'chocolate-brownie', 'rasmalai']
const M=[['Breakfast','Masala Omelette',0,180,'Three-egg omelette with onion, chilli, coriander','🍳'],['Breakfast','Aloo Paratha',1,160,'Stuffed wheat flatbread with curd and pickle','🫓'],['Breakfast','Idli Sambar',1,140,'Steamed rice cakes, sambar, coconut chutney','🍚'],
['Starters','Paneer Tikka',1,320,'Tandoori cottage cheese with mint chutney','🍢'],['Starters','Chicken Tikka',0,380,'Charcoal-grilled marinated chicken','🍗'],['Starters','Veg Spring Rolls',1,240,'Crisp rolls with sweet chilli dip','🥟'],
['Main Course','Butter Chicken',0,450,'Creamy tomato gravy, tandoori chicken','🍛'],['Main Course','Dal Makhani',1,320,'Slow-cooked black lentils with butter','🥘'],['Main Course','Paneer Butter Masala',1,380,'Cottage cheese in rich tomato gravy','🍲'],['Main Course','Veg Biryani',1,340,'Fragrant basmati with vegetables and raita','🍚'],
['Breads and Rice','Butter Naan',1,70,'Tandoor-baked soft naan','🫓'],['Breads and Rice','Jeera Rice',1,180,'Basmati tossed with cumin and ghee','🍚'],
['Beverages','Masala Chai',1,80,'Ginger-cardamom tea','🍵'],['Beverages','Cold Coffee',1,160,'Chilled coffee with ice cream','🥤'],['Beverages','Fresh Lime Soda',1,110,'Sweet or salted','🍋'],
['Desserts','Gulab Jamun',1,150,'Two warm syrup-soaked dumplings','🍡'],['Desserts','Chocolate Brownie',1,220,'Warm brownie with vanilla ice cream','🍫'],['Desserts','Rasmalai',1,180,'Soft cheese patties in saffron milk','🍮']]
const st=(id,name,role,floors)=>({id,name,role,floors,phone:'98000000'+id.slice(-2),email:id.toLowerCase()+'@shagun.com',active:true})
function seed(){const t=now(),R=rooms(),mk=(n,type,sub,status,ago,x={})=>({id:rk(),room:n,floor:Math.floor(n/100),type,sub,note:'',status,createdAt:t-ago*6e4,...x})
 return{categories:['Breakfast','Starters','Main Course','Breads and Rice','Beverages','Desserts'],
 menu:M.map((m,i)=>({id:'m'+i,cat:m[0],name:m[1],veg:!!m[2],price:m[3],desc:m[4],emoji:m[5],img:'/menu/'+IMG[i]+'.jpg',available:i!==4})),
 keys:Object.fromEntries(R.map(r=>[r,rk()])),
 staff:[st('HK-01','Sunita Devi','HK',[1,2]),st('HK-02','Ramesh Kumar','HK',[3]),st('HK-03','Meena Joshi','HK',[4]),st('HK-04','Pooja Singh','HK',[5,6]),
 st('RS-01','Amit Chef','RS',[1,2,3,4,5,6]),st('RS-02','Vikram Rao','RS',[1,2,3,4,5,6]),st('MT-01','Suresh Yadav','MT',[1,2,3,4,5,6]),st('MT-02','Deepak Nair','MT',[1,2,3,4,5,6]),
 st('RC-01','Neha Sharma','RC',[1,2,3,4,5,6]),st('RC-02','Rohit Verma','RC',[1,2,3,4,5,6])],
 reqs:[mk(203,'cleaning','','new',12),mk(412,'maintenance','AC','new',4),mk(305,'towels','Extra towels','accepted',20,{by:'HK-02'}),
 mk(118,'food','','delivered',90,{items:[{name:'Butter Chicken',qty:1,price:450}],total:450,doneAt:t-80*6e4}),mk(501,'laundry','','done',120,{doneAt:t-100*6e4}),
 mk(220,'food','','new',3,{items:[{name:'Masala Chai',qty:2,price:80}],total:160})]}}
let db=JSON.parse(localStorage.getItem(K)||'null')||seed()
const save=()=>{localStorage.setItem(K,JSON.stringify(db));ch&&ch.postMessage(1);subs.forEach(f=>f())}
const reload=()=>{db=JSON.parse(localStorage.getItem(K)||'null')||seed();subs.forEach(f=>f())}
ch&&(ch.onmessage=reload);addEventListener('storage',e=>e.key===K&&reload())
export const getDB=()=>db,subscribe=f=>{subs.add(f);return()=>subs.delete(f)}
export const useDB=()=>{const[,s]=useState(0);useEffect(()=>subscribe(()=>s(n=>n+1)),[]);return db}
export const useTick=()=>{const[,s]=useState(0);useEffect(()=>{const i=setInterval(()=>s(n=>n+1),15000);return()=>clearInterval(i)},[])}
export const getMenu=()=>db.menu
export const validRoom=(r,k)=>db.keys[r]&&db.keys[r]===k
export const resetDemo=()=>{db=seed();save()}
const add=r=>{const o={id:rk(),floor:Math.floor(r.room/100),note:'',sub:'',status:'new',createdAt:now(),...r};db.reqs.unshift(o);save();return o.id}
export const placeOrder=(room,items,note)=>add({room:+room,type:'food',items,note,total:items.reduce((s,i)=>s+i.qty*i.price,0)})
export const createRequest=(room,type,sub,note)=>add({room:+room,type,sub,note})
export const updateStatus=(id,status)=>{const r=db.reqs.find(x=>x.id===id);r.status=status;if(['delivered','done'].includes(status))r.doneAt=now();save()}
export const acceptByStaff=(id,s)=>{const r=db.reqs.find(x=>x.id===id);if(r.by&&r.by!==s.id)return false;r.by=s.id;r.status='accepted';r.acceptedAt=now();save();return true}
export const cancelReq=id=>updateStatus(id,'cancelled')
export const staffLogin=(id,p)=>db.staff.find(s=>s.id===id.toUpperCase()&&s.active)&&p===HOTEL.staffPass?db.staff.find(s=>s.id===id.toUpperCase()):null
export const saveStaff=s=>{const i=db.staff.findIndex(x=>x.id===s.id);i<0?db.staff.push(s):db.staff[i]=s;save()}
export const removeStaff=id=>{db.staff=db.staff.filter(s=>s.id!==id);save()}
export const saveItem=m=>{const i=db.menu.findIndex(x=>x.id===m.id);i<0?db.menu.push({...m,id:'m'+rk()}):db.menu[i]=m;save()}
export const removeItem=id=>{db.menu=db.menu.filter(m=>m.id!==id);save()}
export const regenKey=r=>{db.keys[r]=rk();save()}
export const addCategory=c=>{c&&!db.categories.includes(c)&&db.categories.push(c);save()}
export const simulate=()=>{const R=rooms(),r=R[Math.random()*R.length|0],av=db.menu.filter(m=>m.available)
 if(Math.random()<.4){const m=av[Math.random()*av.length|0];placeOrder(r,[{name:m.name,qty:1+(Math.random()*2|0),price:m.price}],'')}
 else{const t=['cleaning','towels','laundry','maintenance','reception'];createRequest(r,t[Math.random()*5|0],'','Demo request')}}
