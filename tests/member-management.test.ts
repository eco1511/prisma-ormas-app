import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { readFile } from "node:fs/promises";
import { validateMemberInput, memberFilter } from "../lib/member-input";
import { parseMemberWorkbook, createMembersWorkbook, memberColumns } from "../lib/member-sheet";
import { createMembersPdf } from "../lib/member-pdf";
import { updateMemberWithAccount } from "../lib/update-member-account";
const input={name:"Siti",nik:"0000000000000001",email:"SITI@example.com",phone:"081234567890",address:"Jl. Contoh No. 1",gender:"Perempuan",birthDate:"1990-01-01",membershipType:"Pusat",branchType:"Pusat",position:"Ketua"};
async function file(rows:unknown[][]) { const workbook=new ExcelJS.Workbook(),sheet=workbook.addWorksheet("Anggota");sheet.addRow(memberColumns.map(([label])=>label));for(const row of rows)sheet.addRow(row);return Buffer.from(await workbook.xlsx.writeBuffer()); }
const values:ExcelJS.CellValue[]=["Siti","0000000000000001","siti@example.com","081234567890","Perempuan",new Date("1990-01-01T00:00:00Z"),"Jl. Contoh No. 1","Pusat","Pusat","Ketua","","","PRISMA"];
test("data anggota dinormalisasi dan tanggal/NIK/email tidak valid ditolak",()=>{
 const member=validateMemberInput(input);assert.equal(member.nik,"0000000000000001");assert.equal(member.phone,"081234567890");assert.equal(member.email,"siti@example.com");assert.equal(member.birthDate?.toISOString(),"1990-01-01T00:00:00.000Z");
 assert.throws(()=>validateMemberInput({...input,nik:"123"}),/16/);assert.throws(()=>validateMemberInput({...input,birthDate:"2026-02-30"}),/Tanggal/);assert.throws(()=>validateMemberInput({...input,email:"invalid"}),/email/);assert.throws(()=>validateMemberInput({...input,gender:"invalid"}),/kelamin/);
});
test("pencarian ekspor dan tabel memakai teks literal yang sama",()=>{
 const filter=memberFilter(new URL("http://localhost/api/members?q="+encodeURIComponent("A.*[B](C)$")+"&status=pending")) as any;
 assert.equal(filter.status,"pending");const expression=new RegExp(filter.$or[0].name.$regex,"i");assert.equal(expression.test("A.*[B](C)$"),true);assert.equal(expression.test("AXXXXBC"),false);
});
test("Excel menjaga nol di depan dan mendeteksi duplikasi serta rumus",async()=>{
 const numeric=[...values];numeric[1]=1234567890123456;
 const formula=[...values];formula[2]={formula:'"siti@example.com"',result:"siti@example.com"};
 const rows=await parseMemberWorkbook(await file([values,values,numeric,formula]));assert.equal(rows.length,4);assert.equal(rows[0].data?.nik,"0000000000000001");assert.equal(rows[0].data?.phone,"081234567890");assert.match(rows[1].error!,/berulang/);assert.match(rows[2].error!,/Text/);assert.match(rows[3].error!,/Rumus/);
});
test("kabupaten harus sesuai provinsi dan cabang provinsi tidak boleh punya kota",async()=>{
 const valid=[...values];valid[7]="Cabang";valid[8]="Kabupaten/Kota";valid[10]="JAWA BARAT";valid[11]="KOTA BANDUNG";
 const wrong=[...valid];wrong[11]="Kota Surabaya";
 const provincial=[...valid];provincial[8]="Provinsi";
 const rows=await parseMemberWorkbook(await file([valid,wrong,provincial]));assert.equal(rows[0].data?.provinceId,"32");assert.equal(rows[0].data?.cityId,"32.73");assert.match(rows[1].error!,/sesuai provinsi/);assert.match(rows[2].error!,/Kosongkan/);
});
test("format unduhan dapat dibaca dan contoh tidak ikut diimpor",async()=>{
 const bytes=await readFile("public/templates/format-import-anggota.xlsx");const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(bytes as unknown as ExcelJS.Buffer);const sheet=workbook.getWorksheet("Anggota")!;
 assert.equal(sheet.getCell("B2").numFmt,"@");assert.equal(sheet.getCell("D2").numFmt,"@");assert.ok(sheet.getCell("H2").dataValidation);assert.equal(workbook.getWorksheet("Panduan")!.getCell("B27").value,"0000000000000001");assert.equal(workbook.getWorksheet("Panduan")!.getCell("B29").value,"081234567890");
 await assert.rejects(()=>parseMemberWorkbook(bytes),/belum berisi/);
 sheet.getRow(2).values=values;
 const rows=await parseMemberWorkbook(Buffer.from(await workbook.xlsx.writeBuffer()));assert.equal(rows.length,1);assert.equal(rows[0].data?.name,"Siti");
});
test("ekspor Excel dapat diimpor kembali tanpa perubahan digit",async()=>{
 const member={...validateMemberInput(input),status:"active",memberNo:"PRS-2026-000001",createdAt:new Date("2026-10-03T00:00:00Z")};const workbook=createMembersWorkbook([member]);const exported=Buffer.from(await workbook.xlsx.writeBuffer());const rows=await parseMemberWorkbook(exported);assert.equal(rows[0].data?.nik,input.nik);assert.equal(rows[0].data?.birthDate?.toISOString(),"1990-01-01T00:00:00.000Z");assert.equal(workbook.getWorksheet("Anggota")!.getCell("O2").value,"active");assert.ok(workbook.getWorksheet("Anggota")!.getCell("P2").value instanceof Date);
});
test("PDF multipage mengulang header dan memuat semua baris",()=>{
 const members=Array.from({length:60},(_,index)=>({...validateMemberInput(input),name:"Anggota "+(index+1),status:"pending",level:"Pusat"}));const pdf=createMembersPdf(members);assert.ok(pdf.getNumberOfPages()>1);const content=pdf.output();assert.match(content,/Anggota 60/);assert.equal((content.match(/Database Anggota PRISMA/g)||[]).length,pdf.getNumberOfPages());assert.match(content,/Halaman/);
});
test("edit mengembalikan identitas akun jika penyimpanan anggota gagal",async()=>{
 const events:string[]=[];await assert.rejects(()=>updateMemberWithAccount({saveAccount:async()=>{events.push("account");},saveMember:async()=>{events.push("member");throw Error("write failed");},restoreAccount:async()=>{events.push("restore");}}),/write failed/);assert.deepEqual(events,["account","member","restore"]);
 const result=await updateMemberWithAccount({saveAccount:async()=>{},saveMember:async()=>"saved",restoreAccount:async()=>{throw Error("must not run");}});assert.equal(result,"saved");
});

test("impor menolak arsip Excel yang terlalu besar setelah dibuka",async()=>{
 const bytes=await file([values]);const index=bytes.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]));assert.ok(index>=0);bytes.writeUInt32LE(26*1024*1024,index+24);await assert.rejects(()=>parseMemberWorkbook(bytes),/terlalu besar/);
});
test("impor mendukung namespace XML standar dari pembuat workbook lain",async()=>{
 const {default:JSZip}=await import("jszip");const zip=await JSZip.loadAsync(await file([values]));const xml=await zip.file("xl/workbook.xml")!.async("string");zip.file("xl/workbook.xml",xml.replace('<workbook ', '<x:workbook ').replace('</workbook>','</x:workbook>').replace('xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"','xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"').replace(/<(\/?)(sheets|sheet)(?=[ >])/g,'<$1x:$2'));
 const rows=await parseMemberWorkbook(await zip.generateAsync({type:"nodebuffer"}));assert.equal(rows[0].data?.nik,"0000000000000001");
});
