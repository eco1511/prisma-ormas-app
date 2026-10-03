import {NextResponse} from "next/server";
import {isValidObjectId} from "mongoose";
import {connectMongoDB} from "@/lib/mongodb";
import {Member} from "@/models/Member";
import {getSession} from "@/lib/auth";
import {writeAudit} from "@/lib/audit";
import {removeUploadedFile,saveUploadedFile} from "@/lib/uploads";

export const runtime="nodejs";
const photoOptions={maxSizeBytes:5*1024*1024,maxSizeMessage:"Ukuran foto maksimal 5 MB."};

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const session=await getSession();
 if(!session||!["admin","superadmin"].includes(session.role))return NextResponse.json({message:"Unauthorized"},{status:401});
 const {id}=await params;
 if(!isValidObjectId(id))return NextResponse.json({message:"ID tidak valid."},{status:400});
 const form=await req.formData();const file=form.get("photo");
 if(!(file instanceof File)||file.size===0)return NextResponse.json({message:"Pilih foto JPG atau PNG."},{status:400});
 let photoUrl="";
 try{
  await connectMongoDB();
  const member=await Member.findById(id).select("name photoUrl");
  if(!member)return NextResponse.json({message:"Anggota tidak ditemukan."},{status:404});
  photoUrl=await saveUploadedFile(file,"photo",photoOptions);
  const previousPhotoUrl=member.photoUrl;
  member.photoUrl=photoUrl;
  await member.save();
  await writeAudit({actorId:session.userId,action:"UPDATE_MEMBER_PHOTO",entity:"Member",entityId:id}).catch(()=>console.error("Audit perubahan foto anggota gagal disimpan."));
  if(previousPhotoUrl)await removeUploadedFile(previousPhotoUrl);
  return NextResponse.json({photoUrl});
 }catch(error){
  if(photoUrl)await removeUploadedFile(photoUrl);
  console.error("Foto anggota gagal diperbarui.",error);
  return NextResponse.json({message:"Foto gagal diperbarui."},{status:500});
 }
}
