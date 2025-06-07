import Database from 'better-sqlite3';
import { Fish } from '../types/fish.js';
import { CommonName } from '../services/data-loader.js';

export class DataImporter {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  insertFish(fish: Fish[]): void {
    console.log(`Inserting ${fish.length} fish species...`);

    const insertFish = this.db.prepare(`
      INSERT OR REPLACE INTO fish (
        spec_code, genus, species, scientific_name, author, fb_name, fam_code, family,
        fresh, brackish, saltwater, habitat_zone,
        length_cm, common_length_cm, weight_g,
        depth_range_shallow_m, depth_range_deep_m,
        dangerous, gamefish, aquarium, aquaculture_use, bait_use, importance, price_category,
        body_shape, migration_pattern, electric_ability,
        comments, remarks
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?
      )
    `);

    const insertMany = this.db.transaction((fishList: Fish[]) => {
      for (const f of fishList) {
        insertFish.run(
          f.specCode,
          f.genus,
          f.species,
          f.scientificName,
          f.author,
          f.fbName,
          f.famCode,
          f.family,
          f.fresh ? 1 : 0,
          f.brackish ? 1 : 0,
          f.saltwater ? 1 : 0,
          f.habitatZone,
          f.length ?? null,
          f.commonLength ?? null,
          f.weight ?? null,
          f.depthRangeShallow ?? null,
          f.depthRangeDeep ?? null,
          f.dangerous,
          f.gamefish ? 1 : 0,
          f.aquarium,
          f.aquacultureUse,
          f.baitUse,
          f.importance,
          f.priceCategory,
          f.bodyShape,
          f.migrationPattern,
          f.electricAbility,
          f.comments,
          f.remarks
        );
      }
    });

    insertMany(fish);
    console.log(`Inserted ${fish.length} fish species successfully`);
  }

  insertCommonNames(commonNames: CommonName[]): void {
    console.log(`Inserting ${commonNames.length} common names...`);

    const insertName = this.db.prepare(`
      INSERT OR REPLACE INTO common_names (com_name, spec_code, language, preferred_name)
      VALUES (?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((names: CommonName[]) => {
      for (const name of names) {
        insertName.run(
          name.comName,
          name.specCode,
          name.language,
          name.preferred ? 1 : 0
        );
      }
    });

    insertMany(commonNames);
    console.log(`Inserted ${commonNames.length} common names successfully`);
  }

  buildFTSIndex(): void {
    console.log('Building FTS5 search indexes...');

    this.db.exec(`
      INSERT INTO fish_search(scientific_name, fb_name, comments, remarks, japanese_names, english_names)
      SELECT 
        f.scientific_name,
        f.fb_name,
        f.comments,
        f.remarks,
        (SELECT GROUP_CONCAT(cn1.com_name, ' ') FROM common_names cn1 WHERE cn1.spec_code = f.spec_code AND cn1.language = 'Japanese'),
        (SELECT GROUP_CONCAT(cn2.com_name, ' ') FROM common_names cn2 WHERE cn2.spec_code = f.spec_code AND cn2.language = 'English')
      FROM fish f;
    `);

    this.db.exec(`
      INSERT INTO name_search(com_name, language)
      SELECT com_name, language FROM common_names;
    `);

    console.log('FTS5 indexes built successfully');
  }
}
