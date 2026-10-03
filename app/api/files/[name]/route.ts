import {NextResponse} from "next/server";
import {readFile} from "fs/promises";
import path from "path";
import {getSession} from "@/lib/auth";
import {connectMongoDB} from "@/lib/mongodb";
import {Member} from "@/models/Member";
import {Mutation} from "@/models/Mutation";
import {Setting} from "@/models/Setting";
import {uploadRoot} from "@/lib/uploads";
export const runtime="nodejs";
export async function GET(_:Request,{params}:{params:Promise<{name:string}>}){
 const {name}=await params;if(!/^(photo|ktp|sk|mutation|logo)-[a-f0-9-]+\.(jpg|png|pdf)$/.test(name))return new NextResponse("Not found",{status:404});
 const isLogo=name.startsWith("logo-");const s=isLogo?null:await getSession();if(!isLogo&&!s)return new NextResponse("Unauthorized",{status:401});
 const url="/api/files/"+name;
 if(isLogo){await connectMongoDB();if(!await Setting.exists({key:"main",logoUrl:url}))return new NextResponse("Not found",{status:404})}
 if(s?.role==="member"){
  if(!s.memberId)return new NextResponse("Forbidden",{status:403});
  await connectMongoDB();
  const own=await Member.exists({_id:s.memberId,$or:[{photoUrl:url},{ktpUrl:url},{skUrl:url}]});
  const mutation=own?true:await Mutation.exists({memberId:s.memberId,documentUrl:url});
  if(!own&&!mutation)return new NextResponse("Forbidden",{status:403});
 }
 try{const bytes=await readFile(path.join(uploadRoot(),name));return new NextResponse(bytes,{headers:{"Content-Type":name.endsWith(".pdf")?"application/pdf":name.endsWith(".png")?"image/png":"image/jpeg","Cache-Control":isLogo?"public, max-age=3600":"private, no-store","X-Content-Type-Options":"nosniff","Content-Disposition":'inline; filename="'+name+'"'}})}catch{return new NextResponse("Not found",{status:404})}
}
