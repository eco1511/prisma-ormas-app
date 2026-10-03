import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Member } from "../models/Member";
import { MasterLevel } from "../models/MasterLevel";
import { Position } from "../models/Position";
import { Setting } from "../models/Setting";
import regions from "../data/regions.json";
import { Region } from "../models/Region";
import { Organization } from "../models/Organization";

const uri=process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/prisma_anggota";
async function run(){
 await mongoose.connect(uri);
 const adminHash=await bcrypt.hash("Admin123!",12); const memberHash=await bcrypt.hash("Anggota123!",12);
 await Setting.findOneAndUpdate({key:"main"},{key:"main",organizationName:"PRISMA",email:"admin@prisma.com",address:"Jakarta",registrationOpen:true},{upsert:true,new:true});
 const levels=[['PUSAT','Pusat',1],['PROV','Provinsi',2],['KABKOT','Kabupaten/Kota',3],['KEC','Kecamatan',4],['ANG','Anggota',5]];
 for(const [code,name,order] of levels) await MasterLevel.findOneAndUpdate({code},{code,name,order,active:true},{upsert:true});
 const positions=["Pusat","Provinsi","Kabupaten/Kota"].flatMap(level=>["Ketua","Sekretaris","Bendahara","Anggota"].map((name,i)=>[name,level,i+1]));
 const regionRows=[...regions.provinces.map(p=>({code:p.id,name:p.name,type:"province",provinceCode:p.id})),...regions.regencies.map(c=>({code:c.id,name:c.name,type:"regency",provinceCode:c.provinceId}))];
 await Region.bulkWrite(regionRows.map(r=>({updateOne:{filter:{code:r.code},update:{$set:r},upsert:true}})));
 for(const [name,level,order] of positions) await Position.findOneAndUpdate({name,level},{name,level,order,active:true},{upsert:true});
 await User.findOneAndUpdate({email:"admin@prisma.com"},{name:"Admin PRISMA",email:"admin@prisma.com",passwordHash:adminHash,role:"admin",active:true},{upsert:true,new:true});
 await User.findOneAndUpdate({email:"root@prisma.com"},{name:"Super Admin",email:"root@prisma.com",passwordHash:adminHash,role:"superadmin",active:true},{upsert:true,new:true});
 let member=await Member.findOne({nik:"3271000000000001"});
 if(!member) member=await Member.create({memberNo:"PRS-2026-000001",name:"Budi Santoso",nik:"3271000000000001",email:"budi@example.com",phone:"081234567890",address:"Jakarta",province:"DKI Jakarta",city:"Jakarta Selatan",level:"Anggota",position:"Anggota",status:"active",verifiedAt:new Date()});
 await User.findOneAndUpdate({nik:member.nik},{name:member.name,email:member.email,nik:member.nik,passwordHash:memberHash,role:"member",memberId:member._id,active:true},{upsert:true,new:true});
 await Organization.findOneAndUpdate({legalNumber:"AHU-001294.AH.01.04"},{name:"Yayasan Pemuda Merdeka Indonesia",legalNumber:"AHU-001294.AH.01.04",category:"Kepemudaan",provinceBoards:34,districtBoards:415,cityBoards:93,status:"active"},{upsert:true});
 await Organization.findOneAndUpdate({legalNumber:"210/SKT/DG-PUM/2021"},{name:"Perkumpulan Peduli Lingkungan Hijau",legalNumber:"210/SKT/DG-PUM/2021",category:"Lingkungan",provinceBoards:12,districtBoards:74,cityBoards:18,status:"active"},{upsert:true});
 console.log("Seed selesai. Admin: admin@prisma.com / Admin123! | Superadmin: root@prisma.com / Admin123! | Anggota NIK: 3271000000000001 / Anggota123!");
 await mongoose.disconnect();
}
run().catch(async e=>{console.error(e);await mongoose.disconnect();process.exit(1)});

