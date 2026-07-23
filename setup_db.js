import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kita coba IPv4 Pooler (Tokyo) terlebih dahulu untuk menghindari limitasi IPv6 lokal
const connectionStringPooler = "postgresql://postgres.ebomimtecajwjfatdqht:a%262V92Y9qG-SJ2h@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";
const connectionStringDirect = "postgresql://postgres:a%262V92Y9qG-SJ2h@db.ebomimtecajwjfatdqht.supabase.co:5432/postgres";

async function runSetup() {
  const { Client } = pg;
  let client;
  
  console.log("Menghubungkan ke database Supabase baru (Tokyo)...");
  
  // Coba Pooler dahulu
  try {
    console.log("Mencoba koneksi via IPv4 Pooler (Tokyo)...");
    client = new Client({
      connectionString: connectionStringPooler,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    console.log("Koneksi via Pooler berhasil!");
  } catch (poolerError) {
    console.warn("⚠️ Koneksi via Pooler gagal:", poolerError.message);
    console.log("Mencoba koneksi langsung ke direct host...");
    try {
      client = new Client({
        connectionString: connectionStringDirect,
        ssl: { rejectUnauthorized: false }
      });
      await client.connect();
      console.log("Koneksi langsung berhasil!");
    } catch (directError) {
      console.error("❌ GAGAL: Kedua metode koneksi database tidak dapat terhubung.");
      console.error("Error Detail:", directError);
      return;
    }
  }

  try {
    console.log("Membaca file SQL...");
    const sqlPath = path.join(__dirname, 'supabase_setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log("Menjalankan skrip migrasi database...");
    await client.query(sql);
    
    console.log("=================================================");
    console.log("🎉 BERHASIL! Database Buku Penghubung Sekolah");
    console.log("   telah berhasil diinisialisasi dan di-seed.");
    console.log("=================================================");
  } catch (error) {
    console.error("❌ GAGAL menjalankan setup database:", error);
  } finally {
    await client.end();
  }
}

runSetup();
