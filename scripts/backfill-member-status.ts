import {loadEnvConfig} from "@next/env";
import mongoose from "mongoose";
loadEnvConfig(process.cwd());
async function main(){
 if(!process.env.MONGODB_URI)throw Error("MONGODB_URI belum diatur.");
 await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:5000});
 const result=await mongoose.connection.collection("members").updateMany({$or:[{status:{$exists:false}},{status:null},{status:""}],verifiedAt:null},{$set:{status:"pending",updatedAt:new Date()}});
 console.log("Anggota belum diverifikasi yang dilengkapi status Pending:",result.modifiedCount);
 const counts=await mongoose.connection.collection("members").aggregate([{$group:{_id:"$status",jumlah:{$sum:1}}}]).toArray();console.log(JSON.stringify(counts));
}
main().catch(()=>{console.error("Pembaruan status gagal. Periksa koneksi database.");process.exitCode=1}).finally(()=>mongoose.disconnect());
