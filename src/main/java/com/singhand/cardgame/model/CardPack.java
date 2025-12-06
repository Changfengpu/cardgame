package com.singhand.cardgame.model;

import lombok.Data;

@Data
public class CardPack {
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
    
    public CardPack(PackType packType) {
        this.packType = packType;
        this.price = packType.getPrice();
    }
}