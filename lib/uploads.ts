import {mkdir,writeFile,unlink} from "fs/promises";
import path from "path";
import {randomUUID} from "crypto";
import {MAX_REGISTRATION_FILE_SIZE_BYTES} from "./upload-constraints";
export const uploadRoot=()=>path.resolve(process.env.UPLOAD_DIR||path.join(process.cwd(),"storage","uploads"));
export async function saveUploadedFile(file:File|null,prefix:string,options?:{maxSizeBytes:number;maxSizeMessage:string}){
 if(!file||file.size===0)return "";
 if(typeof file.arrayBuffer!=="function")throw new Error("Berkas tidak valid.");
 const maxSizeBytes=options?.maxSizeBytes??5*1024*1024;
 if(file.size>maxSizeBytes)throw new Error(options?.maxSizeMessage??"Ukuran berkas maksimal 5 MB.");
 const bytes=Buffer.from(await file.arrayBuffer());
 const ext=bytes.subarray(0,3).equals(Buffer.from([255,216,255]))?"jpg":bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?"png":bytes.subarray(0,5).toString()==="%PDF-"?"pdf":"";
 if(!ext||(["photo","logo"].includes(prefix)&&ext==="pdf"))throw new Error(prefix==="logo"?"Gunakan berkas JPG atau PNG untuk logo.":"Gunakan JPG/PNG untuk foto, atau JPG/PNG/PDF untuk dokumen.");
 const safe=prefix+"-"+randomUUID()+"."+ext;
 await mkdir(uploadRoot(),{recursive:true});await writeFile(path.join(uploadRoot(),safe),bytes);
 return "/api/files/"+safe;
}
export async function removeUploadedFile(url:string){if(url.startsWith("/api/files/"))await unlink(path.join(uploadRoot(),path.basename(url))).catch(()=>{});}
