import {NextResponse} from "next/server";
import {connectMongoDB} from "@/lib/mongodb";
import {Member} from "@/models/Member";
export async function GET(req:Request){
 const q=new URL(req.url).searchParams.get("q")?.trim()||"";if(q.length<3)return NextResponse.json([]);
 await connectMongoDB();const literal=q.replace(/[.*+?^$()|[\]\\]/g,"\\$&");
 const rows=await Member.find({status:{$in:["active","pending","inactive"]},$or:[{name:{$regex:literal,$options:"i"}},{memberNo:{$regex:literal,$options:"i"}}]}).select("name memberNo status membershipType branchType level position province city").limit(10).lean();return NextResponse.json(rows);
}


