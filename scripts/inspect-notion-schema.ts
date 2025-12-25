import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

async function inspectNotionDatabase() {
  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  const databaseId = process.env.NOTION_DATABASE_ID!;

  try {
    console.log('🔍 Inspecting Notion Database Schema...\n');
    console.log(`Database ID: ${databaseId}\n`);

    const database = await notion.databases.retrieve({
      database_id: databaseId
    });

    console.log('📊 Database Properties:\n');
    console.log('='.repeat(80));

    const properties = (database as any).properties;

    for (const [name, prop] of Object.entries(properties)) {
      const propData = prop as any;
      console.log(`\n✓ ${name}`);
      console.log(`  Type: ${propData.type}`);

      // Show select options if applicable
      if (propData.type === 'select' && propData.select?.options) {
        console.log(`  Options: ${propData.select.options.map((o: any) => o.name).join(', ')}`);
      }

      // Show multi-select options if applicable
      if (propData.type === 'multi_select' && propData.multi_select?.options) {
        console.log(`  Options: ${propData.multi_select.options.map((o: any) => o.name).join(', ')}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📋 Summary:');
    console.log(`Total properties: ${Object.keys(properties).length}`);
    console.log(`\nProperty Names (for agent configuration):`);
    Object.keys(properties).forEach(name => {
      console.log(`  - "${name}"`);
    });

  } catch (error: any) {
    console.error('❌ Error inspecting database:', error.message);
    if (error.code === 'object_not_found') {
      console.error('\nThe database was not found. Please check:');
      console.error('1. NOTION_DATABASE_ID is correct');
      console.error('2. Notion integration has access to this database');
    }
  }
}

inspectNotionDatabase();
