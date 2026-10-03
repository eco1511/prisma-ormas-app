import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { Mutation } from "@/models/Mutation";
import { getSession } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/uploads";
import {writeAudit} from "@/lib/audit";
export const runtime="nodejs";
export async function GET(){const s=await getSession();if(!s)return NextResponse.json({message:"Unauthorized"},{status:401});await connectMongoDB();const filter=s.role==="member"?{memberId:s.memberId}:{};const rows=await Mutation.find(filter).populate("memberId","name memberNo nik email phone level position membershipType branchType province city").sort({createdAt:-1}).lean();return NextResponse.json(rows);}
export async function POST(req:Request){const s=await getSession();if(!s||s.role!=="member"||!s.memberId)return NextResponse.json({message:"Unauthorized"},{status:401});await connectMongoDB();const f=await req.formData();const requestType=String(f.get("requestType")||"");const reason=String(f.get("reason")||"");if(!requestType||!reason)return NextResponse.json({message:"Jenis pengajuan dan alasan wajib diisi."},{status:400});const member=await Member.findById(s.memberId).select("name position membershipType branchType province city");if(!member)return NextResponse.json({message:"Anggota tidak ditemukan."},{status:404});const documentUrl=await saveUploadedFile(f.get("document") as File|null,"mutation");const row=await Mutation.create({memberId:s.memberId,requestType,targetLevel:String(f.get("targetLevel")||""),targetPosition:String(f.get("targetPosition")||""),reason,documentUrl});await writeAudit({actorId:s.userId,action:"MUTATION_REQUEST",entity:"Mutation",entityId:row._id.toString(),details:{name:member.name,position:member.position,membershipType:member.membershipType,branchType:member.branchType,province:member.province,city:member.city,requestType}});return NextResponse.json(row,{status:201});}
