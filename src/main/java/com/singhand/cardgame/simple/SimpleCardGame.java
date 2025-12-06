package com.singhand.cardgame.simple;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;

public class SimpleCardGame {
    
    public static class Card {
        private Long id;
        private String serialNumber;
        private String fixedName;
        private String actualName;
        private Rarity rarity;
        private boolean isShiny;
        private boolean isVariant;
        private VariantType variantType;
        private String description;
        private double basePrice;
        private double actualPrice;
        
        public enum Rarity {
            COMMON("普通"),
            RARE("稀有"),
            EPIC("史诗"),
            LEGENDARY("传说");
            
            private final String displayName;
            
            Rarity(String displayName) {
                this.displayName = displayName;
            }
            
            public String getDisplayName() {
                return displayName;
            }
        }
        
        public enum VariantType {
            WHITE("白卡"),
            BLACK("黑卡");
            
            private final String displayName;
            
            VariantType(String displayName) {
                this.displayName = displayName;
            }
            
            public String getDisplayName() {
                return displayName;
            }
        }
        
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getSerialNumber() { return serialNumber; }
        public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
        
        public String getFixedName() { return fixedName; }
        public void setFixedName(String fixedName) { this.fixedName = fixedName; }
        
        public String getActualName() { return actualName; }
        public void setActualName(String actualName) { this.actualName = actualName; }
        
        public Rarity getRarity() { return rarity; }
        public void setRarity(Rarity rarity) { this.rarity = rarity; }
        
        public boolean isShiny() { return isShiny; }
        public void setShiny(boolean shiny) { isShiny = shiny; }
        
        public boolean isVariant() { return isVariant; }
        public void setVariant(boolean variant) { isVariant = variant; }
        
        public VariantType getVariantType() { return variantType; }
        public void setVariantType(VariantType variantType) { this.variantType = variantType; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public double getBasePrice() { return basePrice; }
        public void setBasePrice(double basePrice) { this.basePrice = basePrice; }
        
        public double getActualPrice() { return actualPrice; }
        public void setActualPrice(double actualPrice) { this.actualPrice = actualPrice; }
        
        public void generateActualName() {
            StringBuilder nameBuilder = new StringBuilder();
            
            if (isVariant && variantType != null) {
                nameBuilder.append(variantType.getDisplayName()).append("·");
            }
            
            if (isShiny) {
                nameBuilder.append("闪·");
            }
            
            nameBuilder.append(fixedName);
            actualName = nameBuilder.toString();
        }
        
        public void calculateActualPrice() {
            double priceMultiplier = 1.0;
            
            if (isShiny) {
                priceMultiplier *= 10.0;
            }
            
            if (isVariant) {
                priceMultiplier *= 20.0;
            }
            
            double randomFactor = 0.5 + Math.random() * 1.5;
            actualPrice = Math.round(basePrice * priceMultiplier * randomFactor * 100.0) / 100.0;
        }
    }
    
    public static class CardPack {
        private Long id;
        private PackType packType;
        private int price;
        
        public enum PackType {
            COMMON("普通卡牌包", 20, 
                    new double[]{0.90, 0.05, 0.02, 0.01}, 
                    0.0, 0.0),
            RARE("稀有卡牌包", 50, 
                    new double[]{0.80, 0.13, 0.06, 0.01}, 
                    0.01, 0.01),
            EPIC("史诗卡牌包", 100, 
                    new double[]{0.70, 0.20, 0.09, 0.01}, 
                    0.02, 0.02),
            LEGENDARY("传说卡牌包", 200, 
                    new double[]{0.60, 0.25, 0.12, 0.03}, 
                    0.03, 0.03);
            
            private final String displayName;
            private final int price;
            private final double[] rarityProbabilities;
            private final double shinyProbability;
            private final double variantProbability;
            
            PackType(String displayName, int price, double[] rarityProbabilities, 
                    double shinyProbability, double variantProbability) {
                this.displayName = displayName;
                this.price = price;
                this.rarityProbabilities = rarityProbabilities;
                this.shinyProbability = shinyProbability;
                this.variantProbability = variantProbability;
            }
            
            public String getDisplayName() {
                return displayName;
            }
            
            public int getPrice() {
                return price;
            }
            
            public double[] getRarityProbabilities() {
                return rarityProbabilities;
            }
            
            public double getShinyProbability() {
                return shinyProbability;
            }
            
            public double getVariantProbability() {
                return variantProbability;
            }
        }
        
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public PackType getPackType() { return packType; }
        public void setPackType(PackType packType) { this.packType = packType; }
        
        public int getPrice() { return price; }
        public void setPrice(int price) { this.price = price; }
        
        public CardPack(PackType packType) {
            this.packType = packType;
            this.price = packType.getPrice();
        }
    }
    
    public static class Player {
        private String username;
        private double money;
        private List<Card> cardCollection;
        private List<CardPack> backpack;
        
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public double getMoney() { return money; }
        public void setMoney(double money) { this.money = money; }
        
        public List<Card> getCardCollection() { return cardCollection; }
        public void setCardCollection(List<Card> cardCollection) { this.cardCollection = cardCollection; }
        
        public List<CardPack> getBackpack() { return backpack; }
        public void setBackpack(List<CardPack> backpack) { this.backpack = backpack; }
        
        public Player(String username) {
            this.username = username;
            this.money = 100.0;
            this.cardCollection = new ArrayList<>();
            this.backpack = new ArrayList<>();
        }
        
        public boolean buyCardPack(CardPack.PackType packType, long packId) {
            if (money >= packType.getPrice()) {
                money -= packType.getPrice();
                CardPack pack = new CardPack(packType);
                pack.setId(packId);
                backpack.add(pack);
                return true;
            }
            return false;
        }
        
        public CardPack openCardPack(long packId) {
            for (int i = 0; i < backpack.size(); i++) {
                if (backpack.get(i).getId() == packId) {
                    return backpack.remove(i);
                }
            }
            return null;
        }
        
        public boolean sellCard(long cardId) {
            for (int i = 0; i < cardCollection.size(); i++) {
                if (cardCollection.get(i).getId() == cardId) {
                    Card card = cardCollection.remove(i);
                    money += card.getActualPrice();
                    return true;
                }
            }
            return false;
        }
    }
    
    private Map<String, Player> players = new HashMap<>();
    private List<Card> allCards = new ArrayList<>();
    private AtomicLong cardIdGenerator = new AtomicLong(1);
    private AtomicLong packIdGenerator = new AtomicLong(1);
    private Random random = new Random();
    
    public Player createPlayer(String username) {
        Player player = new Player(username);
        players.put(username, player);
        return player;
    }
    
    public Player getPlayer(String username) {
        return players.get(username);
    }
    
    public boolean buyCardPack(String username, CardPack.PackType packType) {
        Player player = players.get(username);
        if (player != null) {
            return player.buyCardPack(packType, packIdGenerator.getAndIncrement());
        }
        return false;
    }
    
    public List<Card> openCardPack(String username, long packId) {
        Player player = players.get(username);
        if (player != null) {
            CardPack pack = player.openCardPack(packId);
            if (pack != null) {
                List<Card> cards = generateCardsFromPack(pack);
                player.getCardCollection().addAll(cards);
                return cards;
            }
        }
        return null;
    }
    
    public boolean sellCard(String username, long cardId) {
        Player player = players.get(username);
        if (player != null) {
            return player.sellCard(cardId);
        }
        return false;
    }
    
    private List<Card> generateCardsFromPack(CardPack pack) {
        List<Card> cards = new ArrayList<>();
        CardPack.PackType packType = pack.getPackType();
        double[] rarityProbs = packType.getRarityProbabilities();
        
        for (int i = 0; i < 5; i++) {
            Card.Rarity rarity = determineRarity(rarityProbs);
            boolean isShiny = random.nextDouble() < packType.getShinyProbability();
            boolean isVariant = random.nextDouble() < packType.getVariantProbability();
            
            Card.VariantType variantType = null;
            if (isVariant) {
                variantType = random.nextDouble() < 0.5 ? Card.VariantType.WHITE : Card.VariantType.BLACK;
            }
            
            Card card = createRandomCard(rarity, isShiny, isVariant, variantType);
            cards.add(card);
        }
        
        return cards;
    }
    
    private Card.Rarity determineRarity(double[] probabilities) {
        double randomValue = random.nextDouble();
        double cumulative = 0.0;
        
        for (int i = 0; i < probabilities.length; i++) {
            cumulative += probabilities[i];
            if (randomValue < cumulative) {
                switch (i) {
                    case 0: return Card.Rarity.COMMON;
                    case 1: return Card.Rarity.RARE;
                    case 2: return Card.Rarity.EPIC;
                    case 3: return Card.Rarity.LEGENDARY;
                }
            }
        }
        
        return Card.Rarity.COMMON;
    }
    
    private Card createRandomCard(Card.Rarity rarity, boolean isShiny, boolean isVariant, Card.VariantType variantType) {
        Card card = new Card();
        card.setId(cardIdGenerator.getAndIncrement());
        card.setSerialNumber("CARD-" + card.getId());
        card.setRarity(rarity);
        card.setShiny(isShiny);
        card.setVariant(isVariant);
        card.setVariantType(variantType);
        
        List<Card> cardsByRarity = getCardsByRarity(rarity);
        if (!cardsByRarity.isEmpty()) {
            Card templateCard = cardsByRarity.get(random.nextInt(cardsByRarity.size()));
            card.setFixedName(templateCard.getFixedName());
            card.setDescription(templateCard.getDescription());
            card.setBasePrice(templateCard.getBasePrice());
        }
        
        card.generateActualName();
        card.calculateActualPrice();
        
        return card;
    }
    
    private List<Card> getCardsByRarity(Card.Rarity rarity) {
        List<Card> result = new ArrayList<>();
        for (Card card : allCards) {
            if (card.getRarity() == rarity) {
                result.add(card);
            }
        }
        return result;
    }
    
    public void initializeCards(List<Card> cards) {
        allCards.clear();
        allCards.addAll(cards);
    }
    
    public List<Card> getAllCards() {
        return new ArrayList<>(allCards);
    }
    
    public static void main(String[] args) {
        SimpleCardGame game = new SimpleCardGame();
        
        // 初始化一些示例卡牌
        List<Card> sampleCards = new ArrayList<>();
        long id = 1;
        
        // 添加一些普通卡牌
        for (int i = 0; i < 10; i++) {
            Card card = new Card();
            card.setId(id++);
            card.setSerialNumber("COMMON-" + String.format("%04d", i));
            card.setFixedName("普通卡牌" + i);
            card.setRarity(Card.Rarity.COMMON);
            card.setDescription("这是一张普通卡牌");
            card.setBasePrice(1.0 + Math.random() * 4.0);
            // 注意：模板卡牌不需要调用generateActualName()和calculateActualPrice()
            // 这些应该在真正抽取卡牌时调用
            sampleCards.add(card);
        }
        
        // 添加一些稀有卡牌
        for (int i = 0; i < 5; i++) {
            Card card = new Card();
            card.setId(id++);
            card.setSerialNumber("RARE-" + String.format("%04d", i));
            card.setFixedName("稀有卡牌" + i);
            card.setRarity(Card.Rarity.RARE);
            card.setDescription("这是一张稀有卡牌");
            card.setBasePrice(10.0 + Math.random() * 40.0);
            // 注意：模板卡牌不需要调用generateActualName()和calculateActualPrice()
            // 这些应该在真正抽取卡牌时调用
            sampleCards.add(card);
        }
        
        game.initializeCards(sampleCards);
        
        // 创建玩家
        Player player = game.createPlayer("testPlayer");
        System.out.println("创建玩家: " + player.getUsername() + ", 金币: " + player.getMoney());
        
        // 购买卡牌包
        boolean success = game.buyCardPack("testPlayer", CardPack.PackType.COMMON);
        System.out.println("购买普通卡牌包: " + (success ? "成功" : "失败"));
        System.out.println("剩余金币: " + player.getMoney());
        System.out.println("背包中的卡牌包数量: " + player.getBackpack().size());
        
        // 开卡牌包
        if (!player.getBackpack().isEmpty()) {
            long packId = player.getBackpack().get(0).getId();
            List<Card> openedCards = game.openCardPack("testPlayer", packId);
            if (openedCards != null) {
                System.out.println("开出的卡牌:");
                for (Card card : openedCards) {
                    System.out.println("- " + card.getActualName() + " (" + card.getRarity().getDisplayName() + 
                                     ", 闪卡:" + card.isShiny() + ", 变异:" + card.isVariant() + 
                                     ", 价格:" + card.getActualPrice() + ")");
                }
                System.out.println("卡牌册中的卡牌数量: " + player.getCardCollection().size());
            }
        }
        
        // 卖卡牌
        if (!player.getCardCollection().isEmpty()) {
            long cardId = player.getCardCollection().get(0).getId();
            boolean sellSuccess = game.sellCard("testPlayer", cardId);
            System.out.println("出售卡牌: " + (sellSuccess ? "成功" : "失败"));
            System.out.println("当前金币: " + player.getMoney());
        }
        
        System.out.println("\n游戏演示完成！");
        System.out.println("API接口说明:");
        System.out.println("1. 创建玩家: createPlayer(username)");
        System.out.println("2. 购买卡牌包: buyCardPack(username, packType)");
        System.out.println("3. 开卡牌包: openCardPack(username, packId)");
        System.out.println("4. 卖卡牌: sellCard(username, cardId)");
        System.out.println("5. 查看玩家信息: getPlayer(username)");
        System.out.println("6. 查看所有卡牌: getAllCards()");
    }
}