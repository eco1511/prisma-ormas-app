import {mkdir,writeFile,unlink} from "fs/promises";
import path from "path";
import {randomUUID} from "crypto";
export const uploadRoot=()=>path.resolve(process.env.UPLOAD_DIR||path.join(process.cwd(),"storage","uploads"));
export async function saveUploadedFile(file:File|null,prefix:string){
 if(!file||file.size===0)return "";
 if(typeof file.arrayBuffer!=="function")throw new Error("Berkas tidak valid.");
 if(file.size>5*1024*1024)throw new Error("Ukuran berkas maksimal 5 MB.");
 const bytes=Buffer.from(await file.arrayBuffer());
 const ext=bytes.subarray(0,3).equals(Buffer.from([255,216,255]))?"jpg":bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?"png":bytes.subarray(0,5).toString()==="%PDF-"?"pdf":"";
 if(!ext||(prefix==="photo"&&ext==="pdf"))throw new Error("Gunakan JPG/PNG untuk foto, atau JPG/PNG/PDF untuk dokumen.");
 const safe=prefix+"-"+randomUUID()+"."+ext;
 await mkdir(uploadRoot(),{recursive:true});await writeFile(path.join(uploadRoot(),safe),bytes);
 return "/api/files/"+safe;
}
export async function removeUploadedFile(url:string){if(url.startsWith("/api/files/"))await unlink(path.join(uploadRoot(),path.basename(url))).catch(()=>{});}
