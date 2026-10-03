import {sendEmail} from "./smtp";
export type RejectionNotice={name:string;email:string;requestType:string;reason:string};
export function rejectionMessage(notice:RejectionNotice,appUrl:string){
 return {to:{name:notice.name,address:notice.email},subject:"PRISMA - Pemberitahuan Penolakan Permohonan",text:[`Halo ${notice.name},`,"",`Permohonan ${notice.requestType} Anda telah ditolak oleh pengurus PRISMA.`,"",`Alasan penolakan: ${notice.reason.trim()||"Tidak ada catatan tambahan dari pengurus."}`,"",`Login anggota: ${new URL('/login/anggota',appUrl).toString()}`,"Silakan hubungi pengurus untuk informasi lebih lanjut.","","Salam,","Pengurus PRISMA"].join('\n')};
}
export async function sendRejectionEmail(notice:RejectionNotice):Promise<boolean>{return sendEmail(url=>rejectionMessage(notice,url),'penolakan');}
export function rejectionResultMessage(emailSent:boolean){return emailSent?'Permohonan ditolak. Pemberitahuan telah dikirim ke email pemohon.':'Permohonan ditolak, tetapi email pemberitahuan gagal dikirim. Periksa konfigurasi SMTP; keputusan penolakan sudah tersimpan.'}
