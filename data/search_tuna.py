#!/usr/bin/env python3
import pandas as pd

# データを読み込む
comnames_df = pd.read_parquet("comnames.parquet")
species_df = pd.read_parquet("species.parquet")

# 日本語の魚名データを抽出
japanese_names = comnames_df[comnames_df['Language'] == 'Japanese']

# マグロ関連の様々な表記を検索
tuna_keywords = ['まぐろ', 'マグロ', '鮪', 'ツナ', 'Maguro', 'クロマグロ', 'ホンマグロ']
print("マグロ関連の検索結果:")
for keyword in tuna_keywords:
    results = japanese_names[japanese_names['ComName'].str.contains(keyword, na=False, case=False)]
    if len(results) > 0:
        print(f"\n'{keyword}'の検索結果:")
        print(results[['ComName', 'SpecCode']].head())

# Thunnusで検索（マグロ属の学名）
print("\n\nマグロ属（Thunnus）の種を検索:")
thunnus_species = species_df[species_df['Genus'] == 'Thunnus']
print(f"Thunnus属の種数: {len(thunnus_species)}")
print(thunnus_species[['SpecCode', 'Species', 'FBname']].head(10))

# これらのSpecCodeに対応する日本語名を検索
if len(thunnus_species) > 0:
    spec_codes = thunnus_species['SpecCode'].tolist()
    jp_names = japanese_names[japanese_names['SpecCode'].isin(spec_codes)]
    print(f"\n日本語名が登録されているマグロ: {len(jp_names)}件")
    print(jp_names[['ComName', 'SpecCode', 'PreferredName']].head(20))