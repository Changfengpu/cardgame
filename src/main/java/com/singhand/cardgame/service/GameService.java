package com.singhand.cardgame.service;

import com.singhand.cardgame.model.Card;
import com.singhand.cardgame.model.CardPack;
import com.singhand.cardgame.model.Player;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class GameService {
    private final Map<String, Player> players = new ConcurrentHashMap<>();
    private final List<Card> allCards = new ArrayList<>();
    private final AtomicLong cardIdGenerator = new AtomicLong(1);
    private final AtomicLong packIdGenerator = new AtomicLong(1);
    
    // 作弊功能设置
    private final Map<String, Boolean> cheatSettings = new ConcurrentHashMap<>();
    
    public Player createPlayer(String username) {
        Player player = new Player(username);
        players.put(username, player);
        return player;
    }
    
    public Player createPlayer(String username, double initialMoney) {
        Player player = new Player(username);
        player.setMoney(initialMoney);
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
    
    public Map<String, Object> buyCardPacksBatch(String username, CardPack.PackType packType, int quantity) {
        Map<String, Object> result = new HashMap<>();
        Player player = players.get(username);
        
        if (player == null) {
            result.put("success", false);
            result.put("message", "玩家不存在");
            return result;
        }
        
        // 计算总价格
        double totalPrice = packType.getPrice() * quantity;
        
        // 检查金币是否足够
        if (player.getMoney() < totalPrice) {
            result.put("success", false);
            result.put("message", "金币不足");
            result.put("required", totalPrice);
            result.put("available", player.getMoney());
            return result;
        }
        
        // 扣除金币
        player.setMoney(player.getMoney() - totalPrice);
        
        // 批量添加卡牌包到背包
        int successCount = 0;
        for (int i = 0; i < quantity; i++) {
            if (player.buyCardPack(packType, packIdGenerator.getAndIncrement(), false)) {
                successCount++;
            }
        }
        
        result.put("success", true);
        result.put("message", String.format("成功购买 %d 个卡牌包", successCount));
        result.put("quantity", successCount);
        result.put("totalPrice", totalPrice);
        result.put("remainingMoney", player.getMoney());
        
        return result;
    }
    
    public List<Card> openCardPack(String username, long packId) {
        Player player = players.get(username);
        if (player != null) {
            CardPack pack = player.openCardPack(packId);
            if (pack != null) {
                List<Card> cards = generateCardsFromPack(pack, username);
                player.getCardCollection().addAll(cards);
                return cards;
            }
        }
        return null;
    }
    
    public Map<String, Object> openCardPacksBatch(String username, CardPack.PackType packType, String quantity) {
        Map<String, Object> result = new HashMap<>();
        Player player = players.get(username);
        
        if (player == null) {
            result.put("success", false);
            result.put("message", "玩家不存在");
            return result;
        }
        
        // 获取指定类型的所有卡牌包
        List<CardPack> packsToOpen = new ArrayList<>();
        List<Long> packIdsToRemove = new ArrayList<>();
        
        for (int i = 0; i < player.getBackpack().size(); i++) {
            CardPack pack = player.getBackpack().get(i);
            if (pack.getPackType() == packType) {
                packsToOpen.add(pack);
                packIdsToRemove.add(pack.getId());
            }
        }
        
        if (packsToOpen.isEmpty()) {
            result.put("success", false);
            result.put("message", "没有找到指定类型的卡牌包");
            return result;
        }
        
        // 确定要开启的数量
        int openCount = packsToOpen.size();
        if (!quantity.equals("all")) {
            try {
                int requestedCount = Integer.parseInt(quantity);
                openCount = Math.min(requestedCount, packsToOpen.size());
            } catch (NumberFormatException e) {
                // 如果解析失败，默认开启所有
            }
        }
        
        // 批量开启卡牌包
        List<Card> allCards = new ArrayList<>();
        for (int i = 0; i < openCount; i++) {
            CardPack pack = packsToOpen.get(i);
            List<Card> cards = generateCardsFromPack(pack, username);
            allCards.addAll(cards);
        }
        
        // 从背包中移除已开启的卡牌包
        for (int i = 0; i < openCount; i++) {
            player.openCardPack(packIdsToRemove.get(i));
        }
        
        // 将卡牌添加到玩家收藏
        player.getCardCollection().addAll(allCards);
        
        // 按稀有度和价格排序
        allCards.sort((a, b) -> {
            // 先按稀有度排序
            int rarityCompare = b.getRarity().ordinal() - a.getRarity().ordinal();
            if (rarityCompare != 0) {
                return rarityCompare;
            }
            // 同稀有度按价格排序（高价格在前）
            return Double.compare(b.getActualPrice(), a.getActualPrice());
        });
        
        result.put("success", true);
        result.put("message", String.format("成功开启 %d 个卡牌包，获得 %d 张卡牌", openCount, allCards.size()));
        result.put("packsOpened", openCount);
        result.put("cards", allCards);
        result.put("remainingPacks", player.getBackpack().size());
        
        return result;
    }
    
    public boolean sellCard(String username, long cardId) {
        Player player = players.get(username);
        if (player != null) {
            return player.sellCard(cardId);
        }
        return false;
    }
    
    public Map<String, Object> sellCardsBatch(String username, List<Long> cardIds) {
        Map<String, Object> result = new HashMap<>();
        List<Long> successfulIds = new ArrayList<>();
        List<String> failedIds = new ArrayList<>();
        double totalValue = 0.0;
        
        Player player = players.get(username);
        if (player == null) {
            result.put("success", false);
            result.put("message", "玩家不存在");
            return result;
        }
        
        for (Long cardId : cardIds) {
            if (player.sellCard(cardId)) {
                successfulIds.add(cardId);
            } else {
                failedIds.add(String.valueOf(cardId));
            }
        }
        
        result.put("success", !successfulIds.isEmpty());
        result.put("soldCount", successfulIds.size());
        result.put("failedCount", failedIds.size());
        result.put("successfulIds", successfulIds);
        result.put("failedIds", failedIds);
        result.put("totalValue", totalValue);
        
        if (!successfulIds.isEmpty()) {
            result.put("message", String.format("成功出售 %d 张卡牌", successfulIds.size()));
        } else {
            result.put("message", "没有卡牌被出售");
        }
        
        return result;
    }
    
    public List<Card> generateCardsFromPack(CardPack pack) {
        List<Card> cards = new ArrayList<>();
        CardPack.PackType packType = pack.getPackType();
        double[] rarityProbs = packType.getRarityProbabilities();
        
        // 获取卡牌包的所有者（这里需要从调用处传递username，暂时用null）
        // 在实际调用时，会传递正确的username
        String username = null;
        
        for (int i = 0; i < 5; i++) {
            Card.Rarity rarity;
            boolean isShiny;
            boolean isVariant;
            
            // 检查作弊设置
            if (username != null) {
                // 必定传说卡
                if (isGuaranteedLegendary(username)) {
                    rarity = Card.Rarity.LEGENDARY;
                } else {
                    rarity = determineRarity(rarityProbs);
                }
                
                // 必定闪卡
                if (isGuaranteedShiny(username)) {
                    isShiny = true;
                } else {
                    isShiny = Math.random() < packType.getShinyProbability();
                }
                
                // 必定变异卡
                if (isGuaranteedVariant(username)) {
                    isVariant = true;
                } else {
                    isVariant = Math.random() < packType.getVariantProbability();
                }
            } else {
                // 没有用户名时使用正常逻辑
                rarity = determineRarity(rarityProbs);
                isShiny = Math.random() < packType.getShinyProbability();
                isVariant = Math.random() < packType.getVariantProbability();
            }
            
            Card.VariantType variantType = null;
            if (isVariant) {
                variantType = Math.random() < 0.5 ? Card.VariantType.WHITE : Card.VariantType.BLACK;
            }
            
            Card card = createRandomCard(rarity, isShiny, isVariant, variantType);
            cards.add(card);
        }
        
        return cards;
    }
    
    // 重载方法，支持传递用户名
    public List<Card> generateCardsFromPack(CardPack pack, String username) {
        List<Card> cards = new ArrayList<>();
        CardPack.PackType packType = pack.getPackType();
        double[] rarityProbs = packType.getRarityProbabilities();
        
        for (int i = 0; i < 5; i++) {
            Card.Rarity rarity;
            boolean isShiny;
            boolean isVariant;
            
            // 检查作弊设置
            if (isGuaranteedLegendary(username)) {
                rarity = Card.Rarity.LEGENDARY;
            } else {
                rarity = determineRarity(rarityProbs);
            }
            
            // 必定闪卡
            if (isGuaranteedShiny(username)) {
                isShiny = true;
            } else {
                isShiny = Math.random() < packType.getShinyProbability();
            }
            
            // 必定变异卡
            if (isGuaranteedVariant(username)) {
                isVariant = true;
            } else {
                isVariant = Math.random() < packType.getVariantProbability();
            }
            
            Card.VariantType variantType = null;
            if (isVariant) {
                variantType = Math.random() < 0.5 ? Card.VariantType.WHITE : Card.VariantType.BLACK;
            }
            
            Card card = createRandomCard(rarity, isShiny, isVariant, variantType);
            cards.add(card);
        }
        
        return cards;
    }
    
    private static Card.Rarity determineRarity(double[] probabilities) {
        double random = Math.random();
        double cumulative = 0.0;
        
        for (int i = 0; i < probabilities.length; i++) {
            cumulative += probabilities[i];
            if (random < cumulative) {
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
        card.setIsShiny(isShiny);
        card.setIsVariant(isVariant);
        card.setVariantType(variantType);
        
        List<Card> cardsByRarity = getCardsByRarity(rarity);
        if (!cardsByRarity.isEmpty()) {
            Card templateCard = cardsByRarity.get((int)(Math.random() * cardsByRarity.size()));
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
        System.out.println("查找稀有度: " + rarity + ", 总卡牌数: " + allCards.size());
        for (Card card : allCards) {
            if (card.getRarity().equals(rarity)) {
                result.add(card);
            }
        }
        System.out.println("找到匹配卡牌数: " + result.size());
        return result;
    }
    
    public void initializeCards(List<Card> cards) {
        allCards.clear();
        allCards.addAll(cards);
        System.out.println("GameService初始化卡牌: " + cards.size() + " 张");
    }
    
    public List<Map<String, Object>> getLeaderboard() {
        List<Map<String, Object>> allPlayerCards = new ArrayList<>();
        
        // 收集所有玩家的卡牌
        for (Map.Entry<String, Player> entry : players.entrySet()) {
            String username = entry.getKey();
            Player player = entry.getValue();
            
            if (player.getCardCollection() != null) {
                for (Card card : player.getCardCollection()) {
                    Map<String, Object> cardEntry = new HashMap<>();
                    cardEntry.put("cardId", card.getId());
                    cardEntry.put("cardName", card.getActualName() != null ? card.getActualName() : card.getFixedName());
                    cardEntry.put("serialNumber", card.getSerialNumber());
                    cardEntry.put("rarity", card.getRarity());
                    cardEntry.put("isShiny", card.getIsShiny());
                    cardEntry.put("isVariant", card.getIsVariant());
                    cardEntry.put("variantType", card.getVariantType());
                    cardEntry.put("description", card.getDescription());
                    cardEntry.put("actualPrice", card.getActualPrice());
                    cardEntry.put("basePrice", card.getBasePrice());
                    cardEntry.put("playerName", username);
                    allPlayerCards.add(cardEntry);
                }
            }
        }
        
        // 按价格降序排序
        allPlayerCards.sort((a, b) -> {
            Double priceA = (Double) a.get("actualPrice");
            Double priceB = (Double) b.get("actualPrice");
            return priceB.compareTo(priceA);
        });
        
        // 返回前100名
        int topCount = Math.min(100, allPlayerCards.size());
        return allPlayerCards.subList(0, topCount);
    }
    
    public List<Card> getAllCards() {
        return new ArrayList<>(allCards);
    }
    
    // 作弊功能相关方法
    public boolean isGuaranteedLegendary(String username) {
        return cheatSettings.getOrDefault(username + "_legendary", false);
    }
    
    public boolean isGuaranteedShiny(String username) {
        return cheatSettings.getOrDefault(username + "_shiny", false);
    }
    
    public boolean isGuaranteedVariant(String username) {
        return cheatSettings.getOrDefault(username + "_variant", false);
    }
    
    public void updateCheatSettings(String username, boolean guaranteedLegendary, boolean guaranteedShiny, boolean guaranteedVariant) {
        cheatSettings.put(username + "_legendary", guaranteedLegendary);
        cheatSettings.put(username + "_shiny", guaranteedShiny);
        cheatSettings.put(username + "_variant", guaranteedVariant);
    }
}