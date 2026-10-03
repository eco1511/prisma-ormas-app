import nodemailer, {SendMailOptions} from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
export function smtpConfig(env:Record<string,string|undefined>=process.env){
 const host=env.SMTP_HOST?.trim(),user=env.SMTP_USER?.trim(),port=Number(env.SMTP_PORT||587);
 if(!host||!user||!env.SMTP_FROM||!env.APP_URL)throw Error('Konfigurasi email belum lengkap.');
 if(!/^[a-zA-Z0-9.-]+$/.test(host))throw Error('SMTP_HOST harus hostname tanpa protokol.');
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('Port SMTP tidak valid.');
 const url=new URL(env.APP_URL);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error('APP_URL tidak valid.');
 if(env.SMTP_SECURE&&!['true','false'].includes(env.SMTP_SECURE))throw Error('SMTP_SECURE tidak valid.');
 const secure=env.SMTP_SECURE?env.SMTP_SECURE==='true':port===465;
 if((port===465&&!secure)||(port===587&&secure))throw Error('SMTP_SECURE tidak sesuai port.');
 let auth:SMTPTransport.Options['auth'];
 if(env.SMTP_AUTH_TYPE==='oauth2'){
  if(!env.SMTP_ACCESS_TOKEN&&!(env.SMTP_CLIENT_ID&&env.SMTP_CLIENT_SECRET&&env.SMTP_REFRESH_TOKEN))throw Error('Konfigurasi OAuth2 SMTP belum lengkap.');
  auth={type:'OAuth2',user,accessToken:env.SMTP_ACCESS_TOKEN,clientId:env.SMTP_CLIENT_ID,clientSecret:env.SMTP_CLIENT_SECRET,refreshToken:env.SMTP_REFRESH_TOKEN,accessUrl:env.SMTP_TOKEN_URL||'https://login.microsoftonline.com/common/oauth2/v2.0/token'};
 }else{
  if(env.SMTP_AUTH_TYPE&&env.SMTP_AUTH_TYPE!=='password')throw Error('SMTP_AUTH_TYPE tidak valid.');
  if(!env.SMTP_PASS)throw Error('SMTP_PASS belum diatur.');
  const pass=host.toLowerCase()==='smtp.gmail.com'?env.SMTP_PASS.replace(/\s/g,''):env.SMTP_PASS;
  if(host.toLowerCase()==='smtp.gmail.com'&&!/^[a-zA-Z]{16}$/.test(pass))throw Error('SMTP_PASS Gmail harus App Password 16 huruf dari Google, bukan password login akun.');
  auth={user,pass};
 }
 return {from:env.SMTP_FROM,appUrl:url.origin,transport:{host,port,secure,requireTLS:!secure,auth,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,logger:false,debug:false,disableFileAccess:true,disableUrlAccess:true}};
}
export function smtpErrorHint(error:unknown,host=process.env.SMTP_HOST){
 const e=error as {code?:string;responseCode?:number;message?:string};
 if(host?.trim().toLowerCase()==='smtp.gmail.com'){
  if(e.code==='EAUTH'||e.responseCode===535)return 'Gmail menolak autentikasi. Buat App Password baru untuk akun SMTP_USER, isi SMTP_PASS, lalu restart aplikasi.';
  if(e.message?.startsWith('SMTP_PASS Gmail'))return 'SMTP_PASS Gmail harus App Password 16 huruf. Aktifkan Verifikasi 2 Langkah lalu buat App Password di myaccount.google.com/apppasswords.';
 }
 return 'Lengkapi konfigurasi SMTP dan periksa layanan provider.';
}
export async function sendEmail(message:(url:string)=>SendMailOptions,label:string):Promise<boolean>{
 try{const c=smtpConfig(),t=nodemailer.createTransport(c.transport);try{const r=await t.sendMail({from:c.from,...message(c.appUrl)});return r.accepted.length>0&&r.rejected.length===0}finally{t.close()}}
 catch(error){const e=error as {code?:string;responseCode?:number};const code=['EAUTH','ECONNECTION','ETIMEDOUT','ESOCKET','EENVELOPE','EMESSAGE','EDNS'].includes(e.code||'')?e.code:'CONFIG_OR_SMTP';console.error('Email '+label+' gagal dikirim. Kode: '+code+'; respons: '+(Number(e.responseCode)||0)+'. '+smtpErrorHint(error));return false}
}
