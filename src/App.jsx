import {useState,useEffect,useRef} from 'react'
import {BrowserRouter,Routes,Route,Link,useNavigate,useSearchParams,useParams,Navigate} from 'react-router-dom'
import QRCode from 'qrcode'
import {ShoppingBag,BellRing,Sparkles,Shirt,Wrench,Phone,Bath,Plus,Minus,X,Volume2,VolumeX,Zap,Check,Trash2,Download,Printer,RefreshCw,Camera,ImagePlus} from 'lucide-react'
import {HOTEL,rooms} from './hotel.config'
import * as S from './lib/store'
const rs=n=>HOTEL.currency+n
const ROLES={HK:'Housekeeping',RS:'Room Service / Kitchen',MT:'Maintenance',RC:'Reception'}
const TYPES={food:'Food Order',cleaning:'Room Cleaning',towels:'Towels & Amenities',laundry:'Laundry',maintenance:'Maintenance',reception:'Call Reception'}
const ROLE_TYPES={HK:['cleaning','towels','laundry'],RS:['food'],MT:['maintenance'],RC:Object.keys(TYPES)}
const PHOTO_ROLES=['RS','RC'] // staff roles allowed to add food photos / categories (RS=Kitchen, RC=Reception)
const FOOD=['new','accepted','preparing','onway','delivered'],SERV=['new','accepted','done']
const LBL={new:'Received',accepted:'Accepted',preparing:'Preparing',onway:'On the way',delivered:'Delivered',done:'Done',cancelled:'Cancelled'}
const flow=r=>r.type==='food'?FOOD:SERV
const mins=t=>Math.floor((Date.now()-t)/6e4)
const beep=()=>{try{const c=new AudioContext(),o=c.createOscillator();o.connect(c.destination);o.frequency.value=880;o.start();o.stop(c.currentTime+.2)}catch{}}
const Logo=({h=44})=><img src="/logo.jpg" alt={HOTEL.name} style={{height:h}} className="rounded"/>
const Head=({children})=><header className="bg-black text-sand px-4 py-3 flex items-center justify-between sticky top-0 z-30"><Logo/>{children}</header>
const SimBtn=()=><button onClick={S.simulate} aria-label="Simulate guest request" className="noprint fixed bottom-4 left-4 z-40 btn gld shadow-lg flex gap-1 items-center text-sm"><Zap size={16}/>Simulate guest</button>
const Sheet=({title,onClose,children})=><div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}><div onClick={e=>e.stopPropagation()} className="pop bg-ivory w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-auto"><div className="flex justify-between mb-3"><h2 className="text-2xl font-bold">{title}</h2><button onClick={onClose} aria-label="Close"><X/></button></div>{children}</div></div>

function Launcher(){const n=useNavigate();const k=S.getDB().keys[305];return <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 p-6 text-center">
 <Logo h={160}/><p className="text-gold ser text-xl">Room QR Service System · Demo</p>
 <Link className="btn gld w-72" to={`/room?room=305&k=${k}`}>Open Guest View (Room 305)</Link>
 <Link className="btn bg-cream text-ink w-72" to="/staff/login">Staff Login</Link>
 <Link className="btn bg-cream text-ink w-72" to="/admin/login">Owner Login</Link>
 <button className="btn border border-gold text-gold w-72" onClick={()=>{S.resetDemo();location.href='/'}}>Reset Demo Data</button></div>}

function Guest(){const[q]=useSearchParams(),room=q.get('room'),k=q.get('k'),db=S.useDB(),nav=useNavigate()
 const[view,setView]=useState('home'),[cart,setCart]=useState({}),[cat,setCat]=useState('Breakfast'),[sheet,setSheet]=useState(null),[drawer,setDrawer]=useState(false),[note,setNote]=useState(''),[sub,setSub]=useState('')
 if(!S.validRoom(room,k))return <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-3"><Logo h={90}/><h1 className="text-3xl font-bold">Invalid or expired QR code</h1><p>Please contact reception.</p></div>
 const mine=db.reqs.filter(r=>r.room==room&&!['delivered','done','cancelled'].includes(r.status))
 const items=db.menu.filter(m=>cart[m.id]).map(m=>({name:m.name,qty:cart[m.id],price:m.price})),count=items.reduce((s,i)=>s+i.qty,0),total=items.reduce((s,i)=>s+i.qty*i.price,0)
 const set=(id,d)=>setCart(c=>{const v=(c[id]||0)+d,n={...c};v>0?n[id]=v:delete n[id];return n})
 const SV=[['cleaning',Sparkles,[]],['towels',Bath,['Extra towels','Water','Toiletries','Blanket']],['laundry',Shirt,[]],['maintenance',Wrench,['AC','TV','Bathroom','Light','Other']],['reception',Phone,[]]]
 const go=id=>nav(`/room/track/${id}?room=${room}&k=${k}`)
 return <div className="min-h-screen pb-24"><Head><span className="bg-gold text-black rounded-full px-4 py-1 font-bold text-lg">Room {room}</span></Head>
 {view==='home'&&<div className="p-4 space-y-4 pop"><div className="grid grid-cols-2 gap-3">
  {[['Order Food',ShoppingBag,'food'],['Request Service',BellRing,'service']].map(([t,I,v])=><button key={v} onClick={()=>setView(v)} className="card p-6 flex flex-col items-center gap-2 active:scale-95 transition"><I size={36} className="text-gold"/><span className="ser text-xl font-bold">{t}</span></button>)}</div>
  <h3 className="text-xl font-bold">My Requests</h3>{mine.length===0&&<p className="text-ink/60">No active requests.</p>}
  {mine.map(r=><Link key={r.id} to={`/room/track/${r.id}?room=${room}&k=${k}`} className="card p-3 flex justify-between"><span>{TYPES[r.type]}</span><b className="text-gold">{LBL[r.status]}</b></Link>)}</div>}
 {view==='food'&&<div><div className="sticky top-[68px] z-20 bg-ivory flex gap-2 overflow-x-auto p-3">{db.categories.map(c=><button key={c} onClick={()=>setCat(c)} className={`btn whitespace-nowrap py-2 ${cat===c?'pri':'bg-cream'}`}>{c}</button>)}</div>
  <div className="p-3 space-y-3">{db.menu.filter(m=>m.cat===cat).map(m=><div key={m.id} className={`card p-3 flex gap-3 ${m.available?'':'opacity-50 grayscale'}`}>
   {m.img?<img src={m.img} onError={e=>e.target.style.display='none'} className="w-20 h-20 rounded-xl object-cover"/>:<div className="w-20 h-20 rounded-xl bg-cream flex items-center justify-center text-4xl">{m.emoji}</div>}
   <div className="flex-1"><div className="flex items-center gap-2"><span className={`w-3 h-3 border-2 ${m.veg?'border-green-600':'border-red-600'} flex items-center justify-center`}><i className={`w-1.5 h-1.5 rounded-full ${m.veg?'bg-green-600':'bg-red-600'}`}/></span><b>{m.name}</b></div><p className="text-sm text-ink/70">{m.desc}</p>
   <div className="flex justify-between items-center mt-1"><b>{rs(m.price)}</b>{!m.available?<span className="text-sm">Unavailable</span>:cart[m.id]?<div className="flex items-center gap-3 bg-ink text-cream rounded-xl px-2 py-1"><button aria-label="Remove one" onClick={()=>set(m.id,-1)}><Minus size={18}/></button>{cart[m.id]}<button aria-label="Add one" onClick={()=>set(m.id,1)}><Plus size={18}/></button></div>:<button className="btn gld py-1" onClick={()=>set(m.id,1)}>Add</button>}</div></div></div>)}</div>
  {count>0&&<button onClick={()=>setDrawer(true)} className="fixed bottom-4 left-4 right-4 z-30 btn pri flex justify-between"><span>{count} items</span><span>View Cart · {rs(total)}</span></button>}</div>}
 {view==='service'&&<div className="p-4 grid grid-cols-2 gap-3 pop">{SV.map(([t,I,subs])=><button key={t} onClick={()=>{setSheet({t,subs});setSub('');setNote('')}} className="card p-5 flex flex-col items-center gap-2 active:scale-95 transition"><I size={32} className="text-gold"/><span className="text-center font-semibold">{TYPES[t]}</span></button>)}</div>}
 {view!=='home'&&<button onClick={()=>setView('home')} className="fixed top-[76px] right-3 z-20 text-xs underline">← Home</button>}
 {drawer&&<Sheet title="Your Cart" onClose={()=>setDrawer(false)}>{db.menu.filter(m=>cart[m.id]).map(m=><div key={m.id} className="flex justify-between items-center py-2"><span>{m.name}</span><div className="flex items-center gap-3"><button onClick={()=>set(m.id,-1)}><Minus size={16}/></button>{cart[m.id]}<button onClick={()=>set(m.id,1)}><Plus size={16}/></button><b className="w-16 text-right">{rs(m.price*cart[m.id])}</b></div></div>)}
  <textarea className="inp my-3" placeholder="Special instructions" value={note} onChange={e=>setNote(e.target.value)}/><button className="btn pri w-full" onClick={()=>{const id=S.placeOrder(room,items,note);setCart({});go(id)}}>Place Order · {rs(total)}</button></Sheet>}
 {sheet&&<Sheet title={TYPES[sheet.t]} onClose={()=>setSheet(null)}><div className="flex flex-wrap gap-2 mb-3">{sheet.subs.map(s=><button key={s} onClick={()=>setSub(s)} className={`btn py-2 ${sub===s?'pri':'bg-cream'}`}>{s}</button>)}</div>
  <textarea className="inp mb-3" placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)}/><button className="btn pri w-full" onClick={()=>go(S.createRequest(room,sheet.t,sub,note))}>Submit</button></Sheet>}</div>}

function Track(){const{id}=useParams(),[q]=useSearchParams(),db=S.useDB(),r=db.reqs.find(x=>x.id===id)
 if(!r)return <Navigate to="/"/>;const f=flow(r),i=f.indexOf(r.status),back=`/room?room=${q.get('room')}&k=${q.get('k')}`
 return <div className="min-h-screen"><Head><span className="bg-gold text-black rounded-full px-4 py-1 font-bold">Room {r.room}</span></Head><div className="p-5 pop"><h1 className="text-3xl font-bold mb-1">{TYPES[r.type]}</h1><p className="text-ink/60 mb-4">{r.sub} {r.note}</p>
 {r.status==='cancelled'?<div className="card p-6 text-center text-red-700 text-xl font-bold">Cancelled</div>:<ol className="card p-5 space-y-5">{f.map((s,n)=><li key={s} className="flex items-center gap-3"><span className={`w-8 h-8 rounded-full flex items-center justify-center ${n<=i?'bg-gold text-white':'bg-cream'}`}>{n<=i?<Check size={16}/>:n+1}</span><span className={n===i?'font-bold text-lg':''}>{LBL[s]}</span></li>)}</ol>}
 {r.status==='new'&&<button className="btn border border-red-600 text-red-600 w-full mt-4" onClick={()=>S.cancelReq(r.id)}>Cancel request</button>}
 <Link to={back} className="btn pri block text-center mt-4">Back to Room</Link></div></div>}

function StaffLogin(){const n=useNavigate(),[id,setId]=useState(''),[p,setP]=useState(''),[e,setE]=useState(''),db=S.useDB()
 const go=(a,b)=>{const s=S.staffLogin(a,b);s?(sessionStorage.setItem('staff',s.id),n('/staff')):setE('Invalid ID or password')}
 return <div className="min-h-screen bg-black p-6 flex flex-col items-center justify-center gap-3"><Logo h={110}/><input className="inp max-w-xs" placeholder="Staff ID (e.g. HK-01)" value={id} onChange={e=>setId(e.target.value)}/><input className="inp max-w-xs" type="password" placeholder="Password" value={p} onChange={e=>setP(e.target.value)}/>
 {e&&<p className="text-red-400">{e}</p>}<button className="btn gld w-full max-w-xs" onClick={()=>go(id,p)}>Login</button><p className="text-sand text-sm mt-3">Quick demo login</p>
 <div className="flex flex-wrap gap-2 justify-center max-w-sm">{['HK-01','HK-02','RS-01','MT-01','RC-01'].map(s=><button key={s} className="btn bg-cream py-2" onClick={()=>go(s,HOTEL.staffPass)}>{s}</button>)}</div></div>}

function Staff(){const db=S.useDB();S.useTick();const n=useNavigate(),me=db.staff.find(s=>s.id===sessionStorage.getItem('staff'))
 const[tab,setTab]=useState('new'),[fl,setFl]=useState(0),[tf,setTf]=useState(''),[mute,setMute]=useState(false),[showPh,setShowPh]=useState(false),seen=useRef(null)
 const mine=me?db.reqs.filter(r=>ROLE_TYPES[me.role].includes(r.type)&&(me.role==='RC'||me.floors.includes(r.floor))):[]
 const pend=mine.filter(r=>r.status==='new').length
 useEffect(()=>{if(seen.current!==null&&pend>seen.current&&!mute)beep();seen.current=pend},[pend])
 if(!me)return <Navigate to="/staff/login"/>
 const sel=mine.filter(r=>(tab==='new'?r.status==='new':tab==='prog'?['accepted','preparing','onway'].includes(r.status):['delivered','done'].includes(r.status))&&(!fl||r.floor===fl)&&(!tf||r.type===tf))
 const bill=room=>db.reqs.filter(r=>r.room===room&&r.type==='food'&&r.status==='delivered').reduce((s,r)=>s+r.total,0)
 return <div className="min-h-screen pb-20"><Head><div className="text-right text-xs"><b className="text-sm">{me.name}</b><br/>{ROLES[me.role]} · Floors {me.floors.join(',')}</div></Head>
 {showPh?<div className="p-3 max-w-5xl mx-auto"><button className="btn bg-cream py-2 mb-3" onClick={()=>setShowPh(false)}>← Back to requests</button><MenuPhotos db={db}/></div>:<>
 <div className="p-3 flex gap-2 items-center"><div className="flex-1 flex gap-2">{[['new',`New (${pend})`],['prog','In Progress'],['done','Completed']].map(([t,l])=><button key={t} onClick={()=>setTab(t)} className={`btn py-2 flex-1 text-sm ${tab===t?'pri':'bg-cream'}`}>{l}</button>)}</div>
  {PHOTO_ROLES.includes(me.role)&&<button aria-label="Menu photos" onClick={()=>setShowPh(true)}><Camera/></button>}<button aria-label="Toggle sound" onClick={()=>setMute(!mute)}>{mute?<VolumeX/>:<Volume2/>}</button><button className="text-sm underline" onClick={()=>{sessionStorage.clear();n('/staff/login')}}>Logout</button></div>
 <div className="px-3 flex gap-2 overflow-x-auto pb-2">{[0,...HOTEL.floors].map(f=><button key={f} onClick={()=>setFl(f)} className={`rounded-full px-3 py-1 text-sm ${fl===f?'bg-gold text-white':'bg-cream'}`}>{f?`Floor ${f}`:'All'}</button>)}
  {me.role==='RC'&&<select className="rounded-full bg-cream px-2 text-sm" value={tf} onChange={e=>setTf(e.target.value)}><option value="">All types</option>{Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>}</div>
 <div className="p-3 grid gap-3 md:grid-cols-2">{sel.length===0&&<p className="text-center text-ink/60 col-span-2 py-10">Nothing here yet 🎉</p>}
 {sel.map(r=>{const f=flow(r),nx=f[f.indexOf(r.status)+1],taken=r.by&&r.by!==me.id&&me.role!=='RC',late=mins(r.createdAt)>=10&&r.status==='new',by=db.staff.find(s=>s.id===r.by)
  return <div key={r.id} className={`card p-4 pop ${r.status==='new'?'ring-2 ring-gold':''}`}><div className="flex justify-between"><span className="bg-black text-gold rounded-full px-3 font-bold">Room {r.room}</span><span className="text-sm">Floor {r.floor}</span></div>
  <h3 className="text-xl font-bold mt-1">{TYPES[r.type]}{r.sub&&` · ${r.sub}`}</h3>{r.note&&<p className="text-sm italic">“{r.note}”</p>}
  {r.items&&<ul className="text-sm my-1">{r.items.map((i,k)=><li key={k}>{i.qty}× {i.name}</li>)}<li className="font-bold">Total {rs(r.total)}</li></ul>}
  <p className={`text-sm ${late?'text-red-600 font-bold':'text-ink/60'}`}>{r.status==='new'?`Waiting ${mins(r.createdAt)} min`:`${LBL[r.status]}${by?` · ${by.name}`:''}`}</p>
  {me.role==='RC'&&r.type==='food'&&<p className="text-xs">Room bill: {rs(bill(r.room))}</p>}
  {taken?<p className="text-sm font-semibold mt-2">Taken by {by?.name}</p>:nx&&r.status!=='cancelled'&&<button className="btn gld w-full mt-2" onClick={()=>r.status==='new'?(S.acceptByStaff(r.id,me)||alert('Already taken')):S.updateStatus(r.id,nx)}>{r.status==='new'?'Accept':`Mark ${LBL[nx]}`}</button>}</div>})}</div></>}<SimBtn/></div>}

function AdminLogin(){const n=useNavigate(),[u,setU]=useState(''),[p,setP]=useState('')
 return <div className="min-h-screen bg-black p-6 flex flex-col items-center justify-center gap-3"><Logo h={110}/><input className="inp max-w-xs" placeholder="Username" value={u} onChange={e=>setU(e.target.value)}/><input className="inp max-w-xs" type="password" placeholder="Password" value={p} onChange={e=>setP(e.target.value)}/>
 <button className="btn gld w-full max-w-xs" onClick={()=>u===HOTEL.owner.id&&p===HOTEL.owner.pass?(sessionStorage.setItem('owner',1),n('/admin')):alert('Wrong credentials')}>Login</button><button className="btn bg-cream w-full max-w-xs" onClick={()=>{sessionStorage.setItem('owner',1);n('/admin')}}>Quick demo login</button></div>}

function Admin(){const db=S.useDB();S.useTick();const n=useNavigate(),[tab,setTab]=useState('Overview')
 if(!sessionStorage.getItem('owner'))return <Navigate to="/admin/login"/>
 return <div className="min-h-screen"><Head><button className="text-sm underline" onClick={()=>{sessionStorage.clear();n('/')}}>Logout</button></Head>
 <nav className="noprint flex gap-2 p-3 overflow-x-auto">{['Overview','Staff','Menu','Menu Photos','Rooms & QR','History'].map(t=><button key={t} onClick={()=>setTab(t)} className={`btn py-2 whitespace-nowrap ${tab===t?'pri':'bg-cream'}`}>{t}</button>)}</nav>
 <main className="p-3 max-w-5xl mx-auto">{tab==='Overview'&&<Overview db={db}/>}{tab==='Staff'&&<StaffMgmt db={db}/>}{tab==='Menu'&&<MenuMgmt db={db}/>}{tab==='Menu Photos'&&<MenuPhotos db={db}/>}{tab==='Rooms & QR'&&<QRs db={db}/>}{tab==='History'&&<History db={db}/>}</main><SimBtn/></div>}

function Overview({db}){const day=new Date().setHours(0,0,0,0),td=db.reqs.filter(r=>r.createdAt>=day),food=td.filter(r=>r.type==='food'&&r.status!=='cancelled'),done=db.reqs.filter(r=>r.acceptedAt&&r.createdAt)
 const avg=done.length?Math.round(done.reduce((s,r)=>s+(r.acceptedAt-r.createdAt),0)/done.length/6e4):0
 const C=({t,v})=><div className="card p-4"><p className="text-sm text-ink/60">{t}</p><p className="ser text-3xl font-bold">{v}</p></div>
 return <div className="space-y-4"><div className="grid grid-cols-2 md:grid-cols-4 gap-3"><C t="Food orders today" v={food.length}/><C t="Food value" v={rs(food.reduce((s,r)=>s+r.total,0))}/><C t="Pending" v={db.reqs.filter(r=>r.status==='new').length}/><C t="Avg response" v={`${avg} min`}/></div>
 <div className="card p-4"><h3 className="font-bold mb-2">Service requests by type</h3>{Object.entries(TYPES).filter(([k])=>k!=='food').map(([k,v])=><p key={k} className="flex justify-between"><span>{v}</span><b>{td.filter(r=>r.type===k).length}</b></p>)}</div>
 <div className="card p-4"><h3 className="font-bold mb-2">Live feed</h3>{db.reqs.slice(0,8).map(r=><p key={r.id} className="text-sm py-1 border-b border-cream">Room {r.room} · {TYPES[r.type]} · <b>{LBL[r.status]}</b> · {mins(r.createdAt)}m ago</p>)}</div></div>}

function StaffMgmt({db}){const[e,setE]=useState(null)
 return <div><button className="btn gld mb-3" onClick={()=>setE({id:'',name:'',role:'HK',floors:[],phone:'',email:'',active:true,isNew:1})}>+ Add staff</button>
 <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="bg-cream"><tr>{['ID','Name','Phone','Email','Role','Floors','Active',''].map(h=><th key={h} className="p-2 text-left">{h}</th>)}</tr></thead><tbody>{db.staff.map(s=><tr key={s.id} className="border-t border-cream"><td className="p-2">{s.id}</td><td>{s.name}</td><td>{s.phone}</td><td>{s.email}</td><td>{ROLES[s.role]}</td><td>{s.floors.join(',')}</td>
 <td><input type="checkbox" checked={s.active} onChange={()=>S.saveStaff({...s,active:!s.active})} aria-label="Active"/></td><td className="whitespace-nowrap"><button className="underline mr-2" onClick={()=>setE(s)}>Edit</button><button onClick={()=>confirm('Remove?')&&S.removeStaff(s.id)}><Trash2 size={14}/></button></td></tr>)}</tbody></table></div>
 {e&&<Sheet title="Staff" onClose={()=>setE(null)}><div className="space-y-2">{[['id','Staff ID'],['name','Name'],['phone','Phone'],['email','Email']].map(([k,l])=><input key={k} className="inp" placeholder={l} disabled={k==='id'&&!e.isNew} value={e[k]} onChange={x=>setE({...e,[k]:x.target.value})}/>)}
 <select className="inp" value={e.role} onChange={x=>setE({...e,role:x.target.value})}>{Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
 <div className="flex gap-2 flex-wrap">{HOTEL.floors.map(f=><button key={f} onClick={()=>setE({...e,floors:e.floors.includes(f)?e.floors.filter(x=>x!==f):[...e.floors,f]})} className={`btn py-1 ${e.floors.includes(f)?'pri':'bg-cream'}`}>F{f}</button>)}</div>
 <button className="btn pri w-full" onClick={()=>{if(!e.id||!e.name)return alert('ID and name required');const{isNew,...s}=e;S.saveStaff({...s,id:s.id.toUpperCase()});setE(null)}}>Save</button></div></Sheet>}</div>}

function MenuMgmt({db}){const[e,setE]=useState(null),[c,setC]=useState('')
 return <div><div className="flex gap-2 mb-3"><button className="btn gld" onClick={()=>setE({name:'',cat:db.categories[0],price:0,desc:'',veg:true,img:'',emoji:'🍽️',available:true})}>+ Add item</button><input className="inp max-w-[160px]" placeholder="New category" value={c} onChange={x=>setC(x.target.value)}/><button className="btn bg-cream" onClick={()=>{S.addCategory(c);setC('')}}>Add</button></div>
 <div className="grid md:grid-cols-2 gap-2">{db.menu.map(m=><div key={m.id} className="card p-3 flex justify-between items-center"><div><b>{m.name}</b><p className="text-xs">{m.cat} · {rs(m.price)} · {m.veg?'Veg':'Non-veg'}</p></div><div className="flex gap-2 items-center"><label className="text-xs"><input type="checkbox" checked={m.available} onChange={()=>S.saveItem({...m,available:!m.available})}/> Avail</label><button className="underline text-sm" onClick={()=>setE(m)}>Edit</button><button aria-label="Delete" onClick={()=>S.removeItem(m.id)}><Trash2 size={14}/></button></div></div>)}</div>
 {e&&<DishSheet e={e} setE={setE} db={db}/>}</div>}

// ---- Menu Photos: owner + kitchen/reception staff can add food photos, new dishes and new categories ----
const shrink=(file,max=640)=>new Promise((ok,no)=>{const img=new Image(),u=URL.createObjectURL(file)
 img.onload=()=>{const k=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k)
  const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',.72))}
 img.onerror=()=>{URL.revokeObjectURL(u);no()};img.src=u})
const safely=fn=>{try{fn();return true}catch{alert('Could not save – browser storage is full. Try a smaller photo or remove unused photos.');return false}}
const rawRead=f=>new Promise((ok,no)=>{if(f.size>1.5e6)return no();const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)})
function PhotoBtn({onPick,children,cls='btn bg-cream py-1 text-sm'}){
 return <label className={`${cls} relative inline-flex items-center justify-center gap-2 cursor-pointer overflow-hidden`}>{children}
  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={async e=>{const f=e.target.files[0];e.target.value='';if(!f)return
   try{onPick(await shrink(f))}catch{try{onPick(await rawRead(f))}catch{alert('Could not read this photo. Please choose a JPG or PNG image (under 1.5 MB).')}}}}/></label>}
const DishSheet=({e,setE,db})=><Sheet title={e.id?'Edit dish':'New dish'} onClose={()=>setE(null)}><div className="space-y-2">
 {e.img?<img src={e.img} alt="Dish" className="w-full h-44 rounded-xl object-cover"/>:<div className="w-full h-44 rounded-xl bg-cream flex items-center justify-center text-6xl">{e.emoji||'🍽️'}</div>}
 <div className="flex gap-2"><PhotoBtn cls="btn gld flex-1 text-sm" onPick={d=>setE({...e,img:d})}><Camera size={18}/>{e.img?'Change photo':'Upload photo'}</PhotoBtn>{e.img&&<button type="button" className="btn bg-cream text-sm" onClick={()=>setE({...e,img:''})}>Remove</button>}</div>
 <input className="inp" placeholder="…or paste an image URL" value={e.img&&e.img.startsWith('data:')?'':e.img} onChange={x=>setE({...e,img:x.target.value})}/>
 <input className="inp" placeholder="Dish name" value={e.name} onChange={x=>setE({...e,name:x.target.value})}/>
 <input className="inp" placeholder="Description" value={e.desc} onChange={x=>setE({...e,desc:x.target.value})}/>
 <input className="inp" type="number" min="0" placeholder="Price" value={e.price} onChange={x=>setE({...e,price:x.target.value})}/>
 <select className="inp" value={e.cat} onChange={x=>setE({...e,cat:x.target.value})}>{db.categories.map(k=><option key={k}>{k}</option>)}</select>
 <div className="flex gap-4"><label><input type="checkbox" checked={e.veg} onChange={()=>setE({...e,veg:!e.veg})}/> Veg</label><label><input type="checkbox" checked={e.available} onChange={()=>setE({...e,available:!e.available})}/> Available</label></div>
 <button className="btn pri w-full" onClick={()=>{if(!e.name.trim())return alert('Dish name required');if(safely(()=>S.saveItem({...e,name:e.name.trim(),price:+e.price||0})))setE(null)}}>Save</button>
 {e.id&&<button className="btn border border-red-600 text-red-600 w-full" onClick={()=>confirm('Delete this dish?')&&(S.removeItem(e.id),setE(null))}>Delete dish</button>}</div></Sheet>
function MenuPhotos({db}){const[c,setC]=useState(''),[f,setF]=useState(''),[n,setN]=useState(null)
 const addCat=()=>{const v=c.trim();if(!v)return;if(db.categories.some(x=>x.toLowerCase()===v.toLowerCase()))return alert('Category already exists');safely(()=>S.addCategory(v));setC('');setF(v)}
 const list=db.menu.filter(m=>!f||m.cat===f)
 return <div className="space-y-3">
  <div className="card p-3"><h3 className="font-bold mb-2">New food category</h3><div className="flex gap-2"><input className="inp" placeholder="e.g. Soups, Chinese, Snacks" value={c} onChange={x=>setC(x.target.value)} onKeyDown={x=>x.key==='Enter'&&addCat()}/><button className="btn gld" onClick={addCat}>Add</button></div></div>
  <button className="btn gld flex gap-2 items-center" onClick={()=>setN({name:'',cat:f||db.categories[0],price:'',desc:'',veg:true,img:'',emoji:'🍽️',available:true})}><ImagePlus size={18}/>Add new dish with photo</button>
  <div className="flex gap-2 overflow-x-auto pb-1">{['',...db.categories].map(k=><button key={k||'all'} onClick={()=>setF(k)} className={`btn py-2 whitespace-nowrap ${f===k?'pri':'bg-cream'}`}>{k||'All'} ({k?db.menu.filter(m=>m.cat===k).length:db.menu.length})</button>)}</div>
  {list.length===0&&<p className="text-center text-ink/60 py-6">No dishes in this category yet. Use “Add new dish with photo”.</p>}
  <div className="grid sm:grid-cols-2 gap-2">{list.map(m=><div key={m.id} className="card p-3 flex gap-3">
   {m.img?<img src={m.img} alt={m.name} onError={e=>e.target.style.display='none'} className="w-20 h-20 rounded-xl object-cover"/>:<div className="w-20 h-20 rounded-xl bg-cream flex items-center justify-center text-4xl">{m.emoji}</div>}
   <div className="flex-1 min-w-0"><b className="block truncate">{m.name}</b>
    <select className="inp py-1 text-sm my-1" aria-label="Category" value={m.cat} onChange={x=>safely(()=>S.saveItem({...m,cat:x.target.value}))}>{db.categories.map(k=><option key={k}>{k}</option>)}</select>
    <div className="flex gap-2 items-center flex-wrap"><button className="btn gld py-1 text-sm" onClick={()=>setN(m)}>Edit</button><PhotoBtn onPick={d=>safely(()=>S.saveItem({...m,img:d}))}>{m.img?'Change photo':'Add photo'}</PhotoBtn>{m.img&&<button className="text-sm underline" onClick={()=>confirm('Remove this photo?')&&safely(()=>S.saveItem({...m,img:''}))}>Remove</button>}</div></div></div>)}</div>
  {n&&<DishSheet e={n} setE={setN} db={db}/>}</div>}

function QRCard({r,k,base}){const[u,setU]=useState('');const url=`${base}/room?room=${r}&k=${k}`
 useEffect(()=>{QRCode.toDataURL(url,{width:400,margin:1,color:{dark:'#3A3A38'}}).then(setU)},[url])
 return <div className="card p-3 text-center break-inside-avoid"><p className="ser font-bold">{HOTEL.name}</p><img src={u} className="mx-auto w-32" alt={`QR room ${r}`}/><p className="font-bold">Room {r}</p>
 <div className="noprint flex justify-center gap-2 mt-1"><a download={`room-${r}.png`} href={u} aria-label="Download"><Download size={16}/></a><button aria-label="Regenerate key" onClick={()=>confirm('Old QR will stop working. Continue?')&&S.regenKey(r)}><RefreshCw size={16}/></button></div></div>}
function QRs({db}){const[base,setBase]=useState(location.origin),[q,setQ]=useState(''),[fl,setFl]=useState(1)
 const list=rooms().filter(r=>q?String(r).includes(q):Math.floor(r/100)===fl)
 return <div><div className="noprint flex gap-2 flex-wrap mb-3"><input className="inp max-w-xs" value={base} onChange={e=>setBase(e.target.value)} aria-label="Base URL"/><input className="inp max-w-[140px]" placeholder="Search room" value={q} onChange={e=>setQ(e.target.value)}/>
 {HOTEL.floors.map(f=><button key={f} onClick={()=>{setFl(f);setQ('')}} className={`btn py-2 ${fl===f&&!q?'pri':'bg-cream'}`}>F{f}</button>)}<button className="btn gld flex gap-1" onClick={()=>print()}><Printer size={16}/>Print sheet</button></div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{list.map(r=><QRCard key={r+db.keys[r]} r={r} k={db.keys[r]} base={base}/>)}</div></div>}

function History({db}){const[t,setT]=useState(''),[s,setS]=useState(''),[q,setQ]=useState('')
 const l=db.reqs.filter(r=>(!t||r.type===t)&&(!s||r.status===s)&&(!q||String(r.room).includes(q)))
 const csv=()=>{const rows=[['Room','Type','Detail','Status','Total','Created'],...l.map(r=>[r.room,TYPES[r.type],`${r.sub} ${r.note}`.trim(),r.status,r.total||'',new Date(r.createdAt).toLocaleString()])];const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.map(x=>x.map(c=>`"${c}"`).join(',')).join('\n')]));a.download='history.csv';a.click()}
 return <div><div className="flex gap-2 flex-wrap mb-3"><select className="inp max-w-[160px]" onChange={e=>setT(e.target.value)}><option value="">All types</option>{Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
 <select className="inp max-w-[140px]" onChange={e=>setS(e.target.value)}><option value="">All status</option>{Object.entries(LBL).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><input className="inp max-w-[120px]" placeholder="Room" onChange={e=>setQ(e.target.value)}/><button className="btn gld" onClick={csv}>Export CSV</button></div>
 <div className="card divide-y divide-cream">{l.map(r=><p key={r.id} className="p-2 text-sm flex justify-between"><span>Room {r.room} · {TYPES[r.type]} {r.total?`· ${rs(r.total)}`:''}</span><span>{LBL[r.status]} · {new Date(r.createdAt).toLocaleString()}</span></p>)}</div></div>}

export default function App(){return <BrowserRouter><Routes><Route path="/" element={<Launcher/>}/><Route path="/room" element={<Guest/>}/><Route path="/room/track/:id" element={<Track/>}/>
 <Route path="/staff/login" element={<StaffLogin/>}/><Route path="/staff" element={<Staff/>}/><Route path="/admin/login" element={<AdminLogin/>}/><Route path="/admin" element={<Admin/>}/></Routes></BrowserRouter>}
