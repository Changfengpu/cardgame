package com.singhand.cardgame.model;

import lombok.Data;

@Data
public class Card {
    private Long id;
    private String serialNumber;
    private String fixedName;
    private String actualName;
    private Rarity rarity;
    private Boolean isShiny;
    private Boolean isVariant;
    private VariantType variantType;
    private String description;
    private Double basePrice;
    private Double actualPrice;
    
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
        
        // 确保basePrice不为null，如果为null则使用默认价格
        double basePriceValue = (basePrice != null) ? basePrice : 10.0;
        
        double randomFactor = 0.5 + Math.random() * 1.5;
        actualPrice = Math.round(basePriceValue * priceMultiplier * randomFactor * 100.0) / 100.0;
    }
}