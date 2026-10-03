import {loadEnvConfig} from '@next/env';
import mongoose from 'mongoose';
import assert from 'node:assert/strict';
import {SignJWT} from 'jose';
import {Member} from '../models/Member';
import {User} from '../models/User';
import {AuditLog} from '../models/AuditLog';
import {removeUploadedFile} from '../lib/uploads';
import regions from '../data/regions.json';
loadEnvConfig(process.cwd());
const base='http://localhost:3100';const ids:string[]=[];const urls:string[]=[];const tag='QA'+Date.now();
async function main(){
 await mongoose.connect(process.env.MONGODB_URI!);
 const c=regions.regencies[0];const nik=String(Date.now()).padStart(16,'9');
 const data={name:tag,nik,email:tag.toLowerCase()+'@example.test',phone:'081234567890',address:'Alamat pengujian',password:'Testing123!',membershipType:'Cabang',branchType:'Provinsi',provinceId:c.provinceId,position:'Sekretaris'};
 function form(extra:Record<string,string>={}){const f=new FormData();for(const [k,v] of Object.entries({...data,...extra}))f.set(k,v);return f}
 let r=await fetch(base+'/api/register',{method:'POST',body:form({cityId:c.id})});assert.equal(r.status,400);
 const f=form();f.set('ktp',new File(['%PDF-1.7\n%%EOF'],'test.pdf',{type:'application/pdf'}));
 r=await fetch(base+'/api/register',{method:'POST',body:f});assert.equal(r.status,201,await r.text());
 let m=await Member.findOne({nik});assert.ok(m);ids.push(String(m._id));urls.push(m.ktpUrl);assert.equal(m.city,'');assert.equal(m.membershipType,'Cabang');assert.equal(m.status,'pending');
 r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:nik,password:data.password,portal:'member'})});assert.equal(r.status,200);const cookie=r.headers.get('set-cookie')!.split(';')[0];
 r=await fetch(base+m.ktpUrl);assert.equal(r.status,401);
 r=await fetch(base+m.ktpUrl,{headers:{cookie}});assert.equal(r.status,200);
 const secret=new TextEncoder().encode(process.env.AUTH_SECRET||'development-secret-change-this-please');
 async function token(role:string,memberId?:string){return 'prisma_session='+await new SignJWT({userId:new mongoose.Types.ObjectId().toString(),role,name:'QA',memberId}).setProtectedHeader({alg:'HS256'}).setExpirationTime('5m').sign(secret)}
 const other=await token('member',new mongoose.Types.ObjectId().toString());r=await fetch(base+m.ktpUrl,{headers:{cookie:other}});assert.equal(r.status,403);
 const admin=await token('admin');r=await fetch(base+'/api/members/'+m._id+'/verify',{method:'PATCH',headers:{cookie:admin,'Content-Type':'application/json'},body:JSON.stringify({status:'active'})});assert.equal(r.status,200);m=await r.json();assert.ok(m.memberNo);
 r=await fetch(base+'/verifikasi/'+m.memberNo);let html=await r.text();assert.equal(r.status,200);assert.ok(html.includes(tag));assert.ok(html.includes('Cabang'));assert.ok(!html.includes(nik));assert.ok(!html.includes(m.ktpUrl));
 for(const status of ['active','pending','inactive']){await Member.updateOne({_id:m._id},{$set:{status}});r=await fetch(base+'/api/members?status='+status+'&q='+tag,{headers:{cookie:admin}});const rows=await r.json();assert.equal(rows.length,1);assert.equal(rows[0].status,status)}
 r=await fetch(base+'/verifikasi/'+m.memberNo);html=await r.text();assert.ok(html.includes('Tidak aktif'));
 console.log('PASS: registrasi, validasi cabang, login, dokumen privat (401/403/200), QR publik tanpa NIK/KTP, filter tiga status, status QR terkini.');
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{for(const id of ids){const u=await User.findOne({memberId:id});if(u)await AuditLog.deleteMany({actorId:u._id});await AuditLog.deleteMany({entityId:id});await User.deleteMany({memberId:id});await Member.deleteOne({_id:id})}await Promise.all(urls.map(removeUploadedFile));await mongoose.disconnect()});
