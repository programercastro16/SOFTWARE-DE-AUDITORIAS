#!/usr/bin/env node

const DataSeeder = require('./DataSeeder');

async function main() {
  const seeder = new DataSeeder();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'seed':
        await seeder.seedAll();
        break;
      
      case 'clear':
        await seeder.clearAll();
        break;
      
      case 'reset':
        await seeder.reset();
        break;
      
      case 'stats':
        const stats = await seeder.getStats();
        console.log('📊 Estadísticas actuales:');
        console.table(stats);
        break;
      
      default:
        console.log(`
🌱 DataSeeder - Uso:

  npm run seed              # Crear datos iniciales
  npm run seed:clear        # Limpiar todos los datos
  npm run seed:reset        # Limpiar y recrear datos
  npm run seed:stats        # Mostrar estadísticas

Comandos disponibles:
  seed                      # Poblar base de datos con datos iniciales
  clear                     # Eliminar todos los datos existentes
  reset                     # Limpiar y volver a poblar
  stats                     # Mostrar estadísticas actuales

Ejemplos:
  node seed.js seed
  node seed.js clear
  node seed.js reset
  node seed.js stats
        `);
        process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error ejecutando DataSeeder:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
