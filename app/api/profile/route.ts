import {NextResponse} from "next/server";
import {connectMongoDB} from "@/lib/mongodb";
import {Member} from "@/models/Member";
import {Setting} from "@/models/Setting";
import {getSession} from "@/lib/auth";
import {saveUploadedFile,removeUploadedFile} from "@/lib/uploads";
export async function GET(){const s=await getSession();if(!s||s.role!=="member"||!s.memberId)return NextResponse.json({message:"Unauthorized"},{status:401});await connectMongoDB();const [m,settings]=await Promise.all([Member.findById(s.memberId).lean(),Setting.findOne({key:'main'}).select('organizationName').lean<{organizationName?:string}>()]);if(!m)return NextResponse.json({message:'Anggota tidak ditemukan.'},{status:404});return NextResponse.json({...m,organizationName:settings?.organizationName?.trim()||(m as any).organizationName?.trim()||'PRISMA'},{headers:{'Cache-Control':'no-store'}});}
export async function PATCH(req:Request){
 const s=await getSession();if(!s||s.role!=="member"||!s.memberId)return NextResponse.json({message:"Unauthorized"},{status:401});
 await connectMongoDB();const m=await Member.findById(s.memberId);if(!m)return NextResponse.json({message:"Anggota tidak ditemukan."},{status:404});
 const uploaded:string[]=[];const old:string[]=[];const update:Record<string,string>={};
 try{const f=await req.formData();for(const key of ["photo","ktp","sk"]){const url=await saveUploadedFile(f.get(key) as File|null,key);if(url){uploaded.push(url);update[key+"Url"]=url;if(m[key+"Url"])old.push(m[key+"Url"])}}}catch(e){await Promise.all(uploaded.map(removeUploadedFile));return NextResponse.json({message:(e as Error).message},{status:400})}
 try{Object.assign(m,update);await m.save()}catch{await Promise.all(uploaded.map(removeUploadedFile));return NextResponse.json({message:"Dokumen gagal disimpan."},{status:500})}
 await Promise.all(old.map(removeUploadedFile));return NextResponse.json(m);
}
