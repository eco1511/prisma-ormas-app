import {NextResponse} from "next/server";
import {connectMongoDB} from "@/lib/mongodb";
import {Setting} from "@/models/Setting";
import {getSession} from "@/lib/auth";
import {removeUploadedFile,saveUploadedFile} from "@/lib/uploads";

export const runtime="nodejs";
const logoUploadOptions={maxSizeBytes:500*1024,maxSizeMessage:"Ukuran logo maksimal 500 KB."};

async function isAdmin(){
 const session=await getSession();
 return session&&["admin","superadmin"].includes(session.role);
}

export async function POST(req:Request){
 if(!await isAdmin())return NextResponse.json({message:"Unauthorized"},{status:401});
 const form=await req.formData();const file=form.get("logo");
 if(!(file instanceof File)||file.size===0)return NextResponse.json({message:"Pilih berkas logo JPG atau PNG."},{status:400});
 let logoUrl="";
 try{
  logoUrl=await saveUploadedFile(file,"logo",logoUploadOptions);
  await connectMongoDB();
  const previous=await Setting.findOne({key:"main"}).select("logoUrl").lean() as {logoUrl?:string}|null;
  await Setting.findOneAndUpdate({key:"main"},{$set:{logoUrl}},{new:true,upsert:true});
  if(previous?.logoUrl)await removeUploadedFile(previous.logoUrl);
  return NextResponse.json({logoUrl});
 }catch(error){
  if(logoUrl)await removeUploadedFile(logoUrl);
  console.error("Logo organisasi gagal disimpan.",error);
  return NextResponse.json({message:"Logo gagal disimpan."},{status:500});
 }
}

export async function DELETE(){
 if(!await isAdmin())return NextResponse.json({message:"Unauthorized"},{status:401});
 try{
  await connectMongoDB();
  const previous=await Setting.findOne({key:"main"}).select("logoUrl").lean() as {logoUrl?:string}|null;
  await Setting.findOneAndUpdate({key:"main"},{$set:{logoUrl:""}},{new:true,upsert:true});
  if(previous?.logoUrl)await removeUploadedFile(previous.logoUrl);
  return NextResponse.json({logoUrl:""});
 }catch(error){
  console.error("Logo organisasi gagal dihapus.",error);
  return NextResponse.json({message:"Logo gagal dihapus."},{status:500});
 }
}
