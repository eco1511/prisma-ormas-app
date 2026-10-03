import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registrationConflict} from '../lib/registration-conflict';
const nik='3271000000000001',email='member@example.test';
test('identitas baru tidak diblokir',()=>assert.deepEqual(registrationConflict([],nik,email),{retry:false,message:null}));
test('pendaftaran ditolak dengan identitas sama dapat dikirim ulang',()=>assert.deepEqual(registrationConflict([{nik,email,status:'rejected'}],nik,email),{retry:true,message:null}));
test('identitas berbeda tetap diblokir',()=>{assert.ok(registrationConflict([{nik,email,status:'rejected'}],nik,'other@example.test').message);assert.ok(registrationConflict([{nik,email,status:'rejected'}],'3271000000000002',email).message)});
test('pending dan aktif tetap diblokir',()=>{assert.match(registrationConflict([{nik,email,status:'pending'}],nik,email).message!,/menunggu verifikasi/);assert.match(registrationConflict([{nik,email,status:'active'}],nik,email).message!,/anggota/)});
test('duplikat lain tidak diabaikan saat kirim ulang',()=>assert.ok(registrationConflict([{nik,email,status:'rejected'},{nik:'3271000000000002',email,status:'active'}],nik,email).message));
