import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { User } from "@/models/User";
import { parseMemberWorkbook } from "@/lib/member-sheet";
import { createAdminMember } from "@/lib/member-admin";
export const runtime="nodejs";
export async function POST(req: Request) {
  const session=await getSession();if(!session||!["admin","superadmin"].includes(session.role))return NextResponse.json({message:"Unauthorized"},{status:401});
  try {
    const form=await req.formData(),file=form.get("file");
    if(!(file instanceof File) || !/\.xlsx$/i.test(file.name))return NextResponse.json({message:"Pilih file Excel .xlsx."},{status:400});
    if(!file.size || file.size>5*1024*1024)return NextResponse.json({message:"Ukuran file harus antara 1 byte dan 5 MB."},{status:400});
    const rows=await parseMemberWorkbook(Buffer.from(await file.arrayBuffer()));await connectMongoDB();
    const identities=rows.flatMap(row=>row.data?[{nik:row.data.nik},{email:row.data.email}]:[]);
    if(identities.length){
      const [members,users]=await Promise.all([Member.find({$or:identities}).select("nik email").lean(),User.find({$or:identities}).select("nik email").lean()]);
      const niks=new Set([...members,...users].map(x=>String(x.nik))),emails=new Set([...members,...users].map(x=>String(x.email).toLowerCase()));
      for(const row of rows)if(row.data && (niks.has(row.data.nik)||emails.has(row.data.email)))row.error="NIK atau email sudah terdaftar. Data lama tidak diubah.";
    }
    if(new URL(req.url).searchParams.get("preview")==="1")return NextResponse.json({total:rows.length,valid:rows.filter(r=>r.data&&!r.error).length,invalid:rows.filter(r=>r.error).length,rows:rows.map(r=>({row:r.row,name:r.name,error:r.error,position:r.data?.position,region:r.data?.membershipType==="Pusat"?"Nasional":[r.data?.city,r.data?.province].filter(Boolean).join(", ")}))});
    let imported=0;
    const errors=rows.filter(r=>r.error).map(r=>({row:r.row,name:r.name,message:r.error!}));
    for(const row of rows){if(!row.data||row.error)continue;try{await createAdminMember(row.data,session.userId,"excel");imported++;}catch(error){const e=error as {code?:number;message?:string};errors.push({row:row.row,name:row.name,message:e.code===11000?"NIK atau email sudah terdaftar.":e.message||"Gagal menyimpan baris ini."});}}
    return NextResponse.json({total:rows.length,imported,skipped:errors.length,errors,message:imported+" anggota berhasil diimpor. "+errors.length+" baris dilewati."});
  }catch(error){return NextResponse.json({message:(error as Error).message||"Impor gagal."},{status:400});}
}
