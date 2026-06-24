export const UPS_BUILDINGS = ['T1','T2','T3','T4','T6','T7']
export interface UpsData { building:string; backupMin:string; tempC:string; remark:string }
export interface RoomData { roomNumber:string; tvOk:boolean; telOk:boolean; internetDown:string; internetUp:string; remark:string }
export interface ServerRoomData { tempIn:string; tempOut:string; humidity:string; remark:string }
