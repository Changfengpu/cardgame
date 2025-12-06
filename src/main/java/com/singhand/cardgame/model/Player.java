package com.singhand.cardgame.model;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class Player {
    private String username;
    private double money;
    private List<Card> cardCollection;
    private List<CardPack> backpack;
    
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