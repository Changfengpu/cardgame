package com.singhand.cardgame.controller;

import com.singhand.cardgame.model.Card;
import com.singhand.cardgame.model.CardPack;
import com.singhand.cardgame.model.Player;
import com.singhand.cardgame.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/game")
public class GameController {
    
    @Autowired
    private GameService gameService;
    
    @PostMapping("/player/create")
    public ResponseEntity<Player> createPlayer(@RequestParam String username, 
                                              @RequestParam(defaultValue = "100") double initialMoney) {
        Player player = gameService.createPlayer(username, initialMoney);
        return ResponseEntity.ok(player);
    }
    
    @GetMapping("/player/{username}")
    public ResponseEntity<Player> getPlayer(@PathVariable String username) {
        Player player = gameService.getPlayer(username);
        if (player != null) {
            return ResponseEntity.ok(player);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping("/player/{username}/buy-pack")
    public ResponseEntity<?> buyCardPack(@PathVariable String username, 
                                         @RequestParam CardPack.PackType packType) {
        boolean success = gameService.buyCardPack(username, packType);
        if (success) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "卡牌包购买成功");
            return ResponseEntity.ok(response);
        } else {
            Map<String, String> response = new HashMap<>();
            response.put("message", "金币不足或玩家不存在");
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/player/{username}/buy-packs-batch")
    public ResponseEntity<?> buyCardPacksBatch(@PathVariable String username, 
                                               @RequestParam CardPack.PackType packType,
                                               @RequestParam int quantity) {
        if (quantity <= 0 || quantity > 1000) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "购买数量必须在1-1000之间");
            return ResponseEntity.badRequest().body(response);
        }
        
        Map<String, Object> result = gameService.buyCardPacksBatch(username, packType, quantity);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/player/{username}/open-pack")
    public ResponseEntity<?> openCardPack(@PathVariable String username, 
                                          @RequestParam long packId) {
        System.out.println("GameController中的GameService实例: " + gameService.hashCode());
        List<Card> cards = gameService.openCardPack(username, packId);
        if (cards != null) {
            return ResponseEntity.ok(cards);
        } else {
            Map<String, String> response = new HashMap<>();
            response.put("message", "卡牌包不存在或玩家不存在");
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/player/{username}/open-packs-batch")
    public ResponseEntity<?> openCardPacksBatch(@PathVariable String username, 
                                                @RequestParam CardPack.PackType packType,
                                                @RequestParam(defaultValue = "all") String quantity) {
        // 如果不是"all"，检查数量是否在1-1000之间
        if (!quantity.equals("all")) {
            try {
                int qty = Integer.parseInt(quantity);
                if (qty <= 0 || qty > 1000) {
                    Map<String, String> response = new HashMap<>();
                    response.put("message", "开包数量必须在1-1000之间");
                    return ResponseEntity.badRequest().body(response);
                }
            } catch (NumberFormatException e) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "无效的数量参数");
                return ResponseEntity.badRequest().body(response);
            }
        }
        
        Map<String, Object> result = gameService.openCardPacksBatch(username, packType, quantity);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/player/{username}/sell-card")
    public ResponseEntity<?> sellCard(@PathVariable String username, 
                                      @RequestParam long cardId) {
        boolean success = gameService.sellCard(username, cardId);
        if (success) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "卡牌出售成功");
            return ResponseEntity.ok(response);
        } else {
            Map<String, String> response = new HashMap<>();
            response.put("message", "卡牌不存在或玩家不存在");
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/player/{username}/sell-cards-batch")
    public ResponseEntity<?> sellCardsBatch(@PathVariable String username, 
                                           @RequestBody List<Long> cardIds) {
        if (cardIds == null || cardIds.isEmpty()) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "卡牌ID列表不能为空");
            return ResponseEntity.badRequest().body(response);
        }
        
        Map<String, Object> result = gameService.sellCardsBatch(username, cardIds);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/player/{username}/collection")
    public ResponseEntity<List<Card>> getCardCollection(@PathVariable String username) {
        Player player = gameService.getPlayer(username);
        if (player != null) {
            return ResponseEntity.ok(player.getCardCollection());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/player/{username}/backpack")
    public ResponseEntity<List<CardPack>> getBackpack(@PathVariable String username) {
        Player player = gameService.getPlayer(username);
        if (player != null) {
            return ResponseEntity.ok(player.getBackpack());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/player/{username}/money")
    public ResponseEntity<Double> getMoney(@PathVariable String username) {
        Player player = gameService.getPlayer(username);
        if (player != null) {
            return ResponseEntity.ok(player.getMoney());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/cards")
    public ResponseEntity<List<Card>> getAllCards() {
        return ResponseEntity.ok(gameService.getAllCards());
    }
    
    @GetMapping("/pack-types")
    public ResponseEntity<CardPack.PackType[]> getPackTypes() {
        return ResponseEntity.ok(CardPack.PackType.values());
    }
    
    @GetMapping("/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard() {
        List<Map<String, Object>> leaderboard = gameService.getLeaderboard();
        return ResponseEntity.ok(leaderboard);
    }
    
    // 作弊功能相关接口
    @GetMapping("/player/{username}/cheat-status")
    public ResponseEntity<Map<String, Object>> getCheatStatus(@PathVariable String username) {
        Player player = gameService.getPlayer(username);
        if (player != null) {
            Map<String, Object> status = new HashMap<>();
            status.put("isCheater", "zlf".equals(username));
            status.put("guaranteedLegendary", gameService.isGuaranteedLegendary(username));
            status.put("guaranteedShiny", gameService.isGuaranteedShiny(username));
            status.put("guaranteedVariant", gameService.isGuaranteedVariant(username));
            return ResponseEntity.ok(status);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping("/player/{username}/cheat-settings")
    public ResponseEntity<?> updateCheatSettings(@PathVariable String username, 
                                                 @RequestParam boolean guaranteedLegendary,
                                                 @RequestParam boolean guaranteedShiny,
                                                 @RequestParam boolean guaranteedVariant) {
        Player player = gameService.getPlayer(username);
        if (player != null && "zlf".equals(username)) {
            gameService.updateCheatSettings(username, guaranteedLegendary, guaranteedShiny, guaranteedVariant);
            Map<String, String> response = new HashMap<>();
            response.put("message", "作弊设置更新成功");
            return ResponseEntity.ok(response);
        } else {
            Map<String, String> response = new HashMap<>();
            response.put("message", "玩家不存在或无权限");
            return ResponseEntity.badRequest().body(response);
        }
    }
}