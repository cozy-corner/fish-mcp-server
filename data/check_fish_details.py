#!/usr/bin/env python3
import pandas as pd

# species.parquetを読み込む
species_df = pd.read_parquet("species.parquet")

# データの列を確認
print("species.parquetの列一覧:")
for i, col in enumerate(species_df.columns):
    print(f"{i+1:3d}. {col}")

print("\n" + "="*50 + "\n")

# 説明に関連しそうな列を調べる
description_columns = ['Remark', 'Comments', 'Importance', 'Dangerous', 'DangerousRef']

print("説明に関連しそうな列の内容:")
for col in description_columns:
    if col in species_df.columns:
        # 空でないデータの数をカウント
        non_empty = species_df[col].notna().sum()
        print(f"\n{col}列: {non_empty}件のデータあり")
        # サンプルを表示
        sample_data = species_df[species_df[col].notna()][col].head(3)
        for idx, data in enumerate(sample_data):
            print(f"  例{idx+1}: {str(data)[:100]}...")

# 特定の魚（クロマグロ）の全情報を確認
print("\n" + "="*50 + "\n")
print("クロマグロ（SpecCode: 147）の全情報:")
tuna = species_df[species_df['SpecCode'] == 147]
if len(tuna) > 0:
    for col in species_df.columns:
        value = tuna.iloc[0][col]
        if pd.notna(value) and value != 0 and value != '':
            print(f"{col}: {value}")

# ecology.parquetがあるか確認
import os
if os.path.exists("ecology.parquet"):
    print("\n" + "="*50 + "\n")
    print("ecology.parquetが存在します。ダウンロードして確認することをお勧めします。")