import { Member } from "@/models/Member";
import { User } from "@/models/User";
import { writeAudit } from "./audit";
import { validateMemberInput } from "./member-input";
export async function memberIdentityConflict(nik: string, email: string, exceptId?: string) {
  const members: Record<string, unknown> = { $or: [{nik},{email}] };
  const users: Record<string, unknown> = { $or: [{nik},{email}] };
  if(exceptId) { members._id = {$ne:exceptId}; users.memberId = {$ne:exceptId}; }
  const [member, user] = await Promise.all([Member.exists(members), User.exists(users)]);
  return Boolean(member || user);
}
export async function createAdminMember(data: ReturnType<typeof validateMemberInput>, actorId: string, source: "manual" | "excel") {
  if(await memberIdentityConflict(data.nik,data.email)) throw Error("NIK atau email sudah terdaftar.");
  const member = await Member.create({...data,status:"pending"});
  await writeAudit({actorId,action:"REGISTER",entity:"Member",entityId:String(member._id),details:{name:member.name,position:member.position,membershipType:member.membershipType,branchType:member.branchType,province:member.province,city:member.city,source}});
  return member;
}
