import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { validateMemberInput } from "@/lib/member-input";
import { memberIdentityConflict } from "@/lib/member-admin";
import { getAdminOrganizationName } from "@/lib/admin-organization";
import { updateMemberWithAccount } from "@/lib/update-member-account";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}) {
 const session=await getSession();if(!session)return NextResponse.json({message:"Unauthorized"},{status:401});const {id}=await params;
 if(session.role==="member"&&session.memberId!==id)return NextResponse.json({message:"Forbidden"},{status:403});
 if(!isValidObjectId(id))return NextResponse.json({message:"ID tidak valid."},{status:400});
 await connectMongoDB();const member=await Member.findById(id).lean();return member?NextResponse.json(member):NextResponse.json({message:"Tidak ditemukan."},{status:404});
}
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}) {
 const session=await getSession();if(!session)return NextResponse.json({message:"Unauthorized"},{status:401});const {id}=await params;
 if(session.role==="member"&&session.memberId!==id)return NextResponse.json({message:"Forbidden"},{status:403});
 if(!isValidObjectId(id))return NextResponse.json({message:"ID tidak valid."},{status:400});
 try {
  await connectMongoDB();const current=await Member.findById(id);if(!current)return NextResponse.json({message:"Tidak ditemukan."},{status:404});
  const body=await req.json();
  if(body.status && body.status!==current.status)return NextResponse.json({message:"Ubah status melalui verifikasi atau pengajuan mutasi."},{status:400});
  let update:Record<string,unknown>;
  if(session.role==="member") {
    update=Object.fromEntries(Object.entries(body).filter(([key])=>["name","email","phone","birthDate","address"].includes(key)));
    for(const key of ["name","email","phone","address"])if(key in update)update[key]=String(update[key]??"").trim();
    if("email" in update)update.email=String(update.email).toLowerCase();
    if(["name","email","phone","address"].some(key=>key in update&&!update[key]))throw Error("Data wajib tidak boleh kosong.");
    if(update.email&&!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(String(update.email)))throw Error("Alamat email tidak valid.");
    if(update.birthDate==="")update.birthDate=null;
  } else {
    const previous=current.toObject();
    const organizationName=await getAdminOrganizationName();
    update=validateMemberInput({...previous,birthDate:previous.birthDate?new Date(previous.birthDate).toISOString().slice(0,10):"",...body,organizationName});
  }
  if(await memberIdentityConflict(String(update.nik||current.nik),String(update.email||current.email),id))return NextResponse.json({message:"NIK atau email sudah digunakan oleh anggota/akun lain."},{status:409});
  const account=await User.findOne({memberId:id,role:"member"});
  const identity={name:update.name||current.name,email:update.email||current.email,nik:update.nik||current.nik};
  const item=await updateMemberWithAccount({
    saveAccount:async()=>{if(account)await User.updateOne({_id:account._id},{$set:identity},{runValidators:true});},
    saveMember:async()=>{const updated=await Member.findOneAndUpdate({_id:id,updatedAt:current.updatedAt},{$set:update},{new:true,runValidators:true});if(!updated)throw Error("Data telah berubah. Muat ulang anggota sebelum menyimpan.");return updated;},
    restoreAccount:async()=>{if(account)await User.updateOne({_id:account._id},{$set:{name:account.name,email:account.email,nik:account.nik}},{runValidators:true});},
  });
  await writeAudit({actorId:session.userId,action:"UPDATE",entity:"Member",entityId:id,details:update});return NextResponse.json(item);
 } catch(error){const e=error as {code?:number;message?:string};return NextResponse.json({message:e.code===11000?"NIK atau email sudah digunakan akun lain.":e.message||"Data tidak valid."},{status:e.code===11000?409:400});}
}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}) {
 const session=await getSession();if(!session||!["admin","superadmin"].includes(session.role))return NextResponse.json({message:"Unauthorized"},{status:401});
 const {id}=await params;if(!isValidObjectId(id))return NextResponse.json({message:"ID tidak valid."},{status:400});
 await connectMongoDB();await Member.findByIdAndDelete(id);await User.deleteOne({memberId:id});await writeAudit({actorId:session.userId,action:"DELETE",entity:"Member",entityId:id});return NextResponse.json({success:true});
}
