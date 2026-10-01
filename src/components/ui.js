import React,{useState} from "react";
import {View,Text,TouchableOpacity,TextInput,StyleSheet,Modal,Keyboard,ScrollView} from "react-native";

export const C={ink:"#15191D",muted:"#68717D",line:"#E3E7EA",bg:"#f2f3f5",card:"#FFFFFF",soft:"#e8eaee",green:"#1B6F4A",amber:"#9A6818",red:"#A33D3D"};

// Lightweight draft snapshot used by the estimate editor preview. Fields are rendered
// in document order, so each line's quantity is available when its price is rendered.
let currentQty="1";
let draftSnapshot={client:"",title:"",lines:[],notes:""};
let currentLine=-1;

export function H1({children}){return <Text style={s.h1}>{children}</Text>}
export function H2({children}){return <Text style={s.h2}>{children}</Text>}
export function Small({children,style}){return <Text style={[s.small,style]}>{children}</Text>}
export function Card({children,style}){return <View style={[s.card,style]}>{children}</View>}

export function Button({title,onPress,kind="dark",small=false,disabled=false}){
 const [preview,setPreview]=useState(false);
 const isDraftSave=title==="Save draft"||title==="Save changes";
 return <>
  {isDraftSave&&<TouchableOpacity accessibilityRole="button" accessibilityLabel="Preview Estimate" onPress={()=>{Keyboard.dismiss();setPreview(true)}} style={[s.btn,s.softBtn,{marginBottom:10}]}><Text style={[s.btnText,s.softText]}>Preview Estimate</Text></TouchableOpacity>}
  <TouchableOpacity accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={()=>{Keyboard.dismiss();onPress?.()}} style={[s.btn,kind==="soft"&&s.softBtn,kind==="danger"&&s.dangerBtn,small&&s.smallBtn,disabled&&{opacity:.4}]}>
   <Text style={[s.btnText,kind==="soft"&&s.softText]}>{title}</Text>
  </TouchableOpacity>
  {isDraftSave&&<Modal visible={preview} animationType="slide" onRequestClose={()=>setPreview(false)}>
   <View style={s.previewPage}>
    <View style={s.previewHead}><Text style={s.previewHeading}>Estimate Preview</Text><TouchableOpacity onPress={()=>setPreview(false)}><Text style={s.doneText}>Done</Text></TouchableOpacity></View>
    <ScrollView contentContainerStyle={{paddingBottom:40}}>
     <Text style={s.previewBusiness}>CUSTOM CEDAR SAUNAS</Text>
     <Text style={s.previewDocTitle}>{draftSnapshot.title||"Estimate"}</Text>
     <Text style={s.previewClient}>{draftSnapshot.client||"Client"}</Text>
     <View style={s.previewRule}/>
     {draftSnapshot.lines.filter(x=>x&&(x.description||x.price)).map((line,index)=>{
       const qty=Number(line.qty)||0,price=Number(line.price)||0,total=qty*price;
       return <View key={index} style={s.previewLine}><View style={{flex:1,paddingRight:10}}><Text style={s.previewLineTitle}>{line.description||`Line ${index+1}`}</Text><Text style={s.small}>{line.qty||"0"} {line.unit||"ea"} × {moneyText(price)}</Text></View><Text style={s.previewAmount}>{moneyText(total)}</Text></View>
     })}
     <View style={s.previewRule}/>
     <View style={s.previewTotalRow}><Text style={s.previewTotalLabel}>Subtotal</Text><Text style={s.previewTotal}>{moneyText(draftSnapshot.lines.reduce((sum,line)=>sum+(Number(line?.qty)||0)*(Number(line?.price)||0),0))}</Text></View>
     {!!draftSnapshot.notes&&<><Text style={s.previewNotesLabel}>Notes</Text><Text style={s.previewNotes}>{draftSnapshot.notes}</Text></>}
     <Small style={{marginTop:20}}>Preview updates from the estimate you are currently editing. Tax and payment terms remain calculated by the saved document/PDF.</Small>
    </ScrollView>
   </View>
  </Modal>}
 </>;
}

const moneyText=n=>`$${Number(n||0).toLocaleString("en-CA",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

export function Field({label,...p}){
 const [unitPicker,setUnitPicker]=useState(false);
 const isUnit=label==="Unit";
 if(label==="Client"){draftSnapshot={client:p.value||"",title:draftSnapshot.title||"",lines:[],notes:""};currentLine=-1}
 if(label==="Document title")draftSnapshot.title=p.value||"";
 if(label==="Description"){currentLine+=1;draftSnapshot.lines[currentLine]={...(draftSnapshot.lines[currentLine]||{}),description:p.value||""}}
 if(label==="Quantity"){currentQty=p.value||"";if(currentLine>=0)draftSnapshot.lines[currentLine]={...(draftSnapshot.lines[currentLine]||{}),qty:p.value||""}}
 if(isUnit&&currentLine>=0)draftSnapshot.lines[currentLine]={...(draftSnapshot.lines[currentLine]||{}),unit:p.value||""};
 if(label==="Price per unit"&&currentLine>=0)draftSnapshot.lines[currentLine]={...(draftSnapshot.lines[currentLine]||{}),price:p.value||""};
 if(label==="Document notes")draftSnapshot.notes=p.value||"";
 const lineTotal=label==="Price per unit"?(Number(currentQty)||0)*(Number(p.value)||0):null;
 const chooseUnit=value=>{p.onChangeText?.(value);setUnitPicker(false)};
 return <View style={{marginBottom:12}}>
  <Text style={s.label}>{label}</Text>
  {isUnit?
   <TouchableOpacity accessibilityRole="button" accessibilityLabel="Unit" onPress={()=>{Keyboard.dismiss();setUnitPicker(true)}} style={[s.input,s.unitButton]}><Text style={s.unitText}>{p.value||"Choose unit"}</Text><Text style={s.chevron}>⌄</Text></TouchableOpacity>:
   <TextInput accessibilityLabel={label} placeholderTextColor="#9AA1A8" returnKeyType={p.multiline?"default":"done"} blurOnSubmit={!p.multiline} onSubmitEditing={!p.multiline?Keyboard.dismiss:undefined} {...p} style={[s.input,p.multiline&&{minHeight:88,textAlignVertical:"top"}]}/>
  }
  {lineTotal!==null&&<View style={s.lineTotalBar}><Text style={s.lineTotalLabel}>Line total</Text><Text style={s.lineTotalValue}>{moneyText(lineTotal)}</Text></View>}
  {isUnit&&<Modal visible={unitPicker} transparent animationType="fade" onRequestClose={()=>setUnitPicker(false)}><TouchableOpacity activeOpacity={1} onPress={()=>setUnitPicker(false)} style={s.pickerBack}><View style={s.pickerCard}><Text style={s.pickerTitle}>Choose unit</Text>{["ea","hours","days","km","sq ft","lin ft"].map(x=><TouchableOpacity key={x} onPress={()=>chooseUnit(x)} style={s.pickerOption}><Text style={s.pickerOptionText}>{x}</Text>{p.value===x&&<Text style={s.check}>✓</Text>}</TouchableOpacity>)}<TouchableOpacity onPress={()=>setUnitPicker(false)} style={[s.pickerOption,{justifyContent:"center"}]}><Text style={s.doneText}>Cancel</Text></TouchableOpacity></View></TouchableOpacity></Modal>}
 </View>;
}

export function Chip({text,active,onPress}){return <TouchableOpacity onPress={()=>{Keyboard.dismiss();onPress?.()}} style={[s.chip,active&&s.chipOn]}><Text style={[s.chipText,active&&s.chipTextOn]}>{text}</Text></TouchableOpacity>}
export function Row({label,value,bold=false}){return <View style={s.row}><Text style={bold?s.bold:s.small}>{label}</Text><Text style={bold?s.bold:s.rowVal}>{value}</Text></View>}
export function Pill({text,tone="neutral"}){return <View style={[s.pill,tone==="good"&&{backgroundColor:"#E5F3EB"},tone==="warn"&&{backgroundColor:"#FFF1D9"}]}><Text style={s.pillText}>{text}</Text></View>}

export const s=StyleSheet.create({
 h1:{fontSize:30,fontWeight:"900",color:C.ink,letterSpacing:-.4},
 h2:{fontSize:19,fontWeight:"900",color:C.ink,marginTop:22,marginBottom:10},
 small:{fontSize:13,color:C.muted,lineHeight:18},
 card:{backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:15,padding:15,marginBottom:10},
 btn:{backgroundColor:"#315ce8",borderRadius:12,paddingHorizontal:14,paddingVertical:12,alignItems:"center",justifyContent:"center"},
 softBtn:{backgroundColor:C.soft},dangerBtn:{backgroundColor:C.red},smallBtn:{paddingVertical:8,paddingHorizontal:11},
 btnText:{color:"#fff",fontWeight:"900"},softText:{color:C.ink},
 label:{fontSize:12,fontWeight:"800",color:"#59616B",marginBottom:5},
 input:{backgroundColor:"#fff",borderWidth:1,borderColor:"#DCE1E5",borderRadius:11,paddingHorizontal:12,paddingVertical:11,fontSize:16,color:C.ink},
 unitButton:{minHeight:46,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},unitText:{fontSize:16,color:C.ink},chevron:{fontSize:20,color:C.muted,fontWeight:"800"},
 lineTotalBar:{marginTop:7,backgroundColor:"#172033",borderRadius:9,paddingHorizontal:12,paddingVertical:9,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},lineTotalLabel:{color:"#fff",fontSize:12,fontWeight:"700"},lineTotalValue:{color:"#fff",fontSize:15,fontWeight:"900"},
 chip:{paddingHorizontal:11,paddingVertical:8,borderRadius:999,backgroundColor:C.soft,marginRight:7,marginBottom:7},chipOn:{backgroundColor:"#315ce8"},chipText:{fontWeight:"800",fontSize:12,color:"#505962"},chipTextOn:{color:"#fff"},
 row:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:8,borderBottomWidth:1,borderBottomColor:"#EEF0F2"},rowVal:{fontSize:14,color:C.ink,fontWeight:"700"},bold:{fontSize:14,color:C.ink,fontWeight:"900"},
 pill:{backgroundColor:C.soft,borderRadius:999,paddingHorizontal:9,paddingVertical:5},pillText:{fontSize:11,fontWeight:"800",color:C.ink},
 pickerBack:{flex:1,backgroundColor:"rgba(0,0,0,.35)",justifyContent:"flex-end"},pickerCard:{backgroundColor:"#fff",borderTopLeftRadius:20,borderTopRightRadius:20,padding:18,paddingBottom:32},pickerTitle:{fontSize:20,fontWeight:"900",marginBottom:10,color:C.ink},pickerOption:{minHeight:48,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},pickerOptionText:{fontSize:17,fontWeight:"700",color:C.ink},check:{fontSize:18,fontWeight:"900",color:"#315ce8"},doneText:{fontSize:16,fontWeight:"900",color:"#315ce8"},
 previewPage:{flex:1,backgroundColor:C.bg,paddingTop:58,paddingHorizontal:18},previewHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:24},previewHeading:{fontSize:22,fontWeight:"900",color:C.ink},previewBusiness:{fontSize:13,fontWeight:"900",letterSpacing:1.2,color:C.muted},previewDocTitle:{fontSize:30,fontWeight:"900",color:C.ink,marginTop:8},previewClient:{fontSize:17,color:C.muted,marginTop:8},previewRule:{height:1,backgroundColor:C.line,marginVertical:18},previewLine:{flexDirection:"row",justifyContent:"space-between",paddingVertical:12,borderBottomWidth:1,borderBottomColor:"#EEF0F2"},previewLineTitle:{fontSize:15,fontWeight:"800",color:C.ink,marginBottom:4},previewAmount:{fontSize:15,fontWeight:"900",color:C.ink},previewTotalRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},previewTotalLabel:{fontSize:17,fontWeight:"800",color:C.ink},previewTotal:{fontSize:22,fontWeight:"900",color:C.ink},previewNotesLabel:{fontSize:14,fontWeight:"900",color:C.ink,marginTop:28,marginBottom:6},previewNotes:{fontSize:14,lineHeight:20,color:C.muted}
});
