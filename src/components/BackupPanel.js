import React,{useState} from 'react';
import {Alert,Platform,View} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import {File,Paths} from 'expo-file-system';
import {migratePrototype,validateNativeBackup} from '../lib/migrate';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {prototypeBackup,authenticatedUser} from '../lib/cloud';
import {portableBackup} from '../lib/photos';
import {accountantCsv} from '../lib/export';
import {saveState} from '../lib/store';
import {Card,H2,Small,Button} from './ui';

export async function exportText(text,name,mime){
 if(Platform.OS==='web'){
  const url=URL.createObjectURL(new Blob([text],{type:mime}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
 }
 const file=new File(Paths.cache,name);file.write(text);
 if(!await Sharing.isAvailableAsync())throw new Error('Sharing is unavailable on this device.');
 await Sharing.shareAsync(file.uri,{mimeType:mime,dialogTitle:'Save Forsyth Business backup'});
}
export function BackupPanel({state,setState,cloudBusy=false}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const run=async(fn)=>{setBusy(true);try{await fn()}catch(e){Alert.alert('Backup',String(e.message||e))}finally{setBusy(false)}};
 const exportBackup=()=>run(async()=>{await exportText(JSON.stringify(await portableBackup(state),null,2),`forsyth-business-${new Date().toISOString().slice(0,10)}.json`,'application/json');setMessage('Backup ready to save or share.');});
 const importBackup=()=>run(async()=>{
  const result=await DocumentPicker.getDocumentAsync({type:['application/json','text/plain'],copyToCacheDirectory:true});if(result.canceled)return;
  const asset=result.assets[0];const text=Platform.OS==='web'?await asset.file.text():await new File(asset.uri).text();
  const data=JSON.parse(text);if(data.schemaVersion===2){const restored=validateNativeBackup(data);if(state.cloudBackupUserId||cloudBusy)throw new Error('Turn off automatic backup and wait for the current save before restoring.');Alert.alert('Restore native backup?','This replaces local records. A recovery copy is kept on this device.',[{text:'Cancel',style:'cancel'},{text:'Restore',onPress:()=>run(async()=>{await AsyncStorage.setItem('forsyth-business-recovery',JSON.stringify(state));await saveState(restored);setState(restored);setMessage('Backup restored. Automatic backup is off.');})}]);return;}
  const merged=migratePrototype(data,state);const docs=merged.documents.length-state.documents.length,expenses=merged.expenses.length-state.expenses.length;
  if(!docs&&!expenses&&merged.customers.length===state.customers.length){setMessage('These records are already imported.');return;}
  Alert.alert('Import v18 records?',`Add ${docs} documents and ${expenses} expenses. Existing local records are kept.`,[{text:'Cancel',style:'cancel'},{text:'Import',onPress:()=>run(async()=>{await saveState(merged);setState(merged);setMessage('Prototype records imported. Existing records were kept.');})}]);
 });
 const importCloud=()=>run(async()=>{const backup=await prototypeBackup();const merged=migratePrototype(backup.state,state);Alert.alert('Import prototype cloud records?',`Add ${merged.documents.length-state.documents.length} documents. Existing local records stay.`,[{text:'Cancel',style:'cancel'},{text:'Import',onPress:()=>run(async()=>{const user=await authenticatedUser();if(user.id!==backup.userId)throw new Error('Account changed. Import cancelled.');await saveState(merged);setState(merged);setMessage('Prototype cloud records imported.');})}]);});
 return <><H2>Backup & Export</H2><Card><Button title='Export Tax CSV' disabled={busy} kind='soft' onPress={()=>run(()=>exportText(accountantCsv(state),'forsyth-tax-export.csv','text/csv'))}/><View style={{height:12}}/><Button title='Download Full Backup' disabled={busy} onPress={exportBackup}/><View style={{height:12}}/><Button title='Import / restore JSON backup' kind='soft' disabled={busy} onPress={importBackup}/><View style={{height:12}}/><Button title='Import v18 cloud records' kind='soft' disabled={busy} onPress={importCloud}/><Small style={{marginTop:12}}>Sign in under More to import your prototype cloud records. Import adds prototype clients, documents, payments and expenses. Reimporting the same records does not duplicate them.</Small>{message?<Small style={{marginTop:10}}>{message}</Small>:null}</Card></>;
}
