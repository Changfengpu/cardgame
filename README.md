# 卡牌买卖模拟器

这是一个基于Spring Boot的卡牌买卖模拟器后端项目，实现了卡牌购买、开包、收集和出售等功能。

## 项目结构

```
src/main/java/com/singhand/cardgame/
├── model/          # 实体类
│   ├── Card.java           # 卡牌实体
│   ├── CardPack.java       # 卡牌包实体
│   └── Player.java         # 玩家实体
├── service/        # 服务层
│   └── GameService.java    # 游戏逻辑服务
├── controller/     # 控制器层
│   └── GameController.java # REST API控制器
├── config/         # 配置类
│   └── DataInitializer.java # 数据初始化
├── util/           # 工具类
│   └── CardDataGenerator.java # 卡牌数据生成器
└── simple/         # 简化版本（无依赖）
    └── SimpleCardGame.java  # 纯Java实现
```

## 功能特性

1. **玩家系统**
   - 创建用户角色
   - 金币管理（初始100金币）
   - 同一用户数据共享

2. **卡牌包系统**
   - 四种卡牌包等级：普通、稀有、史诗、传说
   - 不同的价格和开出概率
   - 闪卡和变异概率

3. **卡牌系统**
   - 四种稀有度：普通、稀有、史诗、传说
   - 闪卡和变异属性
   - 动态价格计算

4. **游戏功能**
   - 购买卡牌包
   - 开卡牌包（每次5张）
   - 查看卡牌册
   - 查看背包
   - 出售卡牌

## API接口

### 玩家相关
- `POST /api/game/player/create?username={username}` - 创建玩家
- `GET /api/game/player/{username}` - 获取玩家信息
- `GET /api/game/player/{username}/money` - 查看金币

### 卡牌包相关
- `POST /api/game/player/{username}/buy-pack?packType={PACK_TYPE}` - 购买卡牌包
- `POST /api/game/player/{username}/open-pack?packId={packId}` - 开卡牌包
- `GET /api/game/player/{username}/backpack` - 查看背包
- `GET /api/game/pack-types` - 查看卡牌包类型

### 卡牌相关
- `POST /api/game/player/{username}/sell-card?cardId={cardId}` - 卖卡牌
- `GET /api/game/player/{username}/collection` - 查看卡牌册
- `GET /api/game/cards` - 查看所有卡牌

## 卡牌包类型和价格

| 等级 | 价格 | 普通概率 | 稀有概率 | 史诗概率 | 传说概率 | 闪卡概率 | 变异概率 |
|------|------|----------|----------|----------|----------|----------|----------|
| 普通 | 20   | 90%      | 5%       | 2%       | 1%       | 0%       | 0%       |
| 稀有 | 50   | 80%      | 13%      | 6%       | 1%       | 1%       | 1%       |
| 史诗 | 100  | 70%      | 20%      | 9%       | 1%       | 2%       | 2%       |
| 传说 | 200  | 60%      | 25%      | 12%      | 3%       | 3%       | 3%       |

## 卡牌价格计算

- **基础价格**：根据稀有度设定
- **闪卡加成**：基础价格 × 10
- **变异加成**：基础价格 × 20
- **随机浮动**：基础价格的0.5-1.5倍
- **最终价格**：保留2位小数

## 运行方式

### 1. 完整Spring Boot版本（需要Maven）

```bash
# 使用Maven编译和运行
mvn clean compile
mvn spring-boot:run
```

访问 localhost:8080 即可体验游戏

### 2. 简化版本（无依赖）

```bash
# 编译并运行简化版本
javac -cp "src/main/java" src/main/java/com/singhand/cardgame/simple/SimpleCardGame.java
java -cp "src/main/java" com.singhand.cardgame.simple.SimpleCardGame
```

## 数据存储

- 所有数据存储在内存中
- 程序启动时从`cards_data.txt`加载卡牌数据
- 如果文件不存在，使用默认卡牌数据

## 示例用法

### 简化版本示例

```java
SimpleCardGame game = new SimpleCardGame();

// 创建玩家
Player player = game.createPlayer("testPlayer");

// 购买卡牌包
game.buyCardPack("testPlayer", CardPack.PackType.COMMON);

// 开卡牌包
long packId = player.getBackpack().get(0).getId();
List<Card> cards = game.openCardPack("testPlayer", packId);

// 卖卡牌
long cardId = cards.get(0).getId();
game.sellCard("testPlayer", cardId);
```

### REST API示例

```bash
# 创建玩家
curl -X POST "http://localhost:8080/api/game/player/create?username=testPlayer"

# 购买卡牌包
curl -X POST "http://localhost:8080/api/game/player/testPlayer/buy-pack?packType=COMMON"

# 开卡牌包
curl -X POST "http://localhost:8080/api/game/player/testPlayer/open-pack?packId=1"

# 查看卡牌册
curl -X GET "http://localhost:8080/api/game/player/testPlayer/collection"
```

## 注意事项

1. 这是一个轻量级项目，不考虑数据库持久化
2. 所有数据存储在内存中，重启后数据会丢失
3. 卡牌数据文件`cards_data.txt`需要手动创建或使用默认数据
4. 项目使用Java 8和Spring Boot 2.6.13

## 扩展建议

1. 添加数据库支持（MySQL、PostgreSQL等）
2. 实现用户认证和授权
3. 添加卡牌交易市场
4. 实现卡牌战斗系统
5. 添加成就和排行榜系统
