export type ExistingRegistration={nik:string;email:string;status:string};
export function registrationConflict(existing:ExistingRegistration[],nik:string,email:string){
 const same=existing.find(m=>m.nik===nik&&m.email.toLowerCase()===email);
 const different=existing.find(m=>m!==same);
 const blocked=different||(same?.status==='rejected'?undefined:same);
 if(!blocked)return {retry:!!same,message:null};
 const field=blocked.nik===nik?'NIK':'Email';
 if(blocked.status==='pending')return {retry:false,message:field+' sudah digunakan pada pendaftaran yang menunggu verifikasi pengurus.'};
 if(blocked.status==='rejected')return {retry:false,message:field+' sudah digunakan pada pendaftaran yang ditolak. Untuk mendaftar ulang, gunakan NIK dan email yang sama seperti pendaftaran sebelumnya.'};
 return {retry:false,message:field+' sudah terdaftar sebagai anggota. Silakan login atau hubungi pengurus.'};
}
