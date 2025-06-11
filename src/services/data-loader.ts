import wasmInit, { readParquet } from 'parquet-wasm/esm';
import { tableFromIPC } from 'apache-arrow';
import {
  Fish,
  HabitatZone,
  DangerLevel,
  CommercialImportance,
  PriceCategory,
  MigrationPattern,
  BodyShape,
  AquariumSuitability,
  AquacultureUse,
  BaitUse,
  ElectricAbility,
} from '../types/fish.js';
import { cm, g, m } from '../types/units.js';

interface FishBaseSpeciesRow {
  SpecCode: number;
  Genus: string;
  Species: string;
  Author?: string;
  FBname?: string;
  FamCode?: number;
  Family?: string;
  Fresh: number;
  Brack: number;
  Saltwater: number;
  DemersPelag?: string;
  Length?: number;
  CommonLength?: number;
  Weight?: number;
  DepthRangeShallow?: number;
  DepthRangeDeep?: number;
  Dangerous?: string;
  GameFish: number;
  Aquarium?: string;
  AquacultureFisheries?: string;
  Bait?: string;
  Importance?: string;
  PriceCateg?: string;
  BodyShapeI?: string;
  Migration?: string;
  Electric?: string;
  Comments?: string;
  Remarks?: string;
}

interface FishBaseCommonNameRow {
  ComName: string;
  SpecCode: number;
  Language: string;
  NameType?: string;
}

export interface CommonName {
  comName: string;
  specCode: number;
  language: string;
  preferred: boolean;
}

export class FishBaseDataLoader {
  private static readonly FISHBASE_S3_BASE =
    'https://fishbase.ropensci.org/data/';
  private static wasmInitialized = false;

  async downloadParquetFile(filename: string): Promise<Buffer> {
    const url = `${FishBaseDataLoader.FISHBASE_S3_BASE}${filename}`;
    console.log(`Downloading ${filename} from FishBase...`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to download ${filename}: ${response.status} ${response.statusText}`
        );
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      console.log(
        `Downloaded ${filename}: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`
      );
      return buffer;
    } catch (error) {
      console.warn(`Download failed for ${filename}, trying local file...`);

      // Fallback to local file
      const fs = await import('fs/promises');
      const path = await import('path');

      const localPath = path.join(process.cwd(), 'data', filename);
      console.log(`Loading ${filename} from local file: ${localPath}`);

      try {
        const buffer = await fs.readFile(localPath);
        console.log(
          `Loaded local ${filename}: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`
        );
        return buffer;
      } catch (localError) {
        throw new Error(
          `Failed to download ${filename} from remote (${error}) and local file not found (${localError})`
        );
      }
    }
  }

  private normalizeHabitatZone(demersPelag?: string): HabitatZone | undefined {
    if (!demersPelag) return undefined;

    const normalized = demersPelag.toLowerCase().trim();
    switch (normalized) {
      case 'demersal':
        return HabitatZone.DEMERSAL;
      case 'benthopelagic':
        return HabitatZone.BENTHOPELAGIC;
      case 'reef-associated':
        return HabitatZone.REEF_ASSOCIATED;
      case 'bathydemersal':
        return HabitatZone.BATHYDEMERSAL;
      case 'bathypelagic':
        return HabitatZone.BATHYPELAGIC;
      case 'pelagic':
        return HabitatZone.PELAGIC;
      case 'pelagic-neritic':
        return HabitatZone.PELAGIC_NERITIC;
      case 'pelagic-oceanic':
        return HabitatZone.PELAGIC_OCEANIC;
      default:
        return HabitatZone.UNKNOWN;
    }
  }

  private normalizeDangerLevel(dangerous?: string): DangerLevel | undefined {
    if (!dangerous) return undefined;

    const normalized = dangerous.toLowerCase().trim();
    switch (normalized) {
      case 'harmless':
        return DangerLevel.HARMLESS;
      case 'venomous':
        return DangerLevel.VENOMOUS;
      case 'traumatogenic':
        return DangerLevel.TRAUMATOGENIC;
      case 'reports of ciguatera poisoning':
        return DangerLevel.CIGUATERA;
      case 'potential pest':
        return DangerLevel.POTENTIAL_PEST;
      case 'poisonous to eat':
        return DangerLevel.POISONOUS_TO_EAT;
      default:
        return DangerLevel.OTHER;
    }
  }

  private normalizeCommercialImportance(
    importance?: string
  ): CommercialImportance | undefined {
    if (!importance) return undefined;

    const normalized = importance.toLowerCase().trim();
    switch (normalized) {
      case 'highly commercial':
        return CommercialImportance.HIGHLY_COMMERCIAL;
      case 'commercial':
        return CommercialImportance.COMMERCIAL;
      case 'minor commercial':
        return CommercialImportance.MINOR_COMMERCIAL;
      case 'subsistence fisheries':
        return CommercialImportance.SUBSISTENCE;
      case 'of potential interest':
        return CommercialImportance.POTENTIAL_INTEREST;
      case 'of no interest':
        return CommercialImportance.NO_INTEREST;
      case 'bycatch':
        return CommercialImportance.BYCATCH;
      default:
        return undefined;
    }
  }

  private normalizePriceCategory(
    priceCateg?: string
  ): PriceCategory | undefined {
    if (!priceCateg) return undefined;

    const normalized = priceCateg.toLowerCase().trim();
    switch (normalized) {
      case 'very high':
        return PriceCategory.VERY_HIGH;
      case 'high':
        return PriceCategory.HIGH;
      case 'medium':
        return PriceCategory.MEDIUM;
      case 'low':
        return PriceCategory.LOW;
      default:
        return PriceCategory.UNKNOWN;
    }
  }

  private normalizeBodyShape(bodyShape?: string): BodyShape | undefined {
    if (!bodyShape) return undefined;

    const normalized = bodyShape.toLowerCase().trim();
    switch (normalized) {
      case 'elongated':
        return BodyShape.ELONGATED;
      case 'fusiform / normal':
        return BodyShape.FUSIFORM_NORMAL;
      case 'short and / or deep':
        return BodyShape.SHORT_DEEP;
      case 'eel-like':
        return BodyShape.EEL_LIKE;
      default:
        return BodyShape.OTHER;
    }
  }

  private normalizeMigrationPattern(
    migration?: string
  ): MigrationPattern | undefined {
    if (!migration) return undefined;

    const normalized = migration.toLowerCase().trim();
    switch (normalized) {
      case 'non-migratory':
        return MigrationPattern.NON_MIGRATORY;
      case 'oceanodromous':
        return MigrationPattern.OCEANODROMOUS;
      case 'potamodromous':
        return MigrationPattern.POTAMODROMOUS;
      case 'amphidromous':
        return MigrationPattern.AMPHIDROMOUS;
      case 'anadromous':
        return MigrationPattern.ANADROMOUS;
      case 'catadromous':
        return MigrationPattern.CATADROMOUS;
      case 'oceano-estuarine':
        return MigrationPattern.OCEANO_ESTUARINE;
      case 'diadromous':
        return MigrationPattern.DIADROMOUS;
      default:
        return undefined;
    }
  }

  private normalizeAquariumSuitability(
    aquarium?: string
  ): AquariumSuitability | undefined {
    if (!aquarium) return undefined;

    const normalized = aquarium.toLowerCase().trim();
    switch (normalized) {
      case 'never/rarely':
        return AquariumSuitability.NEVER_RARELY;
      case 'commercial':
        return AquariumSuitability.COMMERCIAL;
      case 'public aquariums':
        return AquariumSuitability.PUBLIC_AQUARIUMS;
      case 'highly commercial':
        return AquariumSuitability.HIGHLY_COMMERCIAL;
      case 'potential':
        return AquariumSuitability.POTENTIAL;
      case 'show aquarium':
        return AquariumSuitability.SHOW_AQUARIUM;
      default:
        return undefined;
    }
  }

  private normalizeAquacultureUse(
    aquaculture?: string
  ): AquacultureUse | undefined {
    if (!aquaculture) return undefined;

    const normalized = aquaculture.toLowerCase().trim();
    switch (normalized) {
      case 'never/rarely':
        return AquacultureUse.NEVER_RARELY;
      case 'commercial':
        return AquacultureUse.COMMERCIAL;
      case 'experimental':
        return AquacultureUse.EXPERIMENTAL;
      case 'likely future use':
        return AquacultureUse.LIKELY_FUTURE;
      default:
        return undefined;
    }
  }

  private normalizeBaitUse(bait?: string): BaitUse | undefined {
    if (!bait) return undefined;

    const normalized = bait.toLowerCase().trim();
    switch (normalized) {
      case 'never/rarely':
        return BaitUse.NEVER_RARELY;
      case 'usually':
        return BaitUse.USUALLY;
      case 'occasionally':
        return BaitUse.OCCASIONALLY;
      default:
        return undefined;
    }
  }

  private normalizeElectricAbility(
    electric?: string
  ): ElectricAbility | undefined {
    if (!electric) return undefined;

    const normalized = electric.toLowerCase().trim();
    switch (normalized) {
      case 'no special ability':
        return ElectricAbility.NO_SPECIAL;
      case 'electrosensing only':
        return ElectricAbility.ELECTROSENSING_ONLY;
      case 'weakly discharging':
        return ElectricAbility.WEAKLY_DISCHARGING;
      case 'strongly discharging':
        return ElectricAbility.STRONGLY_DISCHARGING;
      default:
        return undefined;
    }
  }

  transformSpeciesRow(row: FishBaseSpeciesRow): Fish {
    return {
      specCode: row.SpecCode,
      genus: row.Genus,
      species: row.Species,
      scientificName: `${row.Genus} ${row.Species}`,
      author: row.Author,
      fbName: row.FBname,
      famCode: row.FamCode,
      family: row.Family,
      fresh: Boolean(row.Fresh),
      brackish: Boolean(row.Brack),
      saltwater: Boolean(row.Saltwater),
      habitatZone: this.normalizeHabitatZone(row.DemersPelag),
      length: row.Length ? cm(row.Length) : undefined,
      commonLength: row.CommonLength ? cm(row.CommonLength) : undefined,
      weight: row.Weight ? g(row.Weight) : undefined,
      depthRangeShallow: row.DepthRangeShallow
        ? m(row.DepthRangeShallow)
        : undefined,
      depthRangeDeep: row.DepthRangeDeep ? m(row.DepthRangeDeep) : undefined,
      dangerous: this.normalizeDangerLevel(row.Dangerous),
      gamefish: Boolean(row.GameFish),
      aquarium: this.normalizeAquariumSuitability(row.Aquarium),
      aquacultureUse: this.normalizeAquacultureUse(row.AquacultureFisheries),
      baitUse: this.normalizeBaitUse(row.Bait),
      importance: this.normalizeCommercialImportance(row.Importance),
      priceCategory: this.normalizePriceCategory(row.PriceCateg),
      bodyShape: this.normalizeBodyShape(row.BodyShapeI),
      migrationPattern: this.normalizeMigrationPattern(row.Migration),
      electricAbility: this.normalizeElectricAbility(row.Electric),
      comments: row.Comments,
      remarks: row.Remarks,
    };
  }

  async loadSpeciesData(): Promise<Fish[]> {
    console.log('Loading all species data from FishBase...');

    // Initialize WASM if not already done
    if (!FishBaseDataLoader.wasmInitialized) {
      const path = await import('path');
      const fs = await import('fs');
      const wasmPath = path.join(
        process.cwd(),
        'node_modules',
        'parquet-wasm',
        'esm',
        'parquet_wasm_bg.wasm'
      );
      const wasmBuffer = fs.readFileSync(wasmPath);
      await wasmInit(wasmBuffer);
      FishBaseDataLoader.wasmInitialized = true;
    }

    const path = await import('path');
    const fs = await import('fs');
    const filePath = path.join(process.cwd(), 'data', 'species.parquet');

    const buffer = fs.readFileSync(filePath);
    const wasmTable = readParquet(new Uint8Array(buffer));

    // Convert to Arrow table using IPC stream
    const arrowTable = tableFromIPC(wasmTable.intoIPCStream());

    // Convert Arrow table to JavaScript objects
    // Using traditional for-loop for performance with large dataset (35,731 rows × 102 columns)
    const rawRows: FishBaseSpeciesRow[] = [];
    for (let i = 0; i < arrowTable.numRows; i++) {
      const row: any = {};
      for (let j = 0; j < arrowTable.numCols; j++) {
        const column = arrowTable.getChildAt(j);
        const fieldName = arrowTable.schema.fields[j].name;
        row[fieldName] = column?.get(i);
      }
      rawRows.push(row as FishBaseSpeciesRow);
    }

    console.log(`Loaded ${rawRows.length} species records`);
    return rawRows.map(row => this.transformSpeciesRow(row));
  }

  async loadCommonNames(): Promise<CommonName[]> {
    console.log('Loading all common names from FishBase...');
    const path = await import('path');
    const fs = await import('fs');
    const filePath = path.join(process.cwd(), 'data', 'comnames.parquet');

    // Initialize WASM if not already done
    if (!FishBaseDataLoader.wasmInitialized) {
      const path = await import('path');
      const fs = await import('fs');
      const wasmPath = path.join(
        process.cwd(),
        'node_modules',
        'parquet-wasm',
        'esm',
        'parquet_wasm_bg.wasm'
      );
      const wasmBuffer = fs.readFileSync(wasmPath);
      await wasmInit(wasmBuffer);
      FishBaseDataLoader.wasmInitialized = true;
    }

    const buffer = fs.readFileSync(filePath);
    const wasmTable = readParquet(new Uint8Array(buffer));

    // Convert to Arrow table using IPC stream
    const arrowTable = tableFromIPC(wasmTable.intoIPCStream());

    // Convert Arrow table to JavaScript objects
    // Using traditional for-loop for performance with large dataset (330,105 rows × 35 columns)
    const rawRows: FishBaseCommonNameRow[] = [];
    for (let i = 0; i < arrowTable.numRows; i++) {
      const row: any = {};
      for (let j = 0; j < arrowTable.numCols; j++) {
        const column = arrowTable.getChildAt(j);
        const fieldName = arrowTable.schema.fields[j].name;
        row[fieldName] = column?.get(i);
      }
      rawRows.push(row as FishBaseCommonNameRow);
    }

    console.log(`Loaded ${rawRows.length} common name records`);

    const filteredRows = rawRows.filter(
      row => row.Language === 'English' || row.Language === 'Japanese'
    );
    console.log(
      `Filtered to ${filteredRows.length} English/Japanese records (${rawRows.length - filteredRows.length} other languages excluded)`
    );

    return filteredRows.map(row => ({
      comName: row.ComName,
      specCode: row.SpecCode,
      language: row.Language,
      preferred: row.NameType === 'preferred',
    }));
  }

  async loadAllFishData(): Promise<{
    species: Fish[];
    commonNames: CommonName[];
    japaneseNames: CommonName[];
    englishNames: CommonName[];
  }> {
    console.log('Starting full fish database loading...');

    const [species, commonNames] = await Promise.all([
      this.loadSpeciesData(),
      this.loadCommonNames(),
    ]);

    const japaneseNames = commonNames.filter(
      name => name.language === 'Japanese'
    );
    const englishNames = commonNames.filter(
      name => name.language === 'English'
    );

    console.log(`Data summary:`);
    console.log(`- Total species: ${species.length}`);
    console.log(`- Total common names: ${commonNames.length}`);
    console.log(`- Japanese names: ${japaneseNames.length}`);
    console.log(`- English names: ${englishNames.length}`);
    console.log(
      `- Species with Japanese names: ${new Set(japaneseNames.map(n => n.specCode)).size}`
    );

    return {
      species,
      commonNames,
      japaneseNames,
      englishNames,
    };
  }
}
