import {loadEnvConfig} from "@next/env";
import mongoose from "mongoose";
import regions from "../data/regions.json";
import {Region} from "../models/Region";
import {Position} from "../models/Position";
loadEnvConfig(process.cwd());
async function main(){
 await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/prisma_anggota",{serverSelectionTimeoutMS:5000});
 const rows=[...regions.provinces.map(p=>({code:p.id,name:p.name,type:"province",provinceCode:p.id})),...regions.regencies.map(c=>({code:c.id,name:c.name,type:"regency",provinceCode:c.provinceId}))];
 await Region.bulkWrite(rows.map(r=>({updateOne:{filter:{code:r.code},update:{$set:r},upsert:true}})));
 for(const level of ["Pusat","Provinsi","Kabupaten/Kota"]) for(const [order,name] of ["Ketua","Sekretaris","Bendahara","Anggota"].entries()) await Position.updateOne({name,level},{$set:{name,level,order,active:true}},{upsert:true});
 console.log("Master tersimpan: 38 provinsi, 514 kabupaten/kota, 4 jabatan per tingkat.");
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>mongoose.disconnect());
