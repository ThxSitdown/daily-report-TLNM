// src/lib/types.ts
export type NetworkLocation = 'cafe6t6' | 'thelodge' | 'lobby' | 'swimgym'

export const LOCATION_LABELS: Record<NetworkLocation, string> = {
  cafe6t6: 'Cafe 6T6',
  thelodge: 'The Lodge',
  lobby: 'Lobby',
  swimgym: 'Swim & Gym'
}

export const UPS_BUILDINGS = ['T1', 'T2', 'T3', 'T4', 'T6', 'T7']

export interface NetworkTestData {
  location: NetworkLocation
  download: string
  upload: string
  remark: string
  testing?: boolean
  tested?: boolean
}

export interface UpsData {
  building: string
  backupMin: string
  tempC: string
  remark: string
}

export interface RoomData {
  roomNumber: string
  tvOk: boolean
  telOk: boolean
  internetDown: string
  internetUp: string
  remark: string
  testingNet?: boolean
  testedNet?: boolean
}

export interface ServerRoomData {
  tempIn: string
  tempOut: string
  humidity: string
  remark: string
}
