import {test} from "node:test";
import assert from "node:assert/strict";
import {validateMembership,regionLabel} from "../lib/membership";
import regions from "../data/regions.json";
import {removeUploadedFile,saveUploadedFile} from "../lib/uploads";
import {MAX_REGISTRATION_FILE_SIZE_BYTES} from "../lib/upload-constraints";
test("master lengkap dan relasi kabupaten konsisten",()=>{
 assert.equal(regions.provinces.length,38);assert.equal(regions.regencies.length,514);
 assert.equal(new Set(regions.regencies.map(c=>c.id)).size,514);
 for(const c of regions.regencies)assert.ok(regions.provinces.some(p=>p.id===c.provinceId));
});
test("pusat tidak menyimpan wilayah cabang",()=>{const m=validateMembership({membershipType:"Pusat",position:"Ketua",provinceId:"11",cityId:"11.01"});assert.equal(m.city,"");assert.equal(regionLabel(m),"Nasional")});
test("cabang provinsi menolak kabupaten",()=>{assert.throws(()=>validateMembership({membershipType:"Cabang",branchType:"Provinsi",provinceId:"11",cityId:"11.01",position:"Anggota"}))});
test("kabupaten harus sesuai provinsi",()=>{const c=regions.regencies[0];assert.throws(()=>validateMembership({membershipType:"Cabang",branchType:"Kabupaten/Kota",provinceId:"96",cityId:c.id,position:"Ketua"}));const m=validateMembership({membershipType:"Cabang",branchType:"Kabupaten/Kota",provinceId:c.provinceId,cityId:c.id,position:"Bendahara"});assert.equal(m.city,c.name)});
test("jabatan dan jenis cabang divalidasi",()=>{assert.throws(()=>validateMembership({membershipType:"Pusat",position:"Tidak valid"}));assert.throws(()=>validateMembership({membershipType:"Cabang",branchType:"Kecamatan",position:"Anggota"}))});
test("unggahan palsu, PDF foto, dan berkas besar ditolak",async()=>{
 await assert.rejects(saveUploadedFile(new File(["<script>"],"fake.jpg",{type:"image/jpeg"}),"photo"));
 await assert.rejects(saveUploadedFile(new File(["%PDF-1.7"],"photo.pdf"),"photo"));
 await assert.rejects(saveUploadedFile(new File([new Uint8Array(5*1024*1024+1)],"big.png"),"ktp"));
});
test("pendaftaran menerima berkas sampai 500 KB dan menolak berkas yang lebih besar",async()=>{
 const png=new Uint8Array(MAX_REGISTRATION_FILE_SIZE_BYTES);png.set([137,80,78,71,13,10,26,10]);
 const options={maxSizeBytes:MAX_REGISTRATION_FILE_SIZE_BYTES,maxSizeMessage:"Ukuran berkas maksimal 500 KB."};
 const saved=await saveUploadedFile(new File([png],"photo.png"),"photo",options);
 try{
  assert.ok(saved);
  await assert.rejects(saveUploadedFile(new File([new Uint8Array(MAX_REGISTRATION_FILE_SIZE_BYTES+1)],"big.png"),"photo",options),/500 KB/);
 }finally{await removeUploadedFile(saved)}
});
test("logo menerima JPG/PNG sampai 500 KB dan menolak PDF",async()=>{
 const png=new Uint8Array(8);png.set([137,80,78,71,13,10,26,10]);
 const saved=await saveUploadedFile(new File([png],"logo.png"),"logo",{maxSizeBytes:500*1024,maxSizeMessage:"Ukuran logo maksimal 500 KB."});
 try{
  assert.ok(saved.startsWith("/api/files/logo-"));
  await assert.rejects(saveUploadedFile(new File(["%PDF-1.7"],"logo.pdf"),"logo",{maxSizeBytes:500*1024,maxSizeMessage:"Ukuran logo maksimal 500 KB."}),/JPG atau PNG/);
 }finally{await removeUploadedFile(saved)}
});
