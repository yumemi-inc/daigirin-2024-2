---
class: content
---

<div class="doc-header">
  <h1>Vanilla JavaScript はマルチプラットフォームの夢を見るか</h1>
  <div class="doc-author">江本光晴</div>
</div>

# Vanilla JavaScript はマルチプラットフォームの夢を見るか

<!-- Qiita用 
:::note info
本記事は [技術書典17](https://techbookfest.org/event/tbf17) で無料配布する同人誌「ゆめみ大技林 '24 (2)」の寄稿です。加筆や修正などがある場合はこの記事で行います。
:::
-->

iOS は Swift、Android は Kotlin を利用して、モバイルアプリを開発してきました。今は Flutter、React Native そして KMP などクロスプラットフォーム技術を利用して開発する手段も一般的になってきました。本記事はそれらを利用せずに、クロスプラットフォームに挑戦します。iOS および Android で利用できるプログラミング言語には C++ や JavaScript があります。今回は iOS アプリ開発の視点から JavaScript を本当に導入できるのか、使いごこちはどうなのかを検証します。

本記事は、[YUMEMI.grow Mobile #13](https://yumemi.connpass.com/event/317381/) [^ygm-13] で発表した内容 [^speakerdeck] および [iOSDC Japan 2024](https://iosdc.jp/2024/) に寄稿した記事 [^iosdc-2024-pamphlet] の一部を底本として、加筆・訂正を行なったものになります。

[^ygm-13]: <https://yumemi.connpass.com/event/317381/>
[^speakerdeck]: <https://speakerdeck.com/mitsuharu/2024-05-17-javascript-multiplatform>
[^iosdc-2024-pamphlet]: <https://fortee.jp/iosdc-japan-2024/proposal/77eccb66-ea35-4c9f-aa33-a36ce98569df>

## JavaScript ライブラリを準備する

今回の例として [just-mean](https://www.npmjs.com/package/just-mean) [^just-mean] というライブラリの導入を試みます。なお、この just [^just] は JavaScript の定番ライブラリ lodash [^lodash] の代替候補の１つとされているライブラリです。パッケージごとに機能を分けているので、軽量で他ライブラリへの依存も少ないという利点があります。今回の例として、最適なライブラリです。

[^just-mean]: https://www.npmjs.com/package/just-mean
[^just]: https://github.com/angus-c/just
[^lodash]: https://www.npmjs.com/package/lodash

JavaScript ライブラリはファイル構成や他ライブラリ依存性の問題で簡単には読み込めません。たとえば、ディレクトリで構造化されるので、`hogehoge/index.js` や `piyopiyo/index.js` のように同名ファイルが頻繁に存在します。そのまま Xcode のプロジェクトに追加すると問題になるので、読み込みやすい形に形成します。では最初に、その just-mean を手元に用意します。

```shell
% yarn init
% yarn add receiptline
```

次に JavaScript のブリッジとなるクラスで just-mean の関数を定義します。ここで JavaScript ではなく、TypeScript で記述します。

[^webpack]: <https://webpack.js.org/>

```typescript
import mean from "just-mean"

export class Bridge {
  static mean(array: number[]) {
    return mean(array)
  }
}
```

読み込みやすい形への形成は webpack [^webpack] を利用します。webpack を追加します。

```bash
yarn add -D webpack webpack-cli
```

package.json は次のようになりました。説明は省略しますが、jest を追加して、ブリッジファイルのテストを行っています。

```json
{
  "name": "js-packages-bridge",
  "version": "1.0.0",
  "main": "index.js",
  "license": "MIT",
  "scripts": {
    "build": "webpack --progress --color",
    "test": "jest"
  },
  "dependencies": {
    "just-mean": "^2.2.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.5",
    "ts-loader": "^9.5.1",
    "typescript": "^5.5.2",
    "webpack": "^5.91.0",
    "webpack-cli": "^5.1.4"
  }
}
```

上記のブリッジファイルから webpack の設定ファイル webpack.config.js に基づいて、バンドルファイルを生成します。

```javascript
const path = require("path")
const webpack = require('webpack')

module.exports = {
  mode: 'production',
  entry: './src/index.ts', // ブリッジファイル
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "Module.bundle.js", // 生成されるバンドルファイル
    library: "Module",
    libraryTarget: "var",
  },
  module: {
    rules: [{
      test:  /\.tsx?$/, // .ts または .tsx ファイルを対象
      use: 'ts-loader',
      exclude: /node_modules/,
    }]
  },
  target: 'web'
}
```

では、バンドルファイルを作成します。問題なければ `Module.bundle.js` が作成されます。

```bash
yarn webpack
```

ここで just ライブラリは依存性が少ないので、問題なくバンドルファイルが作成されます。しかい、依存性があるライブラリの場合は、その他のライブラリで利用される関数の依存性を解決できないです。その場合は、webpack.config.js に fallback を設定します。

```javascript
resolve: {
  fallback: {
    "hogehoge": false,
    "piyopiyo": "",
  }
},
```

## iOS で JavaScript ライブラリを読み込む

バンドルファイルを iOS アプリのプロジェクトに追加します。フレームワーク JavaScriptCore を import して、JSContext でそのファイルを読み込みます。以降に紹介する Swift のコードは一部を簡略表示しています。詳細は後に紹介するサンプルリポジトリを確認してください。

```swift
import JavaScriptCore

enum JavaScriptBridgeError: Error {
  case failed
  case exception(message: String)
}

final class JavaScriptBridge {

  private let context = JSContext(virtualMachine: JSVirtualMachine())
  private let bundleFile = "Module.bundle.js"

  private func prepare() throws {
    let bundle = Bundle.main
    guard
      let path = bundle.path(forResource: bundleFile, ofType: nil),
      let contents = try? String(contentsOfFile: path)
    else {
      throw JavaScriptBridgeError.failed
    }
    context.evaluateScript(contents)
  }
}
```

この context に対して webpack で設定したモジュール名や関数名を頼りに JavaScript で定義した関数を取得します。

```swift
guard
  let module = context.objectForKeyedSubscript("Module"),
  let bridge = module?.objectForKeyedSubscript("Bridge"),
  let mean = bridge?.objectForKeyedSubscript("mean")
else {
  throw JavaScriptBridgeError.failed
}
```

JavaScript の関数を取得できたら、その関数に引数を与えて実行します。注意点としては、戻り値は JSValue [^JSValue] という何にでも成れる型なので、型安全に慣れている人には注意しましょう。

[^JSValue]: https://developer.apple.com/documentation/javascriptcore/jsvalue

```swift
func mean(_ args: [Double]) -> Double {
  let result = mean.call(withArguments: [arg])
  return result.toDouble()
}
```

### エラーハンドリング

Swift と同時に JavaScript を利用するので、エラーの原因が何か分かりづらいです。エラーハンドリングは確実に行いましょう。エラーハンドリングは context.exceptionHandler を設定すれば、エラーが起こった場合にその原因が分かります。

```swift
// エラーハンドリング
context.exceptionHandler = { context, error in
  guard let error, let message = error.toString() else {
    return
  }
  print(message) // 仮にエラーメッセージを print で表示する
}
```

このエラーハンドリングはエラーを漏れなく検知できるので便利です。しかしながら、特定箇所のエラーを検知したい場合は不向きです。個別にエラーを取得したい場合は context が何か実行されるたびに exception を調べます。先ほどの mean 関数は次のように書き直されます。

```swift
// エラーが起こったら例外を投げるように修正された
func mean(_ args: [Double]) throws -> Double {
  let result = mean.call(withArguments: [arg])
  if let exception = context.exception {
    let message = exception.toString() ?? ""
    context.exception = nil // 他の処理で誤検知されないように初期化しておく
    throw JavaScriptBridgeError.exception(message: message)
  }
  return result.toDouble()
}
```

処理実行のたびに、このエラーハンドリングを書くのは正直面倒です。基本は context.exceptionHandler でエラーを検知して、必要なところだけ個別に検知しようと考えるでしょう。しかし、これらは排他的で、どちらかのみです。両方は共存できません。

個人的に勧めるのは、バンドルファイルを導入して正しく動作するか検証する初期フェーズであれば context.exceptionHandler を利用しましょう。最初はトライ＆エラーで色々試すことが多いので、エラーを漏れなく検知するのが優先されるでしょう。そして、ある程度開発が進んで動作が安定したら、関数の個別エラー処理に移行して、アプリ本体への安全性を高めましょう。

また、別アプローチとしては処理を行った際に、その戻り値が nil ならエラーとして扱う方法もあります。ただし、エラーメッセージは取得できないので、エラー設計は慎重にしましょう。

<!-- ```swift
guard let module = context.objectForKeyedSubscript("Module") else {
  throw JavaScriptBridgeError.moduleNotFound
}
``` -->

## まとめ

iOS で JavaScript ライブラリを実行する方法を紹介しました。本記事では iOS のみでしたが、Android でも動作するのを確認したので、Vanilla JavaScript でマルチプラットフォームは技術的には可能です。しかしながら、型安全ではない、OS の種類やバージョンで JavaScript エンジンが異なるので、安定性に欠けるという問題もあります。夢を見ています。

どうしても iOS と Android で JavaScript のライブラリを実行したいというシーンで利用できると考えます。そんなシーンは来ないよ…と思ってた矢先、両 OS で JavaScript ライブラリの利用について相談されました。ということで、局所的にはなりますが、Vanilla JavaScript のマルチプラットフォームはあります。夢から醒めます。

本記事で挙げたサンプルは GitHub のリポジトリ [^UseJavaScriptPackages] を公開しています。興味ある方は見てください。なお、Vanilla JavaScript でマルチプラットフォームをがっつり行いたい場合は Vanilla ではなく、React Native の導入を勧めます。

[^UseJavaScriptPackages]: https://github.com/mitsuharu/UseJavaScriptPackages
