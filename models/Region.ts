import mongoose, {Schema} from "mongoose";
const RegionSchema = new Schema({code:{type:String,unique:true,required:true},name:{type:String,required:true},type:{type:String,enum:["province","regency"],required:true},provinceCode:{type:String,index:true}});
export const Region = mongoose.models.Region || mongoose.model("Region",RegionSchema);
