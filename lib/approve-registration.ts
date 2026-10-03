type Applicant={_id:unknown;name:string;email:string;nik:string;status:string;memberNo?:string;verificationNotes?:string;verifiedAt?:Date|null;verifiedBy?:unknown};
type Dependencies={activate:()=>Promise<Applicant|null>;saveAccount:(member:Applicant)=>Promise<void>;restore:(member:Applicant)=>Promise<void>};
export async function approveRegistration(deps:Dependencies){
 const member=await deps.activate();
 if(!member)throw Error('ALREADY_PROCESSED');
 try{await deps.saveAccount(member)}catch(error){await deps.restore(member);throw error}
 return member;
}
