type RejectedApplicant={_id:unknown;name:string;email:string;photoUrl?:string;ktpUrl?:string;skUrl?:string};
type Dependencies={
 deletePending:(id:string)=>Promise<RejectedApplicant|null>;
 deleteAccount:(id:unknown)=>Promise<unknown>;
 removeFile:(url:string)=>Promise<unknown>;
 sendNotice:(notice:{name:string;email:string;requestType:string;reason:string})=>Promise<boolean>;
 audit:(id:string)=>Promise<unknown>;
};
export async function rejectRegistration(id:string,reason:string,deps:Dependencies){
 const applicant=await deps.deletePending(id);
 if(!applicant)return null;
 await deps.deleteAccount(applicant._id);
 await Promise.all([applicant.photoUrl,applicant.ktpUrl,applicant.skUrl].filter((url):url is string=>!!url).map(deps.removeFile));
 await deps.audit(id);
 const emailSent=await deps.sendNotice({name:applicant.name,email:applicant.email,requestType:'pendaftaran anggota',reason});
 return {success:true,deleted:true,emailSent,message:emailSent?'Permohonan ditolak dan data permohonan dihapus. Email penolakan telah dikirim.':'Permohonan ditolak dan data permohonan dihapus, tetapi email penolakan gagal dikirim. Periksa layanan SMTP. Pemohon dapat mendaftar kembali.'};
}
