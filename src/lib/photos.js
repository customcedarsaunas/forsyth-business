import {Platform} from 'react-native';
import {File,Paths} from 'expo-file-system';
export async function keepPhoto(uri){
 if(Platform.OS==='web'||uri.startsWith('data:'))return uri;
 const source=new File(uri),extension=uri.split('.').pop().split('?')[0]||'jpg';
 const destination=new File(Paths.document,`forsyth-photo-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`);
 await source.copy(destination);return destination.uri;
}
export async function photoData(uri){
 if(!uri||uri.startsWith('data:')||Platform.OS==='web')return uri;
 const file=new File(uri);return `data:${file.type||'image/jpeg'};base64,${await file.base64()}`;
}
export async function portableBackup(state){
 const brands=await Promise.all(state.brands.map(async b=>({...b,logoUri:await photoData(b.logoUri)})));
 const documents=await Promise.all(state.documents.map(async d=>({...d,photos:await Promise.all((d.photos||[]).map(photoData))})));
 const expenses=await Promise.all(state.expenses.map(async e=>({...e,receiptUri:await photoData(e.receiptUri)})));
 return {...state,brands,documents,expenses,cloudBackupUserId:null};
}
