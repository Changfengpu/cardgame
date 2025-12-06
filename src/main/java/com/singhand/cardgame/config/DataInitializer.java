package com.singhand.cardgame.config;

import com.singhand.cardgame.model.Card;
import com.singhand.cardgame.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private GameService gameService;
    
    @Override
    public void run(String... args) throws Exception {
        initializeCards();
    }
    
    private void initializeCards() {
        try {
            List<Card> cards = loadCardsFromFile("cards_data.txt");
            if (!cards.isEmpty()) {
                System.out.println("DataInitializer中的GameService实例: " + gameService.hashCode());
                gameService.initializeCards(cards);
                System.out.println("成功加载 " + cards.size() + " 张卡牌数据");
            } else {
                System.out.println("未找到卡牌数据文件，使用默认数据");
                initializeDefaultCards();
            }
        } catch (Exception e) {
            System.out.println("加载卡牌数据失败，使用默认数据: " + e.getMessage());
            initializeDefaultCards();
        }
    }
    
    private List<Card> loadCardsFromFile(String filePath) throws IOException {
        List<Card> cards = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {
            String line = reader.readLine();
            if (line == null || !line.startsWith("序号")) {
                return cards;
            }
            
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",", 5);
                if (parts.length >= 5) {
                    Card card = new Card();
                    card.setId(Long.parseLong(parts[0]));
                    card.setFixedName(parts[1]);
                    
                    String rarityName = parts[2];
                    Card.Rarity rarity;
                    switch (rarityName) {
                        case "稀有": rarity = Card.Rarity.RARE; break;
                        case "史诗": rarity = Card.Rarity.EPIC; break;
                        case "传说": rarity = Card.Rarity.LEGENDARY; break;
                        default: rarity = Card.Rarity.COMMON; break;
                    }
                    card.setRarity(rarity);
                    
                    card.setDescription(parts[3]);
                    card.setBasePrice(Double.parseDouble(parts[4]));
                    
                    // 注意：模板卡牌不需要调用generateActualName()和calculateActualPrice()
                    // 这些应该在真正抽取卡牌时调用
                    cards.add(card);
                }
            }
        }
        
        return cards;
    }
    
    private void initializeDefaultCards() {
        List<Card> defaultCards = new ArrayList<>();
        
        long id = 1;
        for (int i = 0; i < 100; i++) {
            Card card = new Card();
            card.setId(id++);
            card.setSerialNumber("COMMON-" + String.format("%04d", i));
            card.setFixedName("普通卡牌" + i);
            card.setRarity(Card.Rarity.COMMON);
            card.setDescription("这是一张普通卡牌");
            card.setBasePrice(1.0 + Math.random() * 4.0);
            // 注意：模板卡牌不需要调用generateActualName()和calculateActualPrice()
            defaultCards.add(card);
        }
        
        for (int i = 0; i < 50; i++) {
            Card card = new Card();
            card.setId(id++);
            card.setSerialNumber("RARE-" + String.format("%04d", i));
            card.setFixedName("稀有卡牌" + i);
            card.setRarity(Card.Rarity.RARE);
            card.setDescription("这是一张稀有卡牌");
            card.setBasePrice(10.0 + Math.random() * 40.0);
            // 注意：模板卡牌不需要调用generateActualName()和calculateActualPrice()
            defaultCards.add(card);
        }
        
        for (int i = 0; i < 30; i++) {
            Card card = new Card();
            card.setId(id++);
            card.setSerialNumber("EPIC-" + String.format("%04d", i));
            card.setFixedName("史诗卡牌" + i);
            card.setRarity(Card.Rarity.EPIC);
            card.setDescription("这是一张史诗卡牌");
            card.setBasePrice(20.0 + Math.random() * 80.0);
            // 注意：模板卡牌不需要调用generateActualName()和calculateActualPrice()
            defaultCards.add(card);
        }
        
        for (int i = 0; i < 10; i++) {
            Card card = new Card();
            card.setId(id++);
            card.setSerialNumber("LEGENDARY-" + String.format("%04d", i));
            card.setFixedName("传说卡牌" + i);
            card.setRarity(Card.Rarity.LEGENDARY);
            card.setDescription("这是一张传说卡牌");
            card.setBasePrice(100.0 + Math.random() * 900.0);
            // 注意：模板卡牌不需要调用generateActualName()和calculateActualPrice()
            defaultCards.add(card);
        }
        
        gameService.initializeCards(defaultCards);
        System.out.println("初始化了 " + defaultCards.size() + " 张默认卡牌");
    }
}