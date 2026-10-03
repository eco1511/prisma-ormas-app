import { NextResponse } from "next/server";import {connectMongoDB} from "@/lib/mongodb";import {Position} from "@/models/Position";import {getSession} from "@/lib/auth";
export async function GET(){await connectMongoDB();return NextResponse.json(await Position.find().sort({level:1,order:1,name:1}).lean());}
export async function POST(req:Request){const s=await getSession();if(!s||!["admin","superadmin"].includes(s.role))return NextResponse.json({message:"Unauthorized"},{status:401});await connectMongoDB();return NextResponse.json(await Position.create(await req.json()),{status:201});}
