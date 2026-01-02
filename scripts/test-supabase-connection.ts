// ============================================================================
// SCRIPT DE VERIFICACIÓN DE CONEXIÓN A SUPABASE
// ============================================================================
// Este script verifica que la conexión a Supabase esté funcionando correctamente
// Ejecutar con: npx tsx scripts/test-supabase-connection.ts
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// import.meta.env is a Vite/browser-specific API and not needed in this Node script; use process.env via dotenv instead
//const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://osuxekrrzchkguzhbmhr.supabase.co';
//const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdXhla3JyemNoa2d1emhibWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODY3NzksImV4cCI6MjA4MDg2Mjc3OX0.jLDrg-SeWx_Zr7U-8wAsumGTHhM6XxdS7GMAE40SdiI';
//const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
//const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
//import.meta.env.VITE_SUPABASE_URL
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log(supabaseUrl + ' ' + supabaseAnonKey);
console.log('🔍 Verificando configuración de Supabase...\n');
// Verificar variables de entorno
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Variables de entorno no configuradas');
  console.log('\nAsegúrate de que el archivo .env.local contiene:');
  console.log('  VITE_SUPABASE_URL=tu_url_de_supabase');
  console.log('  VITE_SUPABASE_ANON_KEY=tu_llave_anon\n');
  process.exit(1);
}

if (supabaseUrl === 'your_supabase_project_url' || supabaseAnonKey === 'your_supabase_anon_key') {
  console.error('❌ ERROR: Las variables de entorno aún tienen valores de ejemplo');
  console.log('\nReemplaza los valores de ejemplo en .env.local con tus credenciales reales de Supabase\n');
  process.exit(1);
}

console.log('✅ Variables de entorno configuradas');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...\n`);

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Verificar conexión
async function testConnection() {
  try {
    console.log('🔌 Probando conexión a Supabase...');
    
    // Test 1: Verificar que el cliente se creó correctamente
    if (!supabase) {
      throw new Error('No se pudo crear el cliente de Supabase');
    }
    console.log('✅ Cliente de Supabase creado correctamente');

    // Test 2: Intentar obtener tablas (esto verificará la conexión)
    const { data, error } = await supabase
      .from('threats')
      .select('count')
      .limit(1);

    if (error) {
      // Si el error es que la tabla no existe, la conexión funciona pero la DB no está configurada
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('⚠️  Conexión exitosa, pero las tablas no están creadas');
        console.log('   Ejecuta las migraciones de la base de datos:');
        console.log('   1. Copia el contenido de supabase/migrations/001_initial_schema.sql');
        console.log('   2. Pégalo en el SQL Editor de tu proyecto en Supabase');
        console.log('   3. Haz lo mismo con 002_storage_buckets.sql\n');
        return;
      }
      throw error;
    }

    console.log('✅ Conexión a la base de datos exitosa');
    console.log(`   Se encontraron datos en la tabla 'threats'\n`);

    // Test 3: Verificar autenticación
    console.log('🔐 Verificando autenticación...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('✅ Usuario autenticado:', session.user?.email);
    } else {
      console.log('ℹ️  No hay sesión activa (esto es normal si no has iniciado sesión)');
    }

    console.log('\n🎉 ¡Todas las verificaciones pasaron exitosamente!');
    console.log('   Tu aplicación está lista para usar Supabase\n');

  } catch (error) {
    console.error('\n❌ ERROR al conectar con Supabase:');
    console.error(error);
    console.log('\nVerifica:');
    console.log('  1. Que la URL de Supabase es correcta');
    console.log('  2. Que la API Key es correcta');
    console.log('  3. Que tu proyecto de Supabase está activo');
    console.log('  4. Que las migraciones de base de datos se ejecutaron\n');
    process.exit(1);
  }
}

testConnection();
