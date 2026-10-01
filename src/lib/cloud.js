import 'react-native-url-polyfill/auto';
import {portableBackup} from './photos';
import {validateNativeBackup} from './migrate';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppState} from 'react-native';
import {createClient} from '@supabase/supabase-js';
export const cloud=createClient('https://tcgkgzwsvsoebuquhbws.supabase.co','sb_publishable_b-hS7YN_R6A9jU6Rb5Pd8w_OtcymCn5',{auth:{storage:AsyncStorage,autoRefreshToken:true,persistSession:true,detectSessionInUrl:false}});
AppState.addEventListener('change',state=>{if(state==='active')cloud.auth.startAutoRefresh();else cloud.auth.stopAutoRefresh()});
export async function authenticatedUser(){const {data,error}=await cloud.auth.getUser();if(error)throw error;if(!data.user)throw new Error('Sign in first.');return data.user;}
export async function backupState(state,expectedUserId){const user=await authenticatedUser();if(expectedUserId&&user.id!==expectedUserId)throw new Error("The signed-in account changed. Backup cancelled.");const portable=await portableBackup(state);const latest=await authenticatedUser();if(latest.id!==user.id)throw new Error('Account changed. Backup cancelled.');const {error}=await cloud.from('native_app_state').upsert({user_id:user.id,data:portable,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)throw error;}
export async function restoreState(){const user=await authenticatedUser();const {data,error}=await cloud.from('native_app_state').select('data').eq('user_id',user.id).maybeSingle();if(error)throw error;if(!data)throw new Error('No native app backup exists for this account.');return validateNativeBackup(data.data);}
export async function prototypeBackup(){const user=await authenticatedUser();const {data,error}=await cloud.from('app_state').select('data').eq('user_id',user.id).maybeSingle();if(error)throw error;if(!data)throw new Error('No prototype backup exists for this account.');return {state:data.data,userId:user.id};}
