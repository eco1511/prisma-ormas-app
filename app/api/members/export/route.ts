import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { memberFilter } from "@/lib/member-input";
export const runtime="nodejs";
export async function GET(req:Request) {
 const session=await getSession();if(!session||!["admin","superadmin"].includes(session.role))return NextResponse.json({message:"Unauthorized"},{status:401});
 const url=new URL(req.url),format=url.searchParams.get("format");if(!["pdf","xlsx"].includes(format||""))return NextResponse.json({message:"Format ekspor tidak valid."},{status:400});
 try {
  await connectMongoDB();const members=await Member.find(memberFilter(url)).sort({createdAt:-1}).limit(10001).lean();
  if(members.length>10000)return NextResponse.json({message:"Maksimal 10.000 anggota per ekspor. Persempit filter."},{status:400});
  let bytes:Uint8Array,type:string;
  if(format==="xlsx"){const {createMembersWorkbook}=await import("@/lib/member-sheet");bytes=new Uint8Array(await createMembersWorkbook(members).xlsx.writeBuffer());type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";}
  else{const {createMembersPdf}=await import("@/lib/member-pdf");bytes=new Uint8Array(createMembersPdf(members,{q:url.searchParams.get("q")||"",status:url.searchParams.get("status")||""}).output("arraybuffer"));type="application/pdf";}
  const date=new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Jakarta"});
  return new NextResponse(Uint8Array.from(bytes).buffer,{headers:{"Content-Type":type,"Content-Disposition":'attachment; filename="anggota-prisma-'+date+'.'+format+'"',"Cache-Control":"private, no-store"}});
 }catch{ return NextResponse.json({message:"Gagal mengekspor anggota. Coba kembali."},{status:500}); }
}
