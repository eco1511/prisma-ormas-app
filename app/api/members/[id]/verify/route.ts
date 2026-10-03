import {NextResponse} from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {randomBytes} from "node:crypto";
import {approveRegistration} from "@/lib/approve-registration";
import {connectMongoDB} from "@/lib/mongodb";
import {Member} from "@/models/Member";
import {User} from "@/models/User";
import {getSession} from "@/lib/auth";
import {generateMemberNo} from "@/lib/utils";
import {writeAudit} from "@/lib/audit";
import {sendRegistrationEmail} from "@/lib/registration-email";
import {sendRejectionEmail} from "@/lib/rejection-email";
import {rejectRegistration} from "@/lib/reject-registration";
import {removeUploadedFile} from "@/lib/uploads";
export const runtime="nodejs";
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const s=await getSession();if(!s||!["admin","superadmin"].includes(s.role))return NextResponse.json({message:"Unauthorized"},{status:401});
 const {id}=await params;if(!mongoose.isValidObjectId(id))return NextResponse.json({message:"ID tidak valid"},{status:400});
 const body=await req.json(),{status}=body,notes=typeof body.notes==='string'?body.notes.trim():'';
 if(!["active","rejected"].includes(status))return NextResponse.json({message:"Status tidak valid"},{status:400});
 await connectMongoDB();
 const current=await Member.findById(id);if(!current)return NextResponse.json({message:"Anggota tidak ditemukan"},{status:404});
 const retry=body.resendEmail===true&&status==='active'&&current.status==='active';
 if(current.status!=='pending'&&!retry)return NextResponse.json({message:'Permohonan sudah diproses.'},{status:409});
 if(status==='rejected'){
  try{
   const result=await rejectRegistration(id,notes,{
    deletePending:async id=>await Member.findOneAndDelete({_id:id,status:'pending'}),
    deleteAccount:async memberId=>await User.deleteMany({memberId,role:'member'}),
    removeFile:removeUploadedFile,
    sendNotice:sendRejectionEmail,
    audit:async entityId=>await writeAudit({actorId:s.userId,action:'VERIFY_REJECT_DELETE',entity:'Member',entityId}),
   });
   return result?NextResponse.json(result):NextResponse.json({message:'Permohonan sudah diproses.'},{status:409});
  }catch{console.error('Pembersihan permohonan ditolak gagal.');return NextResponse.json({message:'Pembersihan data permohonan belum selesai. Hubungi pengelola untuk memeriksa data terkait.'},{status:500})}
 }
 const password=randomBytes(18).toString('base64url'),passwordHash=await bcrypt.hash(password,12);
 let approved:any;
 try{
  if(retry){
   const user=await User.findOneAndUpdate({memberId:id,role:'member'},{$set:{passwordHash,active:true}},{new:true,runValidators:true});
   if(!user)return NextResponse.json({message:'Akun anggota belum selesai dibuat. Muat ulang dan coba kembali.'},{status:409});
   approved=current;
  }else{
   const verifiedAt=new Date();
   const snapshot={status:current.status,verificationNotes:current.verificationNotes,verifiedAt:current.verifiedAt,verifiedBy:current.verifiedBy};
   approved=await approveRegistration({
    activate:async()=>{
     for(let attempt=0;attempt<5;attempt++){
      const update:any={status:'active',verificationNotes:notes,verifiedAt,verifiedBy:s.userId};
      if(!current.memberNo){
       const prefix=generateMemberNo(0).slice(0,-6);
       const last=await Member.findOne({memberNo:{$regex:'^'+prefix}}).sort({memberNo:-1}).select('memberNo').lean<{memberNo:string}>();
       const sequence=last?Number(String(last.memberNo).slice(prefix.length))+1:1;
       update.memberNo=generateMemberNo(sequence);
      }
      try{return await Member.findOneAndUpdate({_id:id,status:'pending'},{$set:update},{new:true,runValidators:true})}
      catch(error){const e=error as {code?:number;keyPattern?:Record<string,unknown>};if(e.code!==11000||!e.keyPattern?.memberNo||attempt===4)throw error}
     }
     return null;
    },
    saveAccount:async member=>{
     const existing=await User.findOne({memberId:member._id,role:'member'});
     if(existing){existing.passwordHash=passwordHash;existing.active=true;await existing.save()}
     else await User.create({name:member.name,email:member.email,nik:member.nik,passwordHash,role:'member',memberId:member._id,active:true});
    },
    restore:async()=>{
     const update:any={$set:snapshot};if(!current.memberNo)update.$unset={memberNo:1};
     await Member.updateOne({_id:id,status:'active',verifiedAt},update);
    },
   });
  }
 }catch(error){
  const e=error as {message?:string;code?:number};
  const code=e.code===11000?'DUPLICATE':e.message==='ALREADY_PROCESSED'?'ALREADY_PROCESSED':'DATABASE';
  console.error('Persetujuan anggota gagal. Kode: '+code);
  return NextResponse.json({message:code==='ALREADY_PROCESSED'?'Permohonan sudah diproses. Muat ulang daftar verifikasi.':code==='DUPLICATE'?'NIK atau email masih digunakan akun pengguna lain. Hubungi pengurus untuk memeriksa akun tersebut.':'Persetujuan gagal disimpan. Muat ulang dan coba kembali.'},{status:code==='DATABASE'?500:409});
 }
 await writeAudit({actorId:s.userId,action:retry?'APPROVAL_EMAIL_RETRY':'VERIFY_APPROVE',entity:'Member',entityId:id});
 const emailSent=await sendRegistrationEmail({name:approved.name,email:approved.email,username:approved.nik,password});
 return NextResponse.json({...approved.toObject(),emailSent,message:emailSent?'Pendaftaran diterima. Akun dan kata sandi telah dikirim ke email anggota.':'Pendaftaran diterima dan akun tersimpan, tetapi email gagal dikirim. Gunakan Kirim Ulang Email untuk mengirim kata sandi baru.'});
}
