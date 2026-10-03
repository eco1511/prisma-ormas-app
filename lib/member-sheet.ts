import ExcelJS from "exceljs";
import JSZip from "jszip";
import regions from "@/data/regions.json";
import { validateMemberInput } from "./member-input";
export const memberColumns = [
  ["Nama Lengkap","name",30], ["NIK","nik",23], ["Email","email",34], ["Telepon","phone",21], ["Jenis Kelamin","gender",18], ["Tanggal Lahir","birthDate",18], ["Alamat","address",50], ["Jenis Keanggotaan","membershipType",23], ["Tingkat Wilayah","branchType",23], ["Jabatan","position",19], ["Provinsi","province",30], ["Kabupaten/Kota","city",33], ["Organisasi","organizationName",25],
] as const;
export type ImportRow = { row: number; name: string; data?: ReturnType<typeof validateMemberInput>; error?: string };
function cellText(value: ExcelJS.CellValue, key: string) {
  if(value === null || value === undefined) return "";
  if(value instanceof Date) { if(key!=="birthDate") throw Error("Nilai tanggal hanya boleh di kolom Tanggal Lahir."); return value.toISOString().slice(0,10); }
  if(typeof value === "object") throw Error("Rumus, tautan, dan nilai khusus Excel tidak didukung. Gunakan nilai teks biasa.");
  if(typeof value === "number" && ["nik","phone"].includes(key)) throw Error((key==="nik"?"NIK":"Telepon")+" harus berformat Text agar digit tetap utuh.");
  return String(value).trim();
}
function checkArchiveSize(buffer: Buffer) {
  let end=-1;
  for(let index=buffer.length-22;index>=Math.max(0,buffer.length-65557);index--)if(buffer.readUInt32LE(index)===0x06054b50 && index+22+buffer.readUInt16LE(index+20)===buffer.length){end=index;break;}
  if(end<0)throw Error("File bukan workbook .xlsx yang valid.");
  const entries=buffer.readUInt16LE(end+10);let offset=buffer.readUInt32LE(end+16),size=0;
  if(entries>1000||offset>=end)throw Error("Struktur file Excel terlalu besar.");
  for(let index=0;index<entries;index++){
    if(offset+46>end || buffer.readUInt32LE(offset)!==0x02014b50)throw Error("Struktur file Excel tidak valid.");
    size+=buffer.readUInt32LE(offset+24);if(size>25*1024*1024)throw Error("Isi file Excel terlalu besar setelah dibuka. Gunakan format yang disediakan.");
    offset+=46+buffer.readUInt16LE(offset+28)+buffer.readUInt16LE(offset+30)+buffer.readUInt16LE(offset+32);
  }
}
export async function parseMemberWorkbook(buffer: Buffer): Promise<ImportRow[]> {
  checkArchiveSize(buffer);
  const workbook = new ExcelJS.Workbook();
  try {
    const zip=await JSZip.loadAsync(buffer);let normalized=false;
    for(const [name,file] of Object.entries(zip.files))if(name.startsWith("xl/") && name.endsWith(".xml")){
      const xml=await file.async("string");
      const prefix=xml.match(/xmlns:([a-zA-Z_][\w.-]*)="http:\/\/schemas.openxmlformats.org\/spreadsheetml\/2006\/main"/)?.[1];
      if(prefix){
        const escaped=prefix.replace(/[.*+?^$\{\}()|[\]\\]/g,character=>"\\"+character);
        zip.file(name,xml.replace(new RegExp("(<\\/?)"+escaped+":","g"),"$1").replace("xmlns:"+prefix+"=","xmlns="));normalized=true;
      }
    }
    const bytes=normalized?await zip.generateAsync({type:"nodebuffer"}):buffer;
    await workbook.xlsx.load(bytes as unknown as ExcelJS.Buffer);
  } catch { throw Error("File Excel tidak dapat dibaca. Gunakan format .xlsx yang disediakan."); }
  const sheet = workbook.getWorksheet("Anggota");
  if(!sheet) throw Error("Sheet Anggota tidak ditemukan. Gunakan format yang disediakan.");
  const headers = new Map<string,number>();
  sheet.getRow(1).eachCell((cell,col)=>{ const label=cellText(cell.value,"header"); if(headers.has(label))throw Error("Header kolom ganda: "+label); headers.set(label,col); });
  for(const [label] of memberColumns) if(!headers.has(label)) throw Error("Kolom "+label+" tidak ditemukan.");
  const rows: ImportRow[] = [], seenNiks = new Set<string>(), seenEmails = new Set<string>();
  sheet.eachRow((row,index)=>{
    if(index===1) return;
    if(!memberColumns.some(([label])=>row.getCell(headers.get(label)!).value !== null && row.getCell(headers.get(label)!).value !== undefined && row.getCell(headers.get(label)!).value !== ""))return;
    if(rows.length>=1000) throw Error("Maksimal 1.000 anggota per impor. Pisahkan file menjadi beberapa bagian.");
    let name = "";
    try {
      const input: Record<string,string> = {};
      for(const [label,key] of memberColumns) input[key]=cellText(row.getCell(headers.get(label)!).value,key);
      name=input.name;
      const normalized=(value:string)=>value.trim().toLocaleLowerCase("id-ID");
      const province=regions.provinces.find(p=>normalized(p.name)===normalized(input.province));
      const city=regions.regencies.find(c=>c.provinceId===province?.id && normalized(c.name)===normalized(input.city));
      if(input.membershipType==="Cabang" && !province) throw Error("Nama provinsi tidak ditemukan. Lihat sheet Wilayah.");
      if(input.membershipType==="Cabang" && input.branchType==="Kabupaten/Kota" && !city) throw Error("Kabupaten/kota tidak sesuai provinsi. Lihat sheet Wilayah.");
      if(input.membershipType==="Cabang" && input.branchType==="Provinsi" && input.city) throw Error("Kosongkan Kabupaten/Kota untuk cabang provinsi.");
      if(input.membershipType==="Pusat" && (input.province || input.city)) throw Error("Kosongkan Provinsi dan Kabupaten/Kota untuk anggota pusat.");
      const data=validateMemberInput({...input,provinceId:province?.id || "",cityId:city?.id || ""});
      if(seenNiks.has(data.nik) || seenEmails.has(data.email))throw Error("NIK atau email berulang dalam file ini.");
      seenNiks.add(data.nik);seenEmails.add(data.email);
      rows.push({row:index,name,data});
    } catch(error) { rows.push({row:index,name,error:(error as Error).message}); }
  });
  if(!rows.length) throw Error("Sheet Anggota belum berisi data. Isi mulai baris 2.");
  return rows;
}
export function createMembersWorkbook(members: Record<string,any>[]) {
  const workbook=new ExcelJS.Workbook();workbook.creator="PRISMA";
  const sheet=workbook.addWorksheet("Anggota",{views:[{state:"frozen",xSplit:2,ySplit:1,showGridLines:false}]});
  const columns=[...memberColumns,["Nomor Anggota","memberNo",25],["Status","status",18],["Tanggal Daftar","createdAt",20],["Tanggal Verifikasi","verifiedAt",20],["Catatan Verifikasi","verificationNotes",45]] as const;
  sheet.columns=columns.map(([header,key,width])=>({header,key,width}));
  for(const member of members) { const row:Record<string,any>={};for(const [,key] of columns) row[key]=["birthDate","createdAt","verifiedAt"].includes(key)?member[key]?new Date(member[key]):null:String(member[key]??"");sheet.addRow(row); }
  sheet.autoFilter={from:"A1",to:"R1"};
  sheet.getRow(1).height=30;
  sheet.getRow(1).eachCell(cell=>{cell.font={name:"Arial",bold:true,color:{argb:"FFFFFFFF"},size:10};cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF1E3A8A"}};cell.alignment={vertical:"middle",horizontal:"center",wrapText:true};});
  sheet.eachRow((row,index)=>{if(index>1){const lines=Math.max(...columns.map(([,key,width])=>String(row.getCell(key).value??"").split("\n").reduce((sum,line)=>sum+Math.max(1,Math.ceil(line.length/(width-2))),0)));row.height=Math.min(409,Math.max(30,lines*13+8));row.eachCell(cell=>{cell.font={name:"Arial",size:10};cell.alignment={vertical:"middle",wrapText:true};if(index%2===0)cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFF1F5F9"}};});}});
  for(const key of ["nik","phone"]) sheet.getColumn(key).numFmt="@";
  for(const key of ["birthDate","createdAt","verifiedAt"]) sheet.getColumn(key).numFmt="yyyy-mm-dd";
  return workbook;
}
