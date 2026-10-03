import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { getSession } from "@/lib/auth";
import { memberFilter, validateMemberInput } from "@/lib/member-input";
import { getAdminOrganizationName } from "@/lib/admin-organization";
import { createAdminMember } from "@/lib/member-admin";
export async function GET(req:Request){
 const session=await getSession(); if(!session||!["admin","superadmin"].includes(session.role)) return NextResponse.json({message:"Unauthorized"},{status:401});
 await connectMongoDB();
 const items=await Member.find(memberFilter(new URL(req.url))).sort({createdAt:-1}).limit(500).lean(); return NextResponse.json(items);
}
export async function POST(req: Request) {
 const session=await getSession();if(!session||!["admin","superadmin"].includes(session.role))return NextResponse.json({message:"Unauthorized"},{status:401});
 try {const body=await req.json();await connectMongoDB();const organizationName=await getAdminOrganizationName();const data=validateMemberInput({...body,organizationName});const member=await createAdminMember(data,session.userId,"manual");return NextResponse.json(member,{status:201});}
 catch(error){const e=error as {message?:string;code?:number};return NextResponse.json({message:e.code===11000?"NIK atau email sudah terdaftar.":e.message||"Gagal menambah anggota."},{status:e.code===11000?409:400});}
}
