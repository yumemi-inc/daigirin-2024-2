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

以下は、iosdc-2024-pamphlet からコピー&ペーストした。直す。

本記事は、[YUMEMI.grow Mobile #13](https://yumemi.connpass.com/event/317381/) [^ygm-13] で発表した内容 [^speakerdeck] および [iOSDC Japan 2024](https://iosdc.jp/2024/) のパンフレットに寄稿した記事 [^iosdc-2024-pamphlet] の一部を底本として、加筆・訂正を行なったものになります。

[^ygm-13]: https://yumemi.connpass.com/event/317381/
[^speakerdeck]: https://speakerdeck.com/mitsuharu/2024-05-17-javascript-multiplatform
[^iosdc-2024-pamphlet]: https://fortee.jp/iosdc-japan-2024/proposal/77eccb66-ea35-4c9f-aa33-a36ce98569df

Swift 移植版を作りたいが難しいと詰んだところに、一筋の光明が差す。iOS は JavaScriptCore を持っているので、JavaScript のライブラリを実行できます。準備として、その ReceiptLine を手元に用意します。

```bash
mkdir js-packages
cd js-packages
yarn init
yarn add receiptline
```

この用意した Receiptline をすぐに読み込みたいところですが、JavaScript のファイル構成や他ライブラリ依存性の問題で簡単には読み込めません。そこで、webpack [^webpack] を利用して、読み込みやすい形に作成します。まず、JavaScript のブリッヂとなるクラスで ReceiptLine の関数を定義します。

[^webpack]: https://webpack.js.org/

```javascript
import { transform } from "receiptline"

export class Bridge {
    static transformSvg(doc) {
        const display = {
            cpl: 42,
            encoding: 'multilingual'
        }
        const svg = transform(doc, display)
        return svg
    }
}
```

このブリッヂファイルから webpack の設定ファイルに基づいて、バンドルファイルを生成します。設定ファイルの記述に関しては省略します。サンプルリポジトリ [^UseJavaScriptPackages-github] を参照してください。生成されたバンドルファイルを `bundle.js` とします。

```bash
yarn add -D webpack webpack-cli
yarn webpack
```

バンドルファイルを iOS アプリのプロジェクトに追加します。フレームワーク JavaScriptCore を import して、JSContext でそのファイルを読み込みます。

```swift
import JavaScriptCore

guard
    let path = Bundle.main.path(forResource: "bundle.js", ofType: nil),
    let contents = try? String(contentsOfFile: path)
else {
    throw Error()
}

let context: JSContext = JSContext(virtualMachine: JSVirtualMachine())
context.evaluateScript(contents)
```

この context に対して webpack で設定したモジュール名や関数名を頼りに関数を取得して、実行します。これらの詳細は先日の勉強会で発表したので、そのスライド [^UseJavaScriptPackages-slide] を参照してください。

```swift
let module = context.objectForKeyedSubscript("Module")
let bridge = module?.objectForKeyedSubscript("Bridge")
let transformSvg = bridge?.objectForKeyedSubscript("transformSvg")
let svg = transformSvg?.call(withArguments: [markdownText])
```

[^UseJavaScriptPackages-github]: https://github.com/mitsuharu/UseJavaScriptPackages
[^UseJavaScriptPackages-slide]: https://speakerdeck.com/mitsuharu/2024-05-17-javascript-multiplatform
