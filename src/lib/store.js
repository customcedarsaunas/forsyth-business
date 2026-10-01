import AsyncStorage from "@react-native-async-storage/async-storage";
import {SEED} from "../data/seed";
const KEY="forsyth-business-v2";
export async function loadState(){
  const raw=await AsyncStorage.getItem(KEY);
  if(!raw) return JSON.parse(JSON.stringify(SEED));
  try{
    const d=JSON.parse(raw);
    return d.schemaVersion===SEED.schemaVersion?d:{...JSON.parse(JSON.stringify(SEED)),...d,schemaVersion:SEED.schemaVersion};
  }catch{return JSON.parse(JSON.stringify(SEED));}
}
let saveQueue=Promise.resolve();
export function saveState(state){const snapshot=JSON.stringify(state);const write=saveQueue.catch(()=>{}).then(()=>AsyncStorage.setItem(KEY,snapshot));saveQueue=write;return write;}
export async function resetState(){ await AsyncStorage.removeItem(KEY); }
