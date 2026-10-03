import {sendEmail} from "./smtp";
export {smtpConfig as registrationMailConfig} from "./smtp";
export type RegistrationAccount = {name:string;email:string;username:string;password:string};
export function registrationMessage(account:RegistrationAccount, appUrl:string){
 const loginUrl=new URL('/login/anggota',appUrl).toString();
 return {to:{name:account.name,address:account.email},subject:'Pendaftaran Anggota PRISMA Disetujui - Informasi Akun',text:[`Halo ${account.name},`,'','Pendaftaran anggota PRISMA Anda telah disetujui oleh pengurus. Akun Anda sudah aktif.','',`Username (NIK): ${account.username}`,`Kata sandi: ${account.password}`,`Login anggota: ${loginUrl}`,'','Gunakan NIK sebagai username. Silakan login dan segera ubah kata sandi Anda.','Simpan informasi akun ini secara pribadi.','', 'Salam,','Pengurus PRISMA'].join('\n')};
}
export async function sendRegistrationEmail(account:RegistrationAccount):Promise<boolean>{return sendEmail(url=>registrationMessage(account,url),'persetujuan pendaftaran');}
