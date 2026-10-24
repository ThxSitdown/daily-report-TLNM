import type { SpeedMeta } from '@/lib/speedtest'

export const UPS_BUILDINGS = ['T1','T2','T3','T4','T6','T7']
export interface UpsData { building:string; backupMin:string; tempC:string; remark:string }
export interface RoomData { roomNumber:string; tvOk:boolean; telOk:boolean; internetDown:string; internetUp:string; remark:string; internetMeta?:SpeedMeta }
export interface NetData { download:string; upload:string; remark:string; meta?:SpeedMeta }
export interface ServerRoomData { tempIn:string; tempOut:string; humidity:string; remark:string; humidStatus?:string }

export const emptyRoom = (): RoomData => ({ roomNumber:'', tvOk:false, telOk:false, internetDown:'', internetUp:'', remark:'' })
