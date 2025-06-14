import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import * as wanakana from 'wanakana';

describe('WanaKana Conversion', () => {
  it('should convert basic katakana to romaji', () => {
    assert.equal(wanakana.toRomaji('サバ'), 'saba');
    assert.equal(wanakana.toRomaji('イワシ'), 'iwashi');
    assert.equal(wanakana.toRomaji('タイ'), 'tai');
    assert.equal(wanakana.toRomaji('マグロ'), 'maguro');
    assert.equal(wanakana.toRomaji('サケ'), 'sake');
  });

  it('should convert hiragana to romaji', () => {
    assert.equal(wanakana.toRomaji('さば'), 'saba');
    assert.equal(wanakana.toRomaji('いわし'), 'iwashi');
    assert.equal(wanakana.toRomaji('たい'), 'tai');
    assert.equal(wanakana.toRomaji('あじ'), 'aji');
    assert.equal(wanakana.toRomaji('まぐろ'), 'maguro');
  });

  it('should handle Hepburn romanization patterns', () => {
    // し -> shi (not si)
    assert.equal(wanakana.toRomaji('シ'), 'shi');
    assert.equal(wanakana.toRomaji('し'), 'shi');
    
    // ち -> chi (not ti)
    assert.equal(wanakana.toRomaji('チ'), 'chi');
    assert.equal(wanakana.toRomaji('ち'), 'chi');
    
    // つ -> tsu (not tu)
    assert.equal(wanakana.toRomaji('ツ'), 'tsu');
    assert.equal(wanakana.toRomaji('つ'), 'tsu');
    
    // ふ -> fu (not hu)
    assert.equal(wanakana.toRomaji('フ'), 'fu');
    assert.equal(wanakana.toRomaji('ふ'), 'fu');
    
    // しゃ、しゅ、しょ
    assert.equal(wanakana.toRomaji('シャ'), 'sha');
    assert.equal(wanakana.toRomaji('シュ'), 'shu');
    assert.equal(wanakana.toRomaji('ショ'), 'sho');
  });

  it('should handle long vowels', () => {
    // Long vowels in katakana (ー)
    assert.equal(wanakana.toRomaji('コーヒー'), 'koohii');
    assert.equal(wanakana.toRomaji('スーパー'), 'suupaa');
    
    // Long vowels in hiragana (repeated vowels)
    assert.equal(wanakana.toRomaji('こうし'), 'koushi');
    assert.equal(wanakana.toRomaji('とうきょう'), 'toukyou');
  });

  it('should handle double consonants', () => {
    // っ -> double consonant
    assert.equal(wanakana.toRomaji('カップ'), 'kappu');
    assert.equal(wanakana.toRomaji('サッカー'), 'sakkaa');
    assert.equal(wanakana.toRomaji('ペット'), 'petto');
  });

  it('should handle n before vowels and ya/yu/yo', () => {
    // ん -> n (but careful with following sounds)
    assert.equal(wanakana.toRomaji('ホンヤ'), "hon'ya");
    assert.equal(wanakana.toRomaji('サンマ'), 'sanma');
  });

  it('should convert to lowercase for database matching', () => {
    assert.equal(wanakana.toRomaji('サバ').toLowerCase(), 'saba');
    assert.equal(wanakana.toRomaji('イワシ').toLowerCase(), 'iwashi');
    assert.equal(wanakana.toRomaji('フグ').toLowerCase(), 'fugu');
  });

  it('should handle voiced sounds (濁音・半濁音)', () => {
    // Voiced consonants
    assert.equal(wanakana.toRomaji('ガ'), 'ga');
    assert.equal(wanakana.toRomaji('ザ'), 'za');
    assert.equal(wanakana.toRomaji('ダ'), 'da');
    assert.equal(wanakana.toRomaji('バ'), 'ba');
    assert.equal(wanakana.toRomaji('パ'), 'pa');
    
    // Voiced combinations
    assert.equal(wanakana.toRomaji('ギョ'), 'gyo');
    assert.equal(wanakana.toRomaji('ジャ'), 'ja');
    assert.equal(wanakana.toRomaji('ビャ'), 'bya');
    assert.equal(wanakana.toRomaji('ピュ'), 'pyu');
  });

  it('should handle special modern sounds', () => {
    // Wi, we, wo sounds - wanakana converts these to ui, ue, uo
    assert.equal(wanakana.toRomaji('ウィ'), 'ui');
    assert.equal(wanakana.toRomaji('ウェ'), 'ue');
    assert.equal(wanakana.toRomaji('ウォ'), 'uo');
    
    // Ti, di sounds - wanakana converts these differently
    assert.equal(wanakana.toRomaji('ティ'), 'tei');
    assert.equal(wanakana.toRomaji('ディ'), 'dei');
    
    // Fa, fi sounds - wanakana handles these as combinations
    assert.equal(wanakana.toRomaji('ファ'), 'fua');
    assert.equal(wanakana.toRomaji('フィ'), 'fyi');
    assert.equal(wanakana.toRomaji('フェ'), 'fye');
    assert.equal(wanakana.toRomaji('フォ'), 'fuo');
  });

  it('should handle particle pronunciations', () => {
    // は particle (pronounced 'wa')
    assert.equal(wanakana.toRomaji('は'), 'ha'); // wanakana treats as regular ha
    
    // へ particle (pronounced 'e') 
    assert.equal(wanakana.toRomaji('へ'), 'he'); // wanakana treats as regular he
    
    // を particle (pronounced 'o')
    assert.equal(wanakana.toRomaji('を'), 'wo'); // wanakana keeps wo
  });

  it('should handle various n patterns', () => {
    // ん before different sounds
    assert.equal(wanakana.toRomaji('サンカク'), 'sankaku');
    assert.equal(wanakana.toRomaji('センパイ'), 'senpai');
    assert.equal(wanakana.toRomaji('ホンマ'), 'honma');
    assert.equal(wanakana.toRomaji('ホンバ'), 'honba');
    
    // ん at end
    assert.equal(wanakana.toRomaji('ホン'), 'hon');
  });

  it('should handle database compatibility patterns', () => {
    // Test common fish name patterns that might appear in database
    assert.equal(wanakana.toRomaji('フグ'), 'fugu');
    assert.equal(wanakana.toRomaji('ブリ'), 'buri');
    assert.equal(wanakana.toRomaji('ヒラメ'), 'hirame');
    assert.equal(wanakana.toRomaji('カレイ'), 'karei');
    assert.equal(wanakana.toRomaji('スズキ'), 'suzuki');
    assert.equal(wanakana.toRomaji('タチウオ'), 'tachiuo');
  });

  it('should handle complex fish names', () => {
    // Fish names with multiple syllables and special sounds
    assert.equal(wanakana.toRomaji('シュモクザメ'), 'shumokuzame');
    assert.equal(wanakana.toRomaji('イシダイ'), 'ishidai');
    assert.equal(wanakana.toRomaji('カジキマグロ'), 'kajikimaguro');
    assert.equal(wanakana.toRomaji('ハタハタ'), 'hatahata');
  });

  it('should convert to lowercase for database matching', () => {
    assert.equal(wanakana.toRomaji('サバ').toLowerCase(), 'saba');
    assert.equal(wanakana.toRomaji('イワシ').toLowerCase(), 'iwashi');
    assert.equal(wanakana.toRomaji('フグ').toLowerCase(), 'fugu');
  });

  it('should leave romaji unchanged', () => {
    assert.equal(wanakana.toRomaji('saba'), 'saba');
    assert.equal(wanakana.toRomaji('Iwashi'), 'Iwashi');
    assert.equal(wanakana.toRomaji('TAI'), 'TAI');
  });
});