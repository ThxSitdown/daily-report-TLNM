// จุดวัดเน็ตของแต่ละโรงแรม ใช้ร่วมกันระหว่างหน้าฟอร์มกับหน้าประวัติ
export interface Loc { key: string; label: string; icon: string }

export const TRAVELODGE_LOCS: Loc[] = [{key:'cafe6t6',label:'Cafe 6T6',icon:'bi-cup-hot'},{key:'thelodge',label:'The Lodge',icon:'bi-house'},{key:'lobby',label:'Lobby',icon:'bi-building'},{key:'swimgym',label:'Swim & Gym',icon:'bi-dribbble'}]
export const EASTIN_LOCS: Loc[] = [{key:'el',label:'Lobby',icon:'bi-building'},{key:'ets',label:'T Station',icon:'bi-signpost-2'},{key:'ec',label:'Cafe',icon:'bi-cup-hot'},{key:'esp',label:'Swimming Pool',icon:'bi-water'}]
export const UNIMMAN_LOCS: Loc[] = [{key:'ul',label:'Lobby',icon:'bi-building'},{key:'ueat',label:'Eat@',icon:'bi-shop'},{key:'upb',label:'Pool Bar',icon:'bi-cup-straw'}]

// color = สีประจำโรงแรม (ตัวอักษรขาวบนสีนี้ผ่าน contrast 4.5:1)
export const HOTELS: Record<string, { name: string; path: string; color: string; hover: string; soft: string }> = {
  travelodge: { name: 'Travelodge Nimman', path: '/travelodge', color: '#C8102E', hover: '#A50D26', soft: '#FDEAED' },
  'eastin-u': { name: 'Eastin Tan & U Nimman', path: '/eastin-u', color: '#0E7490', hover: '#155E75', soft: '#CFFAFE' },
}

// ตัวแปร CSS ที่ทำให้ปุ่มหลัก/focus/ไอคอนในหน้านั้นใช้สีของโรงแรม
export function accentVars(hotel: string) {
  const h = HOTELS[hotel] || HOTELS.travelodge
  return { '--accent': h.color, '--accent-hover': h.hover, '--accent-soft': h.soft } as React.CSSProperties
}

// ชื่อจุดสำหรับรายงานเก่าในหน้าประวัติ (Eastin กับ U Nimman มี Lobby ทั้งคู่ จึงใส่ชื่อโรงแรมนำหน้า)
export function locLabel(key: string) {
  const t = TRAVELODGE_LOCS.find(l => l.key === key); if (t) return t.label
  const e = EASTIN_LOCS.find(l => l.key === key); if (e) return `Eastin ${e.label}`
  const u = UNIMMAN_LOCS.find(l => l.key === key); if (u) return `U Nimman ${u.label}`
  return key
}
