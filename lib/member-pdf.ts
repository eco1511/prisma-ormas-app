import { jsPDF } from "jspdf";
import { regionLabel } from "./membership";
const statusLabels:Record<string,string>={active:"Aktif",pending:"Pending",inactive:"Tidak aktif",rejected:"Ditolak"};
export function createMembersPdf(members:Record<string,any>[],filters:{q?:string;status?:string}={}) {
 const doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
 const widths=[10,46,34,38,60,54,25], labels=["No.","Anggota","NIK","Jenjang / Jabatan","Wilayah","Kontak","Status"];
 const margin=15,bottom=190;let y=42;
 const stamp=new Date().toLocaleString("id-ID",{timeZone:"Asia/Jakarta"});
 function header(){
  doc.setFont("helvetica","bold");doc.setFontSize(17);doc.setTextColor(15,23,42);doc.text("Database Anggota PRISMA",margin,15);
  doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(100,116,139);doc.text("Dicetak: "+stamp+" WIB  |  Total: "+members.length+" anggota",margin,22);
  const scope="Pencarian: "+(filters.q||"Semua")+"  |  Status: "+(statusLabels[filters.status||""]||"Semua");
  doc.text(scope,margin,28,{maxWidth:267});
  doc.setFillColor(30,58,138);doc.rect(margin,32,267,9,"F");doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");let x=margin;
  labels.forEach((label,i)=>{doc.text(label,x+2,37.7);x+=widths[i];});y=42;
 }
 header();doc.setFontSize(8);
 if(!members.length){doc.setTextColor(100,116,139);doc.text("Tidak ada anggota sesuai filter.",margin,51);}
 members.forEach((m,index)=>{
  const cells=[String(index+1),m.name+"\n"+(m.memberNo||"Nomor belum terbit"),m.nik,(m.level||"-")+"\n"+(m.position||"-"),regionLabel(m),(m.email||"-")+"\n"+(m.phone||"-"),statusLabels[m.status]||m.status];
  doc.setFont("helvetica","normal");
  const lines=cells.map((value,i)=>doc.splitTextToSize(String(value),widths[i]-4) as string[]);
  const height=Math.max(13,...lines.map(value=>value.length*3.8+5));
  if(y+height>bottom){doc.addPage();header();doc.setFont("helvetica","normal");}
  if(index%2===0){doc.setFillColor(241,245,249);doc.rect(margin,y,267,height,"F");}
  doc.setTextColor(30,41,59);let x=margin;
  lines.forEach((value,i)=>{doc.text(value,x+2,y+5,{lineHeightFactor:1.35});x+=widths[i];});
  doc.setDrawColor(226,232,240);doc.line(margin,y+height,282,y+height);y+=height;
 });
 const total=doc.getNumberOfPages();for(let page=1;page<=total;page++){doc.setPage(page);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(100,116,139);doc.text("PRISMA - Data Anggota",margin,201);doc.text("Halaman "+page+" / "+total,282,201,{align:"right"});}
 return doc;
}
