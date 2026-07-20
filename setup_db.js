import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Menggunakan pooler IPv4 Sydney (ap-southeast-2) karena jaringan lokal tidak mendukung IPv6 direct host
const connectionString = "postgresql://postgres.wqywzuwifizfhtxusmth:uzmilatul55@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres";

async function runSetup() {
  console.log("Menghubungkan ke database Supabase via IPv4 Pooler (Sydney)...");
  const { Client } = pg;
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("Koneksi berhasil! Membaca file SQL...");
    
    const sqlPath = path.join(__dirname, 'supabase_setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log("Menjalankan skrip migrasi database...");
    await client.query(sql);
    
    console.log("=================================================");
    console.log("🎉 BERHASIL! Database Buku Penghubung Digital");
    console.log("   telah berhasil diinisialisasi dan di-seed.");
    console.log("=================================================");
  } catch (error) {
    console.error("❌ GAGAL menjalankan setup database:", error);
  } finally {
    await client.end();
  }
}

runSetup();
