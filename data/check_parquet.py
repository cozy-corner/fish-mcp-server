#!/usr/bin/env python3
import pandas as pd
import sys

def check_parquet(filename):
    try:
        # Parquetファイルを読み込む
        df = pd.read_parquet(filename)
        
        print(f"\n{filename} の情報:")
        print(f"行数: {len(df)}")
        print(f"列数: {len(df.columns)}")
        print(f"\n列名: {list(df.columns)}")
        
        # 最初の5行を表示
        print(f"\n最初の5行:")
        print(df.head())
        
        # 日本語データの確認（comnames.parquetの場合）
        if 'comnames' in filename:
            # Language列がある場合、日本語のデータを探す
            if 'Language' in df.columns:
                japanese_data = df[df['Language'] == 'Japanese']
                print(f"\n日本語データ件数: {len(japanese_data)}")
                if len(japanese_data) > 0:
                    print("\n日本語データの例:")
                    print(japanese_data.head())
        
    except Exception as e:
        print(f"エラー: {e}")
        print("pandasがインストールされていない場合: pip3 install pandas pyarrow")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        check_parquet(sys.argv[1])
    else:
        # デフォルトで両方のファイルをチェック
        check_parquet("species.parquet")
        check_parquet("comnames.parquet")