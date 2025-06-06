#!/usr/bin/env python3
import pandas as pd

# データを読み込む
comnames_df = pd.read_parquet("comnames.parquet")
species_df = pd.read_parquet("species.parquet")

# 日本語の魚名データを抽出
japanese_names = comnames_df[comnames_df['Language'] == 'Japanese']

# 「マグロ」を含む魚名を検索
maguro_names = japanese_names[japanese_names['ComName'].str.contains('マグロ', na=False)]
print("「マグロ」を含む魚名:")
print(maguro_names[['ComName', 'SpecCode', 'PreferredName']].head(20))

# SpecCodeで結合して詳細情報を取得
if len(maguro_names) > 0:
    # 最初のマグロのSpecCodeを使用
    spec_code = maguro_names.iloc[0]['SpecCode']
    fish_info = species_df[species_df['SpecCode'] == spec_code]
    
    if len(fish_info) > 0:
        print(f"\n\nSpecCode {spec_code} の詳細情報:")
        info = fish_info.iloc[0]
        print(f"学名: {info['Genus']} {info['Species']}")
        print(f"科コード: {info['FamCode']}")
        print(f"英名: {info['FBname']}")

# 人気の魚をいくつか検索
popular_fish = ['サケ', 'タイ', 'アジ', 'サバ', 'カツオ', 'イワシ']
print("\n\n人気の魚の検索結果:")
for fish in popular_fish:
    results = japanese_names[japanese_names['ComName'].str.contains(fish, na=False)]
    print(f"{fish}: {len(results)}件")
    if len(results) > 0:
        print(f"  例: {results['ComName'].head(3).tolist()}")