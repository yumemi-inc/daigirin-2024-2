---
class: content
---

<div class="doc-header">
  <h1>純粋関数から学ぶ依存性注入</h1>
  <div class="doc-author">佐藤貴一</div>
</div>

# 純粋関数から学ぶ依存性注入
初めまして、株式会社ゆめみに 25 卒で入社予定の kii と言います。

純粋関数や依存性注入などは最近よく聞く考えであり、共通している部分がとても多いものです。それらの考えは関連付けて学ぶことで、より一層深い理解が得られるものだと私は考えています。そこで、この記事は純粋関数を通して依存性について解説していきます。

サンプルコードはすべて TypeScript で書いてありますが、なるべく TypeScript 特有の書き方は避けてあります。

## 純粋関数とは
この解説の本題にもありますが、純粋関数とはなんでしょうか。それは、次のふたつの特徴を持った関数のことです。
```
- 同じ引数であれば、同じ結果を返す
- 副作用が発生しない
```
この特徴の内、同じ引数であれば、同じ結果を返すというのは参照透過性と呼ばれる特性です。ある関数の引数に同じものを渡せば、その返り値は必ず同じになるというものです。つまり入力に対して出力が常に一定になるというものです。

```typescript
function add(x: number, y: number): number {
  return x + y;
}
```

この `add` 関数は2つの引数を受け取り、その和を返す関数ですが、引数 `x`、 `y` に対して返り値は常に一定です。たとえば、 `x` に `3`、 `y` に `5` を渡せば、返り値は絶対 `8` になります。

```typescript
const result = add(3, 5);
console.log(result); // 8
```

これが参照透過性のある関数です。

次に副作用についてです。純粋関数は副作用が発生しません。では、副作用とは何でしょうか。それは関数外に影響を与えてしまうことです。たとえば、グローバル変数の値を変更したり、データベースへの I/O [^io] などです。

```typescript
let count = 0;
function hello() {
  count++;
  console.log('hello');
}
```

この関数は、常に `hello` と出力するので参照透過性は担保されています。しかし、グローバル変数である `count` に変更を加えているので副作用が発生しています。そのため純粋関数ではありません。

つまり、外部への影響を与えない関数が副作用の発生しない関数ということになります。先ほどの `add` 関数は参照透過性があり、副作用も発生していません。そのため `add` 関数は純粋関数となります。

ちなみに、参照透過性が担保されていない関数に次のようなものがあります。

```typescript
function showDate(): void {
  const now = new Date();
  console.log(now.toString());
}
```

この関数は引数を受け取らず、呼び出されると時刻を表示する関数です。コードを見ると、内部で時間を取得しています。この時間を取得する部分がこの関数を純粋関数ではなくしている原因です。なぜなら、関数の実行時間によって出力される時刻が変化するからです。

[^io]: I/O とはインプット・アウトプットの意味

### 純粋関数の意味
関数が純粋である、また関数が純粋ではないということは何を意味しているでしょうか。 `showDate` 関数は純粋関数ではありません。実行時の時間によって出力結果が左右されるからです。言い換えると、時間に依存しているということです。時間依存の関数のため、時間によって出力が変わります。一方で純粋関数である `add` 関数は演算の項となる数値 `x`、 `y` に依存しています。しかし、その依存対象は引数として渡されています。関数の外部から依存対象を渡されているため、関数内部は依存性を生んでいません。つまり、関数が純粋でないということは関数内部に依存性が発生しているということです。

純粋関数は依存性を排していることがわかったところで、先ほどの `showDate` 関数を純粋関数に変換してみましょう。この関数の依存対象は時間でしたね。では時間を引数を通して外部から渡してみましょう。

```typescript
function showDate(now: Date): void {
  console.log(now.toString());
}
```

これで依存対象は引数に渡され、純粋な関数にできました。しかし、ここまで引数を分け、純粋関数化することに意味はあるのでしょうか。それは次の章で解説していきます。

ちなみに、外部ファイルなどからライブラリやモジュールを直接関数内にインポートするような方法は、関数に何の情報も与えていないので依存性となります。関数にとってそれは、重要な処理を行うために、よく分からないものを使うのと同じことなのです。そして、そのよく分からないものは関数にとって大事なものだから捨てることができず依存することになってしまうのです。

```typescript
import { doSomething } from '~/src/sth';

function calculateSomethig() {
  // なぜか上手く計算してくれる
  const data = doSomething();

  return data;
}
```

### 純粋関数の目的
ここまでで、関数を純粋関数に変換しましたが、本当に純粋関数にする必要はあるのでしょうか。
大事ことは関数を純粋関数部分と非純粋関数部分に分割することです。純粋関数と非純粋関数に分割するのは、依存性である不確実な要素を可能な限り排除することであり、保守性を高めることにあります。

具体的には次のような点で保守性が高まります。

```
- テストが容易になる
- バグが減る
- 変更が容易になる
```

まずテストがしやすくなります。参照透過性があるため、入力と出力が一対一で担保されているためテストケースでの負担を減らせます。さらに副作用もないのでテストではエッジケースの入力に集中できます。これによって、テスト作成時の負担を大きく減らせます。

そもそも、時刻や乱数以外で参照透過性が保たれていない関数というのは何が返ってくるのか分からないということなので、怖いですよね。

バグが減るのは、副作用が減るためです。純粋関数にすることにより、関数の不透明な部分、つまり何を行っているか分からない部分が減ります。一番のポイントは、関数を純粋な部分とそうでない部分に分割していくことです。分割することで副作用が発生している部分が明るみになり、結果としてバグが減ります。

```typescript
// 非純粋関数
function generateUserId() {
  // 0 ~ 999 の範囲で乱数取得
  const rand = Math.floor( Math.random() * 1000 );

  // userId を乱数と組み合わせて生成
  const userId = `user_${rand}`;

  return userId;
}

// 純粋関数
function createUser(
  userId: string,
  name: string,
  email: string
): User {
  return new User( // User コンストラクタは純粋関数
    userId,
    name,
    email
  );
}
```

このように、純粋関数とそうでない部分に分けることで、 `createUser` は ID 生成に依存することなく純粋関数となり、より堅牢な関数になります。

変更が容易になるのは、関数の依存部分が引数となったためです。

ちなみに、すべての関数を純粋関数にはできないと考えます。というのも、例にあった時刻であったり、乱数などはどうしても予測できないものだからです。そのため、関数を細かい単位に分け純粋関数と非純粋関数に分割することで、予測できないランダム性の範囲を縮小させることが大切です。

## 依存性注入
依存性注入は、あるクラスや関数内で依存しているクラスや関数があり、それをコンストラクタなど [^dis] 外部から渡すことで依存性を減らすということです。やっていることは、純粋関数で依存対象を引数から渡すことで内部の純粋性を保つこととまったく同じですね。依存するものを外部から渡しているから依存性注入なのです。
なぜコンストラクタに依存対象を渡すことが DI になるのかは後に記述してあります。

依存性注入は英語で Dependency Injection と言い、頭文字をとり DI と表現されます。依存性注入は特に MVC や DDD などのアーキテクチャと絡んで話題になることが多いです。

MVC モデルで作られたコードを元にユーザー取得するコードをサンプルとして見てみましょう。

```typescript
import { UserRepository } from '~/repository/user';

class UserService {
  constructor() {}

  async getUser(userId: string): Promise<User> {
    // DB から User 取得
    const user = await UserRepository.findById(userId);

    // user が見つからなければ、エラー
    if (user === null) throw new Error('not found user');

    return user;
  }
}
```

一見何の問題もないように感じるコードですが、依存性が生じている箇所があります。それが、 `UserRepository` です。この `UserService` は `UserRepository` なしに成り立つことはできません。そして、クラス外部から直接インポートしているため、変更やテストがしづらい状態です。別の言い方をすれば、クラスどうしが密結合している状態です。

この依存性を解消するために、クラスではコンストラクタで `UserRepository` を渡すのが手っ取り早い解決です。

```typescript
import { UserRepository } from '~/repository/user';

class UserService {
  userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async getUser(userId: string): Promise<User> {
    // DB から User 取得
    const user = await UserRepository.findById(userId);

    // user が見つからなければ、エラー
    if (user === null) throw new Error('not found user');

    return user;
  }
}
```

これで DI できました。こうすることで、特にユニットテストがやりやすくなりましたね。

<br>

#### コンストラクタによる DI はできるのか
ここは本題ではなく、コンストラクタに関する説明なので飛ばしていただいても問題ありません。コンストラクタに依存対象を渡すことが、なぜ依存性注入になるのかを解説します。
コンストラクタがクラスにおいて、関数に対する引数と同じような役割を果たします。結論からいうと、クラスはコンストラクタにより作られるクロージャ [^closure] に閉じ込められたオブジェクトや関数のまとまりだからです。
クラスはコンストラクタによりインスタンス化されますが、それは生成されたクロージャを使うのと同じことです。

次の Circle クラスを関数とオブジェクトで表現してみます。
```typescript
class Circle {

  radius: number;

  constructor(radius: number) {
    this.radius = radius;
  }

  getArea() {
    return radius * radius * Math.PI;
  }

}

const circle = new Circle(3);
console.log(circle.getArea()); // 28.274333882308138
```

関数とオブジェクトで表したものがこれです。
```typescript
function circleConstructor(radius: number) {
  return {
    getArea: () => {
      return radius * radius * Math.PI;
    }
  };
}

const circle = circleConstructor(3);
console.log(circle.getArea()); // 28.274333882308138
```

このように、クラスとはクロージャに閉じ込められた関数などが元になっており、そのクロージャはコンストラクタにより生成されます。これはメンバー変数も同様です。そのため、コンストラクタは関数における引数と同じ役割を持ち、依存対象を渡すことで DI となります。

クロージャとクラスについてより詳しく知りたい方は次を参照してください。 <br>
<https://m-hiyama.hatenablog.com/entry/20151209/1449621856>

[^dis]: DI には種類があり、 <br>
        - `Interface Injection` <br>
        - `Setter Injection` <br>
        - `Constructor Injection` <br>
        があります。 <br>
        <https://qiita.com/iTakahiro/items/353a11f6c9d2a927158d#di%E3%81%AB%E3%81%AF%E7%A8%AE%E9%A1%9E%E3%81%8C%E3%81%82%E3%82%8B>

[^closure]: <https://developer.mozilla.org/ja/docs/Glossary/Closure>

## 抽象に依存
今までは、依存対象そのものに焦点をあてていましたが、少しマクロな視点でみてみましょう。次に対象そのものの依存性から、手段の依存性をみていきます。私たちはコードに限らず、具体的な手段に依存すると、その手段に縛られ身動きが取れなくなります。そのため、常に一段階上にある抽象度に依存し、手段をいつでも変更可能にします。

関数やクラスが他の関数やクラスと連携するとき、大事なのが型やインタフェースです。これらは、入力と出力の枠組みを知らせてくれます。しかし、その入力と出力に挟まれた具体的な処理内容は伝えません。それは相手に伝える必要のない情報だからです。相手からすれば、関数を使うのに何が必要（入力）で、何が出てくるのか（出力）さえ分かれば十分なのです。不必要な情報は与えなくてよいですし、与えたところでその情報に縛られては本末転倒なのです。なぜなら、互いに独立させ処理を分散、疎結合させているのに具体的な情報を知り、密結合してしまうからです。具体的な情報を隠すことで、内部の処理を変更しやすくしているのです。

たとえば、 MVC や DDD などで Repository というのは大抵 DB からデータを取得するためにあります。そして、それを呼び出す上位の層は Service などですが、果たして Service が Repository が如何にしてデータを取得しているかを知る必要があるでしょうか。答えは否です。上位層が下位層の具体的な、詳細な情報を知っているというのは手段に依存してしまっているのです。

O/R マッパ [^ormap] を使用している環境であれば、 `Prisma` [^prisma] から `TypeORM` [^typeorm] に変更したり、そもそも RDB から NoSQL に変更したりといったことが起こりえます。そのような状況で、詳細に依存、つまり特定の手段に依存しているコードだと変更が困難です。

[^ormap]: <https://e-words.jp/w/O-R%E3%83%9E%E3%83%83%E3%83%94%E3%83%B3%E3%82%B0.html>
[^prisma]: <https://www.prisma.io/>
[^typeorm]: <https://typeorm.io/>

```typescript
class UserRepository implement IUserRepository {
  constructor() {}

  // prisma は、 JavaScript/TypeScript 向けの O/R マッパ
  async findById(prisma: PrismaClient, id: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: id
      }
    });

    return user;
  }
}

interface IUserRepository {
  findById: (
    prisma: PrismaClient,
    id: string
  ) => Promise<User>;
}
```

このコードは ID からユーザーを取得するリポジトリの一部ですが、 `findById` 関数は `prisma` を指定しています。これは、ユーザーを取得する方法を指定している関数であり、上位の Service 層にそれを知らせてしまっています。これが、 Service が Repository の詳細に依存している状態です。

そのため、 Repository は手段を隠蔽する必要があります。

```typescript
class UserRepository implement IUserRepository {
  prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: id
      }
    });

    return user;
  }
}

interface IUserRepository {
  findById: (
    id: string
  ) => Promise<User>;
}
```

これですることで、不必要な情報は隠され変更が容易なコードにできました。

## まとめ
純粋関数は、依存性を外部に追い出すことで関数内部を副作用がなく、入出力が一対一に対応する状態に保つことができます。それは依存性注入において通ずる考えです。依存性注入は、関数やクラスに発生している依存性を外部から、たとえば引数やコンストラクタから渡す形で注入することです。これらはすべて保守性や変更容易性を保つためにあり、より変更容易性を上げる方法として、抽象に依存させるというものがありました。

純粋関数の考えは依存性注入と共通する考えであり、きれいなコードを作るのならば必要なものです。発想自体はとてもシンプルで当たり前ですが、大切な考えです。この記事が少しでも依存性に対する理解の助けになれば幸いです。

最後までお付き合いくださりありがとうございました。
