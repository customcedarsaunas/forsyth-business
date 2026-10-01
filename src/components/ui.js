import React from "react";
import {View,Text,TouchableOpacity,TextInput,StyleSheet} from "react-native";

export const C={ink:"#15191D",muted:"#68717D",line:"#E3E7EA",bg:"#f2f3f5",card:"#FFFFFF",soft:"#e8eaee",green:"#1B6F4A",amber:"#9A6818",red:"#A33D3D"};

export function H1({children}){return <Text style={s.h1}>{children}</Text>}
export function H2({children}){return <Text style={s.h2}>{children}</Text>}
export function Small({children,style}){return <Text style={[s.small,style]}>{children}</Text>}
export function Card({children,style}){return <View style={[s.card,style]}>{children}</View>}
export function Button({title,onPress,kind="dark",small=false,disabled=false}){
 return <TouchableOpacity accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress} style={[s.btn,kind==="soft"&&s.softBtn,kind==="danger"&&s.dangerBtn,small&&s.smallBtn,disabled&&{opacity:.4}]}>
  <Text style={[s.btnText,kind==="soft"&&s.softText]}>{title}</Text>
 </TouchableOpacity>
}
export function Field({label,...p}){return <View style={{marginBottom:12}}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#9AA1A8" {...p} style={[s.input,p.multiline&&{minHeight:88,textAlignVertical:"top"}]}/></View>}
export function Chip({text,active,onPress}){return <TouchableOpacity onPress={onPress} style={[s.chip,active&&s.chipOn]}><Text style={[s.chipText,active&&s.chipTextOn]}>{text}</Text></TouchableOpacity>}
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
 chip:{paddingHorizontal:11,paddingVertical:8,borderRadius:999,backgroundColor:C.soft,marginRight:7,marginBottom:7},chipOn:{backgroundColor:"#315ce8"},chipText:{fontWeight:"800",fontSize:12,color:"#505962"},chipTextOn:{color:"#fff"},
 row:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:8,borderBottomWidth:1,borderBottomColor:"#EEF0F2"},rowVal:{fontSize:14,color:C.ink,fontWeight:"700"},bold:{fontSize:14,color:C.ink,fontWeight:"900"},
 pill:{backgroundColor:C.soft,borderRadius:999,paddingHorizontal:9,paddingVertical:5},pillText:{fontSize:11,fontWeight:"800",color:C.ink}
});
