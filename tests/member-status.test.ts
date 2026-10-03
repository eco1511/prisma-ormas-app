import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Member} from '../models/Member';
test('anggota baru otomatis pending dan status wajib valid',()=>{
 const m=new Member({name:'Uji Status',nik:'0000000000000001',email:'status@example.test',phone:'0800000000',address:'Alamat uji'});
 assert.equal(m.status,'pending');assert.equal(m.validateSync(),undefined);
 for(const status of ['active','pending','inactive']){m.status=status;assert.equal(m.validateSync(),undefined)}
 m.status=null;assert.ok(m.validateSync()?.errors.status);
 m.status='unknown';assert.ok(m.validateSync()?.errors.status);
});
