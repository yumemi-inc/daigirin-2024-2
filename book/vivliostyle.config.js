module.exports = {
  title: 'ゆめみ大技林 \'24 (2)',
  author: 'ゆめみ大技林製作委員会',
  language: 'ja',
  size: 'A5',
  theme: [
    '@vivliostyle/theme-base@1.0.1', // 大技林テーマが 2.0.0 に対応したら削除してください。
    '@vivliostyle/theme-techbook@1.0.1', // 大技林テーマが 2.0.0 に対応したら削除してください。
    'vivliostyle-theme-macneko-techbook@0.2.0',
    'theme/theme.css'
  ],
  entry: [
    // 目次
    'index.md',
    // はじめに
    'preface.md',
    // 各章の原稿
    'usami.md',
    'sato.md',
    'lovee.md',
    'kudo.md',
    'emoto.md',
    'kawashima.md',
    'yusuga.md',
    'k_kojima.md',
    'omori.md',
    // 著者紹介
    'authors.md',
    // 奥付
    'colophon.md'
  ],
  entryContext: './manuscripts',
  output: [
    'output/ebook.pdf',
  ],
  workspaceDir: '.vivliostyle',
  toc: false,
  cover: undefined,
}
