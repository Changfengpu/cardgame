package com.singhand.cardgame.util;

import com.singhand.cardgame.model.Card;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class CardDataGenerator {
    
    private static final String[] COMMON_CHARACTERS = {
        "丘丘人", "史莱姆", "骗骗花", "风史莱姆", "岩史莱姆", "水史莱姆", "火史莱姆", "冰史莱姆", "雷史莱姆",
        "蒲公英", "甜甜花", "琉璃袋", "霓裳花", "琉璃百合", "塞西莉亚花", "清心", "琉璃袋",
        "小灯草", "绝云椒椒", "落落莓", "胡萝卜", "白萝卜", "莲藕", "蘑菇", "松果",
        "鸟蛋", "禽肉", "兽肉", "螃蟹", "虾仁", "萤囊虫", "晶核", "史莱姆凝液"
    };
    
    private static final String[] RARE_CHARACTERS = {
        "安柏", "丽莎", "凯亚", "芭芭拉", "香菱", "菲谢尔", "诺艾尔", "班尼特", "砂糖", "迪奥娜",
        "重云", "行秋", "北斗", "凝光", "辛焱", "久岐忍", "坎蒂丝", "多莉", "莱依拉", "瑶瑶"
    };
    
    private static final String[] EPIC_CHARACTERS = {
        "刻晴", "莫娜", "七七", "迪卢克", "琴", "温迪", "可莉", "阿贝多", "胡桃", "优菈",
        "绫华", "钟离", "魈", "甘雨", "达达利亚", "神里绫人", "夜兰", "珊瑚宫心海", "一斗", "申鹤"
    };
    
    private static final String[] LEGENDARY_CHARACTERS = {
        "雷电将军", "纳西妲", "流浪者", "妮露", "赛诺", "提纳里", "艾尔海森", "迪希雅", "米卡", "白术",
        "林尼", "琳妮特", "菲米尼", "那维莱特", "莱欧斯利", "嘉明", "芙宁娜", "夏沃蕾", "娜维娅", "千织"
    };
    
    private static final Random random = new Random();
    
    public static List<Card> generateAllCards() {
        List<Card> allCards = new ArrayList<>();
        
        allCards.addAll(generateCardsByRarity(Card.Rarity.COMMON, 1000, COMMON_CHARACTERS, 0.01, 5.0, 0.8));
        allCards.addAll(generateCardsByRarity(Card.Rarity.RARE, 500, RARE_CHARACTERS, 1.0, 50.0, 0.8));
        allCards.addAll(generateCardsByRarity(Card.Rarity.EPIC, 300, EPIC_CHARACTERS, 10.0, 100.0, 0.8));
        allCards.addAll(generateCardsByRarity(Card.Rarity.LEGENDARY, 100, LEGENDARY_CHARACTERS, 50.0, 1000.0, 0.8));
        
        return allCards;
    }
    
    private static List<Card> generateCardsByRarity(Card.Rarity rarity, int count, String[] characterNames, 
                                                   double minPrice, double maxPrice, double lowPriceRatio) {
        List<Card> cards = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            Card card = new Card();
            card.setId((long) (i + 1));
            card.setSerialNumber(rarity.name() + "-" + String.format("%04d", i + 1));
            card.setRarity(rarity);
            
            String characterName = characterNames[i % characterNames.length];
            card.setFixedName(characterName);
            
            card.setDescription(generateDescription(characterName));
            
            double price;
            if (i < count * lowPriceRatio) {
                price = minPrice + (maxPrice * 0.2 - minPrice) * random.nextDouble();
            } else {
                price = maxPrice * 0.2 + (maxPrice - maxPrice * 0.2) * random.nextDouble();
            }
            card.setBasePrice(Math.round(price * 100.0) / 100.0);
            
            card.generateActualName();
            card.calculateActualPrice();
            
            cards.add(card);
        }
        
        return cards;
    }
    
    private static String generateDescription(String characterName) {
        return characterName + "是一个游戏里的角色，拥有独特的技能和背景故事。" +
               "在游戏中，" + characterName + "有着重要的作用，" +
               "是玩家们喜爱的角色之一。";
    }
    
    public static void saveCardsToFile(List<Card> cards, String filePath) {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(filePath))) {
            writer.write("序号,固定名字,稀有度,描述,基础价格\n");
            
            for (Card card : cards) {
                writer.write(String.format("%d,%s,%s,%s,%.2f\n",
                    card.getId(),
                    card.getFixedName(),
                    card.getRarity().getDisplayName(),
                    card.getDescription(),
                    card.getBasePrice()
                ));
            }
            
            System.out.println("卡牌数据已保存到文件: " + filePath);
        } catch (IOException e) {
            System.err.println("保存卡牌数据时出错: " + e.getMessage());
        }
    }
    
    public static void main(String[] args) {
        List<Card> allCards = generateAllCards();
        saveCardsToFile(allCards, "cards_data.txt");
        System.out.println("总共生成了 " + allCards.size() + " 张卡牌");
    }
}