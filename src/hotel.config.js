export const HOTEL={name:'Shagun Hotel',tagline:'Hotel & Resorts',currency:'₹',
 floors:[1,2,3,4,5,6],roomsPerFloor:20,owner:{id:'owner',pass:'demo123'},staffPass:'demo123'}
export const rooms=()=>HOTEL.floors.flatMap(f=>Array.from({length:HOTEL.roomsPerFloor},(_,i)=>f*100+i+1))
