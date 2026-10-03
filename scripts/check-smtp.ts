import {loadEnvConfig} from '@next/env';
import nodemailer from 'nodemailer';
import {smtpConfig,smtpErrorHint} from '../lib/smtp';
loadEnvConfig(process.cwd());
async function main(){
 let transport:ReturnType<typeof nodemailer.createTransport>|undefined;
 try{const config=smtpConfig();transport=nodemailer.createTransport(config.transport);await transport.verify();console.log('Koneksi dan autentikasi SMTP berhasil. Tidak ada email yang dikirim.');}
 catch(error){const e=error as {code?:string;responseCode?:number};const code=['EAUTH','ECONNECTION','ETIMEDOUT','ESOCKET','EDNS'].includes(e.code||'')?e.code:'CONFIG_OR_SMTP';console.error('Pemeriksaan SMTP gagal. Kode: '+code+'; respons: '+(Number(e.responseCode)||0)+'. '+smtpErrorHint(error));process.exitCode=1}
 finally{transport?.close()}
}
void main();
