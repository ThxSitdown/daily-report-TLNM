'use client'
import { SpeedCard } from '@/components/SpeedCard'
import { Field } from '@/components/ui'
import type { RoomData } from '@/lib/types'

// ห้องพัก 1 ห้อง: เลขห้อง, TV/Tel OK/NG และวัดเน็ตในห้อง (ใช้ร่วมกันทุกโรงแรม)
export function RoomCard({ room, index, onChange }:{ room:RoomData; index:number; onChange:(f:keyof RoomData, v:RoomData[keyof RoomData])=>void }) {
  return (
    <div className="stack" style={{ background:'var(--surface-muted)', borderRadius:'var(--radius-md)', padding:'var(--sp-3)' }}>
      <h3 className="row" style={{ fontSize:'var(--text-md)' }}><i className="bi bi-door-open" style={{ color:'var(--accent)' }} aria-hidden="true"/>ห้องที่ {index + 1}{room.roomNumber && <span className="muted">· {room.roomNumber}</span>}</h3>
      <Field label="เลขห้อง">{id => <input id={id} className="input-metric" inputMode="numeric" placeholder="XXXX" value={room.roomNumber} onChange={e=>onChange('roomNumber', e.target.value)}/>}</Field>
      <div className="row" role="group" aria-label={`สถานะอุปกรณ์ห้องที่ ${index + 1}`}>
        {(['tvOk','telOk'] as const).map(k => {
          const on = room[k], name = k === 'tvOk' ? 'TV' : 'Tel'
          return (
            <button key={k} type="button" className="toggle" aria-pressed={on} onClick={()=>onChange(k, !on)}>
              <i className={`bi ${on ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} aria-hidden="true"/>{name} {on ? 'OK' : 'NG'}
            </button>
          )
        })}
      </div>
      <SpeedCard label={`Internet ห้อง ${room.roomNumber || index + 1}`} icon="bi-wifi" download={room.internetDown} upload={room.internetUp} remark={room.remark} meta={room.internetMeta}
        onDownload={v=>onChange('internetDown', v)} onUpload={v=>onChange('internetUp', v)} onRemark={v=>onChange('remark', v)} onMeta={m=>onChange('internetMeta', m)}/>
    </div>
  )
}
