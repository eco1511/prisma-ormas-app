import {NextResponse} from "next/server";
import {connectMongoDB} from "@/lib/mongodb";
import {Member} from "@/models/Member";
import {User} from "@/models/User";
import {Setting} from "@/models/Setting";
import {saveUploadedFile,removeUploadedFile} from "@/lib/uploads";
import {validateMembership} from "@/lib/membership";
import {writeAudit} from "@/lib/audit";
import {registrationConflict} from "@/lib/registration-conflict";
export const runtime="nodejs";
export async function POST(req:Request){
 const uploaded:string[]=[];let member:any=null;let committed=false;let created=false;
 try{
  const f=await req.formData();const val=(k:string)=>String(f.get(k)||"").trim();
  if(["name","nik","email","phone","address"].some(k=>!val(k)))return NextResponse.json({message:"Lengkapi semua data wajib."},{status:400});
  if(!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(val("email")))return NextResponse.json({message:"Alamat email tidak valid."},{status:400});
  if(!/^\d{16}$/.test(val("nik")))return NextResponse.json({message:"NIK harus terdiri dari tepat 16 angka."},{status:400});
  let membership;try{membership=validateMembership(Object.fromEntries(["membershipType","branchType","provinceId","cityId","position"].map(k=>[k,val(k)])))}catch(e){return NextResponse.json({message:(e as Error).message},{status:400})}
  await connectMongoDB();
  const settings=await Setting.findOne({key:"main"});if(settings&&!settings.registrationOpen)return NextResponse.json({message:"Pendaftaran sedang ditutup."},{status:403});
  const nik=val("nik"),email=val("email").toLowerCase();
  const matches=await Member.find({$or:[{nik},{email}]}).select('nik email status').lean();
  const conflict=registrationConflict(matches as any,nik,email);
  if(conflict.message)return NextResponse.json({message:conflict.message},{status:409});
  const previous=conflict.retry?matches.find((m:any)=>m.nik===nik&&m.email===email):null;
  const accounts=await User.find({$or:[{nik},{email}]}).select('role memberId nik email').lean();
  if(accounts.some((u:any)=>!previous||u.role!=='member'||String(u.memberId)!==String(previous._id)))return NextResponse.json({message:"NIK atau email masih digunakan oleh akun pengguna. Hubungi pengurus untuk memeriksa akun tersebut."},{status:409});
  const files:Record<string,string>={};
  try{for(const key of ["photo","ktp"]){files[key+"Url"]=await saveUploadedFile(f.get(key) as File|null,key);if(files[key+"Url"])uploaded.push(files[key+"Url"])}}catch(e){await Promise.all(uploaded.map(removeUploadedFile));return NextResponse.json({message:(e as Error).message},{status:400})}
  const data={name:val("name"),nik,email,phone:val("phone"),gender:val("gender"),address:val("address"),...membership,...files,status:"pending",verificationNotes:"",verifiedAt:null,verifiedBy:null};
  if(previous){
   await User.updateMany({role:'member',memberId:previous._id},{$set:{active:false}});
   member=await Member.findOneAndUpdate({_id:previous._id,status:'rejected'},{$set:data},{new:true,runValidators:true});
   if(!member){await Promise.all(uploaded.map(removeUploadedFile));return NextResponse.json({message:"Pendaftaran sudah diproses. Muat ulang formulir."},{status:409})}
  }else{member=await Member.create(data);created=true}

  committed=true;
  await writeAudit({action:previous?"REGISTER_RESUBMIT":"REGISTER",entity:"Member",entityId:member._id.toString(),details:{name:member.name,position:member.position,membershipType:member.membershipType,branchType:member.branchType,province:member.province,city:member.city}});
  return NextResponse.json({success:true,message:"Pendaftaran berhasil. Data menunggu verifikasi pengurus. Akun dan kata sandi dikirim ke email setelah pendaftaran diterima."},{status:201});
 }catch(e:any){if(!committed){if(member&&created)await Member.deleteOne({_id:member._id});await Promise.all(uploaded.map(removeUploadedFile))}console.error(e);return NextResponse.json({message:e?.code===11000?"Data sudah digunakan.":"Pendaftaran gagal."},{status:e?.code===11000?409:500})}
}



