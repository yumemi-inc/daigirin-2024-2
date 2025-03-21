---
class: content
---

<div class="doc-header">
  <h1>Swiftでより優雅な範囲判定を書きたくて</h1>
  <div class="doc-author">星野恵瑠</div>
</div>

# Swiftでより優雅な範囲判定を書きたくて

<!-- Qiita用 
:::note info
本記事は弊社が[技術書典17](https://techbookfest.org/event/tbf17) で無料配布する同人誌「ゆめみ大技林 '24 (2)」の寄稿です。加筆や修正などがある場合はこの記事で行います。
:::
-->

<img alt="Qiita 記事への QR コード" style="float:right;margin-left:6px" width=80  src="./images_lovee/post.png">

※本記事は Qiita でも同じものを公開しています。出版後に追筆や訂正等がある場合は Qiita の記事でご覧いただけますので、後述の URL か、右の QR コードからアクセスしてみてください：

https://qiita.com/lovee/items/99b898690cfe784b195c

## TL;DR

やはり `if a < x < b` 書きたいよね！？

## 背景

一つの変数が特定の範囲の中に入ってるかどうかの判定は、人生の中で誰もがやったことあるでしょう。例えば、一つの円の半径が 10 以上 100 以下かどうかを判定したいとしましょう。さてこの判定、どう書けばいいでしょうか？

半径の変数を `radius` とすれば、一番オーソドックスな書き方なら、`if radius > 10 && radius < 100` ではないでしょうか。ところがこの書き方は 2 つの問題があると筆者が思います。一つ目はちょっと長くて読みにくいと思います、少なくとも読みやすい部類には入らないと思います。そしてもう一つは `radius` という変数が二回も登場していることです。些細なことと思うかもしれませんが、これはれっきとした DRY 原則違反だし、もし半径の変数が複数あったら、間違って `if radiusA > 10 && radiusB < 100` と書いちゃうリスクだってあります。

というわけで、より優雅な判定の書き方を考えたいですね。

## よくある改良した書き方

### `switch` 文の活用

`radius` を 1 回だけ出現させたいなら、よくあるアプローチはそもそも `if` 文を `switch` 文に変える方法です。つまり上記の判定はこのように書けます：

```swift
switch radius {
case ...10,
     100...:
    // 範囲外の時の処理

default: // もしくは `case _:`
    // 範囲内の時の処理
}
```

このように `switch` 文にした場合、 `radius` の出現を 1 回だけに減らしたから、DRY 原則が守られ、間違って違う変数で判定するリスクも大きく減ったと思いますが、上限と下限の表現が非常にわかりにくく、どっちかというと `if !(radius <= 10 && radius >= 100)` の判定になっています。もちろん判定の内容は実質同じですが、読み手である我々人間には非常に不親切な書き方と言わざるを得ません。

もちろんこれをもう少し改良する余地はあると思います、例えばこれなら多少は見やすいかなと思います：

```swift
switch radius:
case ...10:
    // 範囲外の時の処理
case ..<100:
    // 範囲内の時の処理
case 100...:
    // 範囲外の時の処理
default: // 存在しないはずですが書かなければビルドエラー
    fatalError()
}
```

これなら、確かに順番で読んでいくと、「あー `radius` が 10 ~ 100 の間にあるときー」と読み取れるから、理解のしやすさは格段に上がったと思いますが、範囲外の時の処理が分けられてしまったり、本来不必要な `default` をどうしても書かなくてはいけない[^redandent-default]などの問題もありますが、何より本来 1 行でできる判定がこのようにとても長い文章にしなくてはいけません。そういう意味ではやはり「読みやすい」とは違うと思います。

[^redandent-default]: もちろんそもそも `case 100...` を省略して `default` を「範囲外の時の処理」とするのも一つの手ですが、こうすればまた微妙に読みやすさが損なっているような気もします…

### 範囲型の活用

Swift に慣れた人なら、`Range` というものの存在も思い浮かぶかと思います。Swift は最初から「範囲」を表す方が存在し、そしてその範囲と数値の比較判定も実はあります。というわけで範囲を使えば、上記の判定はこう書けます：

```swift
if (10 ..< 100).contains(radius)
// もしくは
if (10 ..< 100) ~= radius
```

この書き方は `radius` の出現を 1 回に守りながら、冗長な書き方も回避できましたが、しかしこれではまた別の問題が 2 つ出たと思います。一つは `switch` 文以上に読みにくいと思います。この書き方はある意味ヨーダ記法[^yoda-notation]に近い形で、比較基準を左に、逆に比較対象を右にしてしまっています。そしてもう一つはかなり致命的な問題で、本来ここで行いたい判定は `x > 10`、つまり 10 は含まれないはずなのに、残念ながら Swift にはそれを表現できる範囲型がありません。もし `radius` がピッタリ 10 なら、本来 `false` で返されるべきなのに、この判定では `true` が返されてしまいます。

[^yoda-notation]: ヨーダ記法は、一般的な判定文を逆にして、例えば x が 100 である判定したいとき、`if x == 100` ではなく、`if 100 == x` の順番にする書き方です。この記法は一般的に読みにくいですが、「代入」演算も条件判定で使えてしまう C 言語などのプログラミング言語では、間違って `if x = 100` というミスが防げます。なぜなら `x = 100` は普通に代入文としてビルドが通りますが、`100 = x` は数字リテラルに数値を代入しようとしていて、こんな代入ができないからビルドエラーになります。ただし Swift などの現代的なプログラミング言語は、代入文はそもそも条件判定に使えないことが多いため、ヨーダ記法はただ読みにくいだけの書き方として一般的に推奨されません。

### 数学のテキストに因んだ書き方

ところで我々は学校で数学習ったときも、範囲や区間についてたくさん勉強したと思いますが、その時の書き方を思い出してみましょう。そう <span class="math">0 < <span class="math-italic">x</span> < 10</span> みたいな式とはよく睨み合いしていたのではないでしょうか。この書き方なら非常にシンプルでわかりやすく、「x は 0 と 10 の間にある」と誰もがすぐに結論を出せるではないでしょうか。

というわけで、この書き方を参考にすれば、`if 10 < radius && radius < 100` で書くと、最初の書き方より多少は読みやすくなったのではないでしょうか。

もちろんこの書き方にも問題があり、また `radius` という変数が 2 回登場してしまったのです。

## なかったら作ればいいじゃないか

上の書き方はすでにとてもいい線行けたと思います。これまでの書き方の中で一番わかりやすいし、そこそこシンプルだと思います。ではこれを究極的に数学のと全く同じ書き方にすれば、シンプル＆わかりやすい＆バグりにくいの三拍子揃った最強の書き方になるではないでしょうか。

```swift
if 10 < radius < 100
```

問題はこのまま書いてもビルド通らないですね…`<` は連結できないし、Swift の `if` 文は `Bool` しか受け付けません。

でもここで諦めたら試合終了です。忘れては行けません、Swift には「演算子オーバーロード」をサポートしているのです。つまり、我々が `<` を連結できるようにしちゃえばいいのです。というわけでその作り方を考えてみましょう。

### 基本形

まずは `<` を連結させたいです。通常の `<` は `ComparisonPrecedence` という演算子グループに入っており、このグループは連結できないように定義されています。というわけでまずは連結できる演算子グループを作りたいと思います：

```swift
precedencegroup AssociativeComparisonPrecedence {
    associativity: left
}
```

これで左から順に連結できる演算子グループが定義できました。ただしこれではまだ足りません、一つの式に複数の演算子が出てきた時、どれを先に演算するかを決めるために演算の優先順位があり、これも演算子グループに定義しなくてはいけません。今回の場合、通常の比較演算子と同じ優先順位にしたいのですが、残念ながらそれが直接指定できず、`higherThan` と `lowerThan` しか使えません。というわけで実際の `ComparisonPrecedence` の定義[^comparison-precedence-priority]を見て、`AssociativeComparisonPrecedence` は下記のように演算優先順位を設定します。

[^comparison-precedence-priority]: 例えばソースコードで `import Swift` を書けば、Cmd キー押しながら Swift をクリックすると、Swift のいろんなヘッダーが見れます。そこで `ComparisonPrecedence` を検索すると、その定義が見つかります。その定義を見れば、`ComparisonPrecedence` は `LogicalConjunctionPrecedence` より上で、`NilCoalescingPrecedence` より下だとわかります。

```swiftprecedencegroup AssociativeComparisonPrecedence {
    associativity: left
    higherThan: LogicalConjunctionPrecedence
    lowerThan: NilCoalescingPrecedence
}
```

さて、次は `<` をこの演算子グループに入れるところですね。

```swift
infix operator <: AssociativeComparisonPrecedence
```

これで、連結が許される `<` 演算が作られました。

次に、実際に `<` を連結した時の処理を定義しなくては行けません、なぜならそのまま連結させても、例えば `10 < radius < 100` と書いても、最初の `radius < 10` では `Bool` が返され、`Bool` の値と `100` という数値を比較させても何が何だかわからないのです。というわけでここはこの連結に意味をなすように関数を新たに定義する必要があります。

まずは `10 < radius` について考えましょう。この演算は、当然ながら通常の小なりの演算結果を返さなくてはなりません、ただしそれと同時に、演算子の右側にある `radius` も返さなければ、次に小なり演算ができません。というわけで今回は愚直にその両方を返すための Tuple を作って返しましょう。

```swift
extension Comparable {
    static func < (lhs: Self, rhs: Self) -> (Bool, Self) {
        return (lhs < rhs, rhs)
    }
}
```

これで `10 < radius` の演算で、`radius` が 10 より大きかどうかの結果とともに、`radius` の値自身も一緒に返せます。

次に後半の `< 100` について考えましょう。ここは前半の `(Bool, Comparable)` が返されたので、当然これを利用する必要があります。そして最後に `if` 文で使えるように、`Bool` を返す必要があります。というわけでもう一つの演算を定義します：

```swift
extension Comparable {
    static func < (lhs: (Bool, Self), rhs: Self) -> Bool
}
```

さてこの演算の実装ですが、もしそもそも前半の判定が `false` なら、後半だけ成立しても意味ないので `false` を返さなければなりません。というわけでこの処理はこのように実装する必要があります：

```swift
extension Comparable {
    static func < (lhs: (Bool, Self), rhs: Self) -> Bool {
        return (lhs.0 && lhs.1 < rhs)
    }
}
```

これで、前半の判定結果と後半の判定が共に `true` である時だけ、最終結果も `true` になります。というわけで早速この呼び出しを確認してみましょう：

```swift
let radius: CGFloat = 50
if 10 < radius < 100 {
    print("true") // true
}
```

よし、これでバッチリですね！

### 発展系 Part.1：さらにたくさんの `<` を連結させる

今回は `10 < radius < 100` という、一つの変数だけの判定に着目していますが、実際のケースでは、もしかするとさらにたくさんの変数をいっぺんに確認したい需要もあるかもしれません。例えば更に次の半径 B があって、半径 B は 半径 A より大きくなければなりません、そして半径 A と半径 B は共に 10 と 100 の間になければなりません。この時数学なら <span class="math">10 < <span class="math-italic">A</span> < <span class="math-italic">B</span> < 100</span> のような書き方もできますが、現在のこの実装ではまだ `if 10 < radiusA < radiusB < 100` が書けません、なぜなら `A < B` のこの `<` は `(Bool, Comparable)` の入力を受けながら、同じく `(Bool, Comparable)` の出力もしなければなりませんが、この実装がまだないのです。というわけでこの実装も入れましょう：

```swift
extension Comparable {
    static func < (lhs: (Bool, Self), rhs: Self) -> (Bool, Self) {
        return ((lhs.0 && lhs.1 < rhs), rhs)
    }
}
```

これで `if 10 < radiusA < radiusB < 100` も書けますね。それどころか、`radiusC` も `radiusD` も、コンパイラーが型推論できる限りどんどん追加できます。

### 発展系 Part.2：`<=` 演算も対応させる

まあ現実世界では流石に `10 < radiusA < radiusB < 100` のような 2 つ以上の変数の同時判定はまだ少ないかもしれません。しかしその数値が上限値もしくは下限値であっても大丈夫、つまり <span class="math">10 ≤ <span class="math-italic">A</span> < 100</span> や <span class="math">10 < <span class="math-italic">A</span> ≤ 100</span>、もしくは更に <span class="math">10 ≤ <span class="math-italic">A</span> ≤ 100</span> のような判定は多々あると思います。というわけでこれも対応したいですね。これは非常に簡単で、これまでの `<` の実装をコピーして、`<` を `<=` で置き換えればいいだけですね

```swift
infix operator <=: AssociativeComparisonPrecedence

extension Comparable {
    static func <= (lhs: Self, rhs: Self) -> (Bool, Self) {
        return (lhs <= rhs, rhs)
    }
    
    static func <= (lhs: (Bool, Self), rhs: Self) -> (Bool, Self) {
        return ((lhs.0 && lhs.1 <= rhs), rhs)
    }
    
    static func <= (lhs: (Bool, Self), rhs: Self) -> Bool {
        return (lhs.0 && lhs.1 <= rhs)
    }    
}
```

これで `10 <= radius < 100` も `10 < radius <= 100` も `10 <= radius <= 100` も、全部書けちゃいますね！

### 宿題：更に `>` や `>=` も対応させたい！

まあ正直通常範囲を決める時、小さい方から大きい方へ書くのが一般的なので、わざわざ <span class="math">100 > <span class="math-italic">A</span> > 10</span> のような書き方をする人あまりいないと思います（むしろいたら近寄りたくない…）が、あくまでこれまでやってきたことのさらなる発展系で、ぜひ頭の体操として更に `>` や `>=` の連結も対応させたい時どうすればいいかを考えてみてください。

ここで気をつけてほしいのは、`<=` の対応の時と同じように愚直に `>` とかをそのまま追加しては行けません、なぜならそのままでは `10 < radius > 100` みたいな式も書けてしまうのです。当然ながらこのような判定はあっては行けません、ビルドエラーで落とさなければなりません。`10 < radius < 100` と `100 > radius > 10` が書けながら、`10 < radius > 100` や `10 > radius < 100` が書けないように作る方法を考えてみてほしいです。

## まとめ

シンプルだし読みやすいしバグりにくいから、この書き方を普及させたい！
