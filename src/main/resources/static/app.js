// 全局变量
let currentPlayer = null;
let currentCardId = null;
let packTypes = {};

// API基础URL
const API_BASE = '/api/game';

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
async function initializeApp() {
    try {
        // 加载卡牌包类型
        await loadPackTypes();
        
        // 检查是否有已登录的玩家
        checkExistingPlayer();
        
        // 绑定事件监听器
        bindEventListeners();
        
    } catch (error) {
        console.error('应用初始化失败:', error);
        showToast('应用初始化失败，请刷新页面重试', 'error');
    }
}

// 加载卡牌包类型
async function loadPackTypes() {
    try {
        const response = await fetch(`${API_BASE}/pack-types`);
        if (response.ok) {
            const types = await response.json();
            types.forEach(type => {
                packTypes[type] = type;
            });
        }
    } catch (error) {
        console.error('加载卡牌包类型失败:', error);
    }
}

// 检查现有玩家
function checkExistingPlayer() {
    const savedPlayer = localStorage.getItem('currentPlayer');
    if (savedPlayer) {
        currentPlayer = JSON.parse(savedPlayer);
        showPlayerInfo();
        enableGameButtons();
    }
}

// 绑定事件监听器
function bindEventListeners() {
    // 卡牌包类型选择变化时更新概率信息
    document.getElementById('packTypeSelect').addEventListener('change', updatePackProbabilityInfo);
    
    // 批量选择模式切换
    document.getElementById('selectMode').addEventListener('change', toggleSelectMode);
    
    // 复选框变化时更新选中数量
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('card-checkbox')) {
            updateSelectedCount();
        }
    });
    
    // 批量购买数量变化时更新总价
    document.getElementById('bulkBuyQuantity').addEventListener('input', function() {
        const packType = document.getElementById('bulkPackType').textContent.trim();
        const packTypeEnum = getPackTypeEnum(packType);
        if (packTypeEnum) {
            updateBulkTotalPrice(packTypeEnum);
        }
    });
}

// 显示创建玩家模态框
function showCreatePlayerModal() {
    const modal = new bootstrap.Modal(document.getElementById('createPlayerModal'));
    document.getElementById('usernameInput').value = '';
    modal.show();
}

// 创建玩家
async function createPlayer() {
    const username = document.getElementById('usernameInput').value.trim();
    const initialMoney = document.getElementById('initialMoneyInput').value;
    
    if (!username) {
        showToast('请输入玩家名称', 'warning');
        return;
    }
    
    if (!initialMoney || initialMoney < 1 || initialMoney > 10000) {
        showToast('初始金币数量必须在1-10000之间', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/player/create?username=${encodeURIComponent(username)}&initialMoney=${initialMoney}`, {
            method: 'POST'
        });

        if (response.ok) {
            currentPlayer = await response.json();
            localStorage.setItem('currentPlayer', JSON.stringify(currentPlayer));
            
            // 关闭模态框
            bootstrap.Modal.getInstance(document.getElementById('createPlayerModal')).hide();
            
            // 更新UI
            showPlayerInfo();
            enableGameButtons();
            showPackShop();
            
            showToast(`玩家 ${username} 创建成功！初始金币：${initialMoney}`, 'success');
        } else {
            const error = await response.text();
            showToast('创建玩家失败: ' + error, 'error');
        }
    } catch (error) {
        console.error('创建玩家失败:', error);
        showToast('网络错误，请重试', 'error');
    }
}

// 显示玩家信息
function showPlayerInfo() {
    if (!currentPlayer) return;

    document.getElementById('playerMoney').textContent = currentPlayer.money.toFixed(2);
    document.getElementById('playerInfo').style.display = 'none';
    document.getElementById('playerStats').style.display = 'block';
    
    document.getElementById('playerName').textContent = currentPlayer.username;
    document.getElementById('playerMoneyDetail').textContent = currentPlayer.money.toFixed(2);
    document.getElementById('cardCount').textContent = currentPlayer.cardCollection ? currentPlayer.cardCollection.length : 0;
    document.getElementById('packCount').textContent = currentPlayer.backpack ? currentPlayer.backpack.length : 0;
    
    // 检查是否显示作弊功能按钮
    checkCheatButton();
}

// 启用游戏按钮
function enableGameButtons() {
    document.getElementById('buyPackBtn').disabled = false;
    document.getElementById('backpackBtn').disabled = false;
    document.getElementById('collectionBtn').disabled = false;
}

// 刷新玩家信息
async function refreshPlayerInfo() {
    if (!currentPlayer) return;

    try {
        const response = await fetch(`${API_BASE}/player/${currentPlayer.username}`);
        if (response.ok) {
            currentPlayer = await response.json();
            localStorage.setItem('currentPlayer', JSON.stringify(currentPlayer));
            showPlayerInfo();
        }
    } catch (error) {
        console.error('刷新玩家信息失败:', error);
    }
}

// 显示卡牌包商店
function showPackShop() {
    hideAllPages();
    document.getElementById('packShopPage').style.display = 'block';
    renderPackShop();
}

// 渲染卡牌包商店
function renderPackShop() {
    const shopContainer = document.getElementById('packShop');
    shopContainer.innerHTML = '';

    const packTypeData = {
        'COMMON': {
            name: '普通卡牌包',
            price: 20,
            description: '基础卡牌包，适合新手',
            class: 'common',
            icon: '📦'
        },
        'RARE': {
            name: '稀有卡牌包',
            price: 50,
            description: '更高概率获得稀有卡牌',
            class: 'rare',
            icon: '💎'
        },
        'EPIC': {
            name: '史诗卡牌包',
            price: 100,
            description: '包含史诗级卡牌的机会',
            class: 'epic',
            icon: '🌟'
        },
        'LEGENDARY': {
            name: '传说卡牌包',
            price: 200,
            description: '最高级卡牌包，传说卡牌概率更高',
            class: 'legendary',
            icon: '👑'
        }
    };

    Object.entries(packTypeData).forEach(([type, data]) => {
        const packCard = document.createElement('div');
        packCard.className = 'col-md-6 col-lg-3';
        packCard.innerHTML = `
            <div class="pack-card ${data.class}">
                <div class="pack-icon" style="font-size: 3rem; margin-bottom: 15px;">${data.icon}</div>
                <h5>${data.name}</h5>
                <div class="pack-price">
                    <i class="fas fa-coins"></i> ${data.price} 金币
                </div>
                <div class="pack-description">${data.description}</div>
                <button class="btn btn-primary mt-3" onclick="quickBuyPack('${type}')">
                    <i class="fas fa-shopping-cart"></i> 购买
                </button>
            </div>
        `;
        shopContainer.appendChild(packCard);
    });
}

// 选择卡牌包类型
function selectPackType(type) {
    document.getElementById('packTypeSelect').value = type;
    updatePackProbabilityInfo();
    showBuyPackModal();
}

// 快速购买卡牌包
async function quickBuyPack(type) {
    if (!currentPlayer) {
        showToast('请先创建玩家', 'warning');
        return;
    }

    // 检查是否开启批量购买模式
    const bulkBuyMode = document.getElementById('bulkBuyMode').checked;
    if (bulkBuyMode) {
        showBulkBuyModal(type);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/player/${currentPlayer.username}/buy-pack?packType=${type}`, {
            method: 'POST'
        });

        if (response.ok) {
            const result = await response.json();
            showToast(result.message, 'success');
            refreshPlayerInfo();
            showBackpack();
        } else {
            const error = await response.json();
            showToast(error.message, 'error');
        }
    } catch (error) {
        console.error('购买卡牌包失败:', error);
        showToast('网络错误，请重试', 'error');
    }
}

// 显示批量购买模态框
function showBulkBuyModal(packType) {
    const packTypeData = {
        'COMMON': { name: '普通卡牌包', price: 20 },
        'RARE': { name: '稀有卡牌包', price: 50 },
        'EPIC': { name: '史诗卡牌包', price: 100 },
        'LEGENDARY': { name: '传说卡牌包', price: 200 }
    };

    const data = packTypeData[packType];
    document.getElementById('bulkPackType').textContent = data.name;
    document.getElementById('bulkPackType').className = `badge bg-${getPackTypeBadgeClass(packType)}`;
    document.getElementById('bulkBuyQuantity').value = 10;
    document.getElementById('bulkBuyQuantity').max = 1000;
    updateBulkTotalPrice(packType);

    const modal = new bootstrap.Modal(document.getElementById('bulkBuyModal'));
    modal.show();
}

// 更新批量购买总价
function updateBulkTotalPrice(packType) {
    const packTypeData = {
        'COMMON': 20,
        'RARE': 50,
        'EPIC': 100,
        'LEGENDARY': 200
    };

    const quantity = parseInt(document.getElementById('bulkBuyQuantity').value) || 1;
    const unitPrice = packTypeData[packType];
    const totalPrice = quantity * unitPrice;
    
    document.getElementById('bulkTotalPrice').textContent = totalPrice;
}

// 确认批量购买
async function confirmBulkBuy() {
    const packType = document.getElementById('bulkPackType').textContent.trim();
    const quantity = parseInt(document.getElementById('bulkBuyQuantity').value) || 1;
    
    if (quantity < 1) {
        showToast('购买数量必须大于0', 'warning');
        return;
    }
    
    if (quantity > 1000) {
        showToast('购买数量不能超过1000', 'warning');
        return;
    }

    // 获取packType枚举值
    const packTypeEnum = getPackTypeEnum(packType);
    if (!packTypeEnum) {
        showToast('无效的卡牌包类型', 'error');
        return;
    }

    // 显示加载动画，禁用按钮
    document.getElementById('bulkBuyLoading').style.display = 'block';
    document.getElementById('confirmBulkBuyBtn').disabled = true;

    try {
        const response = await fetch(`${API_BASE}/player/${currentPlayer.username}/buy-packs-batch?packType=${packTypeEnum}&quantity=${quantity}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                bootstrap.Modal.getInstance(document.getElementById('bulkBuyModal')).hide();
                showToast(result.message, 'success');
                refreshPlayerInfo();
                showBackpack();
            } else {
                showToast(result.message, 'error');
            }
        } else {
            const error = await response.json();
            showToast(error.message, 'error');
        }
    } catch (error) {
        console.error('批量购买失败:', error);
        showToast('网络错误，请重试', 'error');
    } finally {
        // 隐藏加载动画，启用按钮
        document.getElementById('bulkBuyLoading').style.display = 'none';
        document.getElementById('confirmBulkBuyBtn').disabled = false;
    }
}

// 获取卡牌包类型枚举值
function getPackTypeEnum(displayName) {
    const mapping = {
        '普通卡牌包': 'COMMON',
        '稀有卡牌包': 'RARE',
        '史诗卡牌包': 'EPIC',
        '传说卡牌包': 'LEGENDARY'
    };
    return mapping[displayName] || null;
}

// 获取卡牌包类型徽章样式
function getPackTypeBadgeClass(packType) {
    const mapping = {
        'COMMON': 'secondary',
        'RARE': 'info',
        'EPIC': 'warning',
        'LEGENDARY': 'danger'
    };
    return mapping[packType] || 'secondary';
}

// 显示购买卡牌包模态框
function showBuyPackModal() {
    updatePackProbabilityInfo();
    const modal = new bootstrap.Modal(document.getElementById('buyPackModal'));
    modal.show();
}

// 更新卡牌包概率信息
function updatePackProbabilityInfo() {
    const selectedType = document.getElementById('packTypeSelect').value;
    
    if (!selectedType) return;

    // 硬编码卡牌包类型数据，因为后端只返回枚举名称
    const packTypeData = {
        'COMMON': {
            rarityProbabilities: [0.90, 0.05, 0.02, 0.01],
            shinyProbability: 0.0,
            variantProbability: 0.0
        },
        'RARE': {
            rarityProbabilities: [0.80, 0.13, 0.06, 0.01],
            shinyProbability: 0.01,
            variantProbability: 0.01
        },
        'EPIC': {
            rarityProbabilities: [0.70, 0.20, 0.09, 0.01],
            shinyProbability: 0.02,
            variantProbability: 0.02
        },
        'LEGENDARY': {
            rarityProbabilities: [0.60, 0.25, 0.12, 0.03],
            shinyProbability: 0.03,
            variantProbability: 0.03
        }
    };

    const packType = packTypeData[selectedType];
    if (!packType) return;

    const probabilities = packType.rarityProbabilities;
    const rarityNames = ['普通', '稀有', '史诗', '传说'];
    const rarityClasses = ['common', 'rare', 'epic', 'legendary'];

    let probabilityHTML = `
        <h6>开出概率：</h6>
        <table class="table table-sm probability-table">
            <thead>
                <tr>
                    <th>稀有度</th>
                    <th>概率</th>
                </tr>
            </thead>
            <tbody>
    `;

    probabilities.forEach((prob, index) => {
        probabilityHTML += `
            <tr>
                <td><span class="badge ${rarityClasses[index]}">${rarityNames[index]}</span></td>
                <td>${(prob * 100).toFixed(1)}%</td>
            </tr>
        `;
    });

    probabilityHTML += `
            </tbody>
        </table>
        <small class="text-muted">
            闪卡概率: ${(packType.shinyProbability * 100).toFixed(1)}% | 
            变异概率: ${(packType.variantProbability * 100).toFixed(1)}%
        </small>
    `;

    document.getElementById('packProbabilityInfo').innerHTML = probabilityHTML;
}

// 购买卡牌包
async function buyPack() {
    const packType = document.getElementById('packTypeSelect').value;
    
    try {
        const response = await fetch(`${API_BASE}/player/${currentPlayer.username}/buy-pack?packType=${packType}`, {
            method: 'POST'
        });

        if (response.ok) {
            const result = await response.json();
            bootstrap.Modal.getInstance(document.getElementById('buyPackModal')).hide();
            showToast(result.message, 'success');
            refreshPlayerInfo();
            showBackpack();
        } else {
            const error = await response.json();
            showToast(error.message, 'error');
        }
    } catch (error) {
        console.error('购买卡牌包失败:', error);
        showToast('网络错误，请重试', 'error');
    }
}

// 显示背包
async function showBackpack() {
    hideAllPages();
    document.getElementById('backpackPage').style.display = 'block';
    await refreshPlayerInfo();
    renderBackpack();
}

// 渲染背包
async function renderBackpack() {
    const backpackContent = document.getElementById('backpackContent');
    
    // 确保使用最新的玩家数据
    if (!currentPlayer) {
        await refreshPlayerInfo();
    }
    
    if (!currentPlayer || !currentPlayer.backpack || currentPlayer.backpack.length === 0) {
        backpackContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-backpack"></i>
                <h5>背包是空的</h5>
                <p>去商店购买一些卡牌包吧！</p>
                <button class="btn btn-primary" onclick="showPackShop()">
                    <i class="fas fa-store"></i> 去商店
                </button>
            </div>
        `;
        return;
    }

    backpackContent.innerHTML = '';
    
    currentPlayer.backpack.forEach(pack => {
        const packCard = document.createElement('div');
        packCard.className = 'col-md-6 col-lg-3 mb-3';
        const packType = pack.packType;
        const packTypeName = packType;
        const displayName = getPackTypeDisplayName(packTypeName);
        packCard.innerHTML = `
            <div class="card pack-card ${packTypeName.toLowerCase()}">
                <div class="card-body">
                    <h5 class="card-title">${displayName}</h5>
                    <p class="card-text">ID: ${pack.id}</p>
                    <button class="btn btn-success w-100" onclick="openPack(${pack.id})">
                        <i class="fas fa-gift"></i> 开包
                    </button>
                </div>
            </div>
        `;
        backpackContent.appendChild(packCard);
    });
}

// 开包
async function openPack(packId) {
    try {
        // 添加开包动画
        event.target.closest('.card').classList.add('pack-opening');
        
        const response = await fetch(`${API_BASE}/player/${currentPlayer.username}/open-pack?packId=${packId}`, {
            method: 'POST'
        });

        if (response.ok) {
            const cards = await response.json();
            showOpenPackResult(cards);
            // 先刷新玩家信息，再渲染背包
            await refreshPlayerInfo();
            // 延迟一下确保数据更新完成
            setTimeout(() => {
                renderBackpack();
            }, 100);
        } else {
            const error = await response.json();
            showToast(error.message, 'error');
        }
    } catch (error) {
        console.error('开包失败:', error);
        showToast('网络错误，请重试', 'error');
    }
}

// 显示批量开包模态框
function showBulkOpenModal() {
    if (!currentPlayer || !currentPlayer.backpack || currentPlayer.backpack.length === 0) {
        showToast('背包中没有卡牌包', 'warning');
        return;
    }

    // 统计各种类型的卡牌包数量
    const packTypeCounts = {};
    currentPlayer.backpack.forEach(pack => {
        const type = pack.packType;
        packTypeCounts[type] = (packTypeCounts[type] || 0) + 1;
    });

    // 生成卡牌包类型选择界面
    const packTypesContainer = document.getElementById('bulkPackTypes');
    packTypesContainer.innerHTML = '';

    const packTypeData = {
        'COMMON': { name: '普通卡牌包', class: 'common', icon: '📦' },
        'RARE': { name: '稀有卡牌包', class: 'rare', icon: '💎' },
        'EPIC': { name: '史诗卡牌包', class: 'epic', icon: '🌟' },
        'LEGENDARY': { name: '传说卡牌包', class: 'legendary', icon: '👑' }
    };

    Object.entries(packTypeCounts).forEach(([type, count]) => {
        const data = packTypeData[type];
        if (data) {
            const packDiv = document.createElement('div');
            packDiv.className = 'col-md-6 mb-2';
            packDiv.innerHTML = `
                <div class="card pack-card ${data.class}" onclick="selectBulkPackType('${type}')" style="cursor: pointer;">
                    <div class="card-body text-center">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="bulkPackType" value="${type}" id="bulkPackType_${type}">
                            <label class="form-check-label w-100" for="bulkPackType_${type}">
                                <div style="font-size: 2rem;">${data.icon}</div>
                                <h6>${data.name}</h6>
                                <span class="badge bg-primary">${count} 个</span>
                                ${count > 1000 ? '<span class="badge bg-warning ms-1">超过上限</span>' : ''}
                            </label>
                        </div>
                    </div>
                </div>
            `;
            packTypesContainer.appendChild(packDiv);
        }
    });

    // 重置开包数量选择
    document.getElementById('bulkOpenQuantity').value = 'all';

    const modal = new bootstrap.Modal(document.getElementById('bulkOpenModal'));
    modal.show();
}

// 选择批量开包类型
function selectBulkPackType(type) {
    document.getElementById(`bulkPackType_${type}`).checked = true;
}

// 确认批量开包
async function confirmBulkOpen() {
    const selectedType = document.querySelector('input[name="bulkPackType"]:checked');
    if (!selectedType) {
        showToast('请选择要开启的卡牌包类型', 'warning');
        return;
    }

    const packType = selectedType.value;
    const quantity = document.getElementById('bulkOpenQuantity').value;
    const packsToOpen = currentPlayer.backpack.filter(pack => pack.packType === packType);
    
    if (packsToOpen.length === 0) {
        showToast('没有找到该类型的卡牌包', 'warning');
        return;
    }
    
    // 检查数量限制
    if (quantity !== 'all') {
        const qty = parseInt(quantity);
        if (qty > 1000) {
            showToast('开包数量不能超过1000', 'warning');
            return;
        }
        if (qty > packsToOpen.length) {
            showToast(`只有${packsToOpen.length}个该类型的卡牌包`, 'warning');
            return;
        }
    }

    // 显示加载动画，禁用按钮
    document.getElementById('bulkOpenLoading').style.display = 'block';
    document.getElementById('confirmBulkOpenBtn').disabled = true;

    try {
        const response = await fetch(`${API_BASE}/player/${currentPlayer.username}/open-packs-batch?packType=${packType}&quantity=${quantity}`, {
            method: 'POST'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                bootstrap.Modal.getInstance(document.getElementById('bulkOpenModal')).hide();
                showToast(result.message, 'success');
                // 先刷新玩家信息，再渲染背包
                await refreshPlayerInfo();
                // 延迟一下确保数据更新完成
                setTimeout(() => {
                    renderBackpack();
                }, 100);
                
                // 显示开包结果
                showBulkOpenPackResult(result.cards);
            } else {
                showToast(result.message, 'error');
            }
        } else {
            const error = await response.json();
            showToast(error.message, 'error');
        }
    } catch (error) {
        console.error('批量开包失败:', error);
        showToast('网络错误，请重试', 'error');
    } finally {
        // 隐藏加载动画，启用按钮
        document.getElementById('bulkOpenLoading').style.display = 'none';
        document.getElementById('confirmBulkOpenBtn').disabled = false;
    }
}

// 卡牌排序：按稀有度排序，同稀有度按价格排序
function sortCards(cards) {
    const rarityOrder = { 'LEGENDARY': 4, 'EPIC': 3, 'RARE': 2, 'COMMON': 1 };
    
    return cards.sort((a, b) => {
        // 先按稀有度排序
        const rarityDiff = rarityOrder[b.rarity] - rarityOrder[a.rarity];
        if (rarityDiff !== 0) {
            return rarityDiff;
        }
        
        // 同稀有度按价格排序（高价格在前）
        return b.actualPrice - a.actualPrice;
    });
}

// 显示批量开包结果
function showBulkOpenPackResult(cards) {
    // 存储全局变量用于分页
    window.bulkOpenCards = cards;
    window.currentPageIndex = 0;
    window.pageSize = 20;
    
    updateBulkOpenPackDisplay();
    
    const modal = new bootstrap.Modal(document.getElementById('openPackModal'));
    modal.show();
}

// 更新批量开包结果显示
function updateBulkOpenPackDisplay() {
    const cards = window.bulkOpenCards || [];
    const pageIndex = window.currentPageIndex || 0;
    const pageSize = window.pageSize || 20;
    
    // 计算分页信息
    const totalPages = Math.ceil(cards.length / pageSize);
    const startIndex = pageIndex * pageSize;
    const endIndex = Math.min(startIndex + pageSize, cards.length);
    const currentPageCards = cards.slice(startIndex, endIndex);
    
    // 更新分页控制
    document.getElementById('currentPage').textContent = pageIndex + 1;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('prevBtn').disabled = pageIndex === 0;
    document.getElementById('nextBtn').disabled = pageIndex >= totalPages - 1;
    
    // 更新统计信息
    updateOpenPackStats(cards);
    
    // 渲染当前页的卡牌
    const resultContainer = document.getElementById('openPackResult');
    resultContainer.innerHTML = '';
    
    currentPageCards.forEach((card, index) => {
        setTimeout(() => {
            const cardElement = createOpenPackCardElement(card);
            cardElement.classList.add('card-reveal');
            resultContainer.appendChild(cardElement);
        }, index * 50); // 加快动画速度
    });
}

// 更新开包统计信息
function updateOpenPackStats(cards) {
    const stats = calculateCollectionStats(cards);
    const statsHtml = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">总卡牌数</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.common}</div>
                <div class="stat-label">普通卡牌</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.rare}</div>
                <div class="stat-label">稀有卡牌</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.epic}</div>
                <div class="stat-label">史诗卡牌</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.legendary}</div>
                <div class="stat-label">传说卡牌</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.shiny}</div>
                <div class="stat-label">闪卡</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.variant}</div>
                <div class="stat-label">变异卡</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.shinyVariant}</div>
                <div class="stat-label">变异&闪</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.totalValue.toFixed(2)}</div>
                <div class="stat-label">总价值</div>
            </div>
        </div>
    `;
    document.getElementById('openPackStats').innerHTML = statsHtml;
}

// 分页控制函数
function previousPage() {
    if (window.currentPageIndex > 0) {
        window.currentPageIndex--;
        updateBulkOpenPackDisplay();
    }
}

function nextPage() {
    const totalPages = Math.ceil((window.bulkOpenCards || []).length / window.pageSize);
    if (window.currentPageIndex < totalPages - 1) {
        window.currentPageIndex++;
        updateBulkOpenPackDisplay();
    }
}

function changePageSize() {
    window.pageSize = parseInt(document.getElementById('pageSizeSelect').value);
    window.currentPageIndex = 0;
    updateBulkOpenPackDisplay();
}

// 显示开包结果（单个开包）
function showOpenPackResult(cards) {
    const resultContainer = document.getElementById('openPackResult');
    resultContainer.innerHTML = '';
    
    // 将开出的卡牌存储到全局变量中，以便出售时可以移除
    window.currentOpenPackCards = cards;

    // 创建上三下二的布局
    const topRow = document.createElement('div');
    topRow.className = 'row justify-content-center mb-3';
    
    const bottomRow = document.createElement('div');
    bottomRow.className = 'row justify-content-center';
    
    // 上三张卡牌
    for (let i = 0; i < 3 && i < cards.length; i++) {
        setTimeout(() => {
            const cardElement = createOpenPackCardElement(cards[i]);
            cardElement.classList.add('card-reveal');
            topRow.appendChild(cardElement);
        }, i * 200);
    }
    
    // 下两张卡牌
    for (let i = 3; i < 5 && i < cards.length; i++) {
        setTimeout(() => {
            const cardElement = createOpenPackCardElement(cards[i]);
            cardElement.classList.add('card-reveal');
            bottomRow.appendChild(cardElement);
        }, i * 200);
    }
    
    resultContainer.appendChild(topRow);
    resultContainer.appendChild(bottomRow);

    const modal = new bootstrap.Modal(document.getElementById('openPackModal'));
    modal.show();
}

// 创建开包结果的卡牌元素（专门用于开包结果展示）
function createOpenPackCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'col-md-4 col-lg-4 mb-3';
    
    const rarityClass = (card.rarity || 'COMMON').toLowerCase();
    const isShiny = card.shiny || card.isShiny;
    const isVariant = card.variant || card.isVariant;
    const shinyBadge = isShiny ? '<span class="shiny-badge">✨ 闪卡</span>' : '';
    const variantBadge = isVariant ? '<span class="variant-badge">🎨 变异卡</span>' : '';
    
    // 构建特效类
    let effectClasses = '';
    if (isShiny) {
        effectClasses += ' shiny-effect';
    }
    
    if (isVariant) {
        const variantType = card.variantType || card.variantTypeEnum;
        if (variantType === 'BLACK') {
            effectClasses += ' black-variant black-effect';
            if (isShiny) {
                effectClasses += ' rainbow-border';
            }
        } else if (variantType === 'WHITE') {
            effectClasses += ' white-variant white-effect';
            if (isShiny) {
                effectClasses += ' rainbow-border';
            }
        }
    }
    
    cardDiv.innerHTML = `
        <div class="card-item ${rarityClass}${effectClasses}" onclick="showCardDetail(${card.id})">
            <div>
                <div class="card-name">${card.actualName || card.fixedName}</div>
                <div class="card-attributes">
                    ${shinyBadge}
                    ${variantBadge}
                </div>
            </div>
            <div>
                <span class="card-rarity ${rarityClass}">${getRarityDisplayName(card.rarity)}</span>
                <div class="card-price">
                    <i class="fas fa-coins"></i> ${card.actualPrice.toFixed(2)}
                </div>
            </div>
        </div>
    `;
    
    return cardDiv;
}

// 创建卡牌元素
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `col-md-6 col-lg-3 mb-3`;
    
    const rarityClass = (card.rarity || 'COMMON').toLowerCase();
    const isShiny = card.shiny || card.isShiny;
    const isVariant = card.variant || card.isVariant;
    const shinyBadge = isShiny ? '<span class="shiny-badge">✨ 闪卡</span>' : '';
    const variantBadge = isVariant ? '<span class="variant-badge">🎨 变异卡</span>' : '';
    
    // 构建特效类
    let effectClasses = '';
    if (isShiny) {
        effectClasses += ' shiny-effect';
    }
    
    if (isVariant) {
        const variantType = card.variantType || card.variantTypeEnum;
        if (variantType === 'BLACK') {
            effectClasses += ' black-variant black-effect';
            if (isShiny) {
                effectClasses += ' rainbow-border';
            }
        } else if (variantType === 'WHITE') {
            effectClasses += ' white-variant white-effect';
            if (isShiny) {
                effectClasses += ' rainbow-border';
            }
        }
    }
    
    cardDiv.innerHTML = `
        <div class="card-item ${rarityClass}${effectClasses}" data-card-id="${card.id}" data-card-name="${card.fixedName}" data-card-rarity="${card.rarity}">
            <div class="card-select-checkbox" style="display: none;">
                <input type="checkbox" class="form-check-input card-checkbox" value="${card.id}">
            </div>
            <div onclick="showCardDetail(${card.id})">
                <div class="card-name">${card.actualName || card.fixedName}</div>
                <div class="card-attributes">
                    ${shinyBadge}
                    ${variantBadge}
                </div>
            </div>
            <div>
                <span class="card-rarity ${rarityClass}">${getRarityDisplayName(card.rarity)}</span>
                <div class="card-price">
                    <i class="fas fa-coins"></i> ${card.actualPrice.toFixed(2)}
                </div>
            </div>
        </div>
    `;
    
    return cardDiv;
}

// 显示卡牌册
function showCollection() {
    hideAllPages();
    document.getElementById('collectionPage').style.display = 'block';
    renderCollection();
}

// 全局筛选状态
let currentRarityFilter = 'all';
let currentSpecialFilter = 'all';

// 渲染卡牌册
async function renderCollection(filter = 'all') {
    currentRarityFilter = filter;
    const collectionContent = document.getElementById('collectionContent');
    const collectionStats = document.getElementById('collectionStats');
    
    if (!currentPlayer || !currentPlayer.cardCollection || currentPlayer.cardCollection.length === 0) {
        collectionContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <h5>卡牌册是空的</h5>
                <p>去购买卡牌包开始收集吧！</p>
                <button class="btn btn-primary" onclick="showPackShop()">
                    <i class="fas fa-store"></i> 去商店
                </button>
            </div>
        `;
        collectionStats.innerHTML = '';
        return;
    }

    // 显示统计信息（始终基于全部卡牌，不受筛选影响）
    const stats = calculateCollectionStats(currentPlayer.cardCollection);
    const statsHtml = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">总卡牌数</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.common}</div>
                <div class="stat-label">普通卡牌</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.rare}</div>
                <div class="stat-label">稀有卡牌</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.epic}</div>
                <div class="stat-label">史诗卡牌</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.legendary}</div>
                <div class="stat-label">传说卡牌</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.shiny}</div>
                <div class="stat-label">闪卡</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.variant}</div>
                <div class="stat-label">变异卡</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.shinyVariant}</div>
                <div class="stat-label">变异&闪</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.totalValue.toFixed(2)}</div>
                <div class="stat-label">总价值</div>
            </div>
        </div>
    `;
    collectionStats.innerHTML = statsHtml;

    // 应用筛选
    let cards = applyFilters(currentPlayer.cardCollection);

    if (cards.length === 0) {
        collectionContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-filter"></i>
                <h5>没有找到符合条件的卡牌</h5>
                <button class="btn btn-outline-primary" onclick="clearAllFilters()">显示全部</button>
            </div>
        `;
        return;
    }

    collectionContent.innerHTML = '';
    cards.forEach(card => {
        const cardElement = createCardElement(card);
        collectionContent.appendChild(cardElement);
    });
    
    // 如果批量选择模式开启，显示复选框
    if (document.getElementById('selectMode').checked) {
        document.querySelectorAll('.card-select-checkbox').forEach(cb => {
            cb.style.display = 'flex';
        });
        updateSelectedCount();
    }
}

// 应用筛选条件
function applyFilters(cards) {
    let filteredCards = [...cards];
    
    // 应用稀有度筛选
    if (currentRarityFilter !== 'all') {
        filteredCards = filteredCards.filter(card => card.rarity === currentRarityFilter);
    }
    
    // 应用特殊属性筛选
    if (currentSpecialFilter !== 'all') {
        filteredCards = filteredCards.filter(card => {
            const isShiny = card.shiny || card.isShiny;
            const isVariant = card.variant || card.isVariant;
            
            switch (currentSpecialFilter) {
                case 'shiny':
                    return isShiny && !isVariant;
                case 'variant':
                    return isVariant && !isShiny;
                case 'shinyVariant':
                    return isShiny && isVariant;
                default:
                    return true;
            }
        });
    }
    
    return filteredCards;
}

// 按特殊属性筛选
function filterBySpecial(specialFilter) {
    currentSpecialFilter = specialFilter;
    renderCollection(currentRarityFilter);
}

// 清除所有筛选
function clearAllFilters() {
    currentRarityFilter = 'all';
    currentSpecialFilter = 'all';
    renderCollection('all');
}

// 显示排行榜
async function showLeaderboard() {
    hideAllPages();
    document.getElementById('leaderboardPage').style.display = 'block';
    await loadLeaderboard();
}

// 加载排行榜数据
async function loadLeaderboard() {
    try {
        const response = await fetch(`${API_BASE}/leaderboard`);
        if (response.ok) {
            const leaderboardData = await response.json();
            window.allLeaderboardData = leaderboardData;
            renderLeaderboard(leaderboardData);
        } else {
            showToast('加载排行榜失败', 'error');
        }
    } catch (error) {
        console.error('加载排行榜失败:', error);
        showToast('网络错误，请重试', 'error');
    }
}

// 渲染排行榜
function renderLeaderboard(data) {
    const content = document.getElementById('leaderboardContent');
    const stats = document.getElementById('leaderboardStats');
    
    if (!data || data.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-trophy"></i>
                <h5>暂无排行榜数据</h5>
                <p>还没有玩家开出的卡牌</p>
            </div>
        `;
        stats.innerHTML = '';
        return;
    }
    
    // 统计信息
    const statsData = calculateLeaderboardStats(data);
    stats.innerHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${statsData.totalCards}</div>
                <div class="stat-label">总卡牌数</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${statsData.totalPlayers}</div>
                <div class="stat-label">玩家数量</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${statsData.highestPrice.toFixed(2)}</div>
                <div class="stat-label">最高价值</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${statsData.averagePrice.toFixed(2)}</div>
                <div class="stat-label">平均价值</div>
            </div>
        </div>
    `;
    
    // 渲染排行榜列表
    content.innerHTML = '';
    data.forEach((item, index) => {
        const rankElement = createLeaderboardItem(item, index + 1);
        content.appendChild(rankElement);
    });
}

// 创建排行榜项
function createLeaderboardItem(cardData, rank) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'col-12 mb-3';
    
    // 确定排名样式
    let rankClass = 'rank-other';
    let trophyIcon = '';
    if (rank === 1) {
        rankClass = 'rank-1';
        trophyIcon = '<i class="fas fa-trophy trophy-icon"></i>';
    } else if (rank === 2) {
        rankClass = 'rank-2';
        trophyIcon = '<i class="fas fa-medal trophy-icon"></i>';
    } else if (rank === 3) {
        rankClass = 'rank-3';
        trophyIcon = '<i class="fas fa-award trophy-icon"></i>';
    }
    
    // 构建特效类
    let effectClasses = '';
    const isShiny = cardData.isShiny;
    const isVariant = cardData.isVariant;
    
    if (isShiny) {
        effectClasses += ' shiny-effect';
    }
    
    if (isVariant) {
        if (cardData.variantType === 'BLACK') {
            effectClasses += ' black-variant black-effect';
            if (isShiny) {
                effectClasses += ' rainbow-border';
            }
        } else if (cardData.variantType === 'WHITE') {
            effectClasses += ' white-variant white-effect';
            if (isShiny) {
                effectClasses += ' rainbow-border';
            }
        }
    }
    
    const rarityClass = cardData.rarity ? cardData.rarity.toLowerCase() : 'common';
    const shinyBadge = isShiny ? '<span class="shiny-badge">✨ 闪卡</span>' : '';
    const variantBadge = isVariant ? '<span class="variant-badge">🎨 变异卡</span>' : '';
    
    itemDiv.innerHTML = `
        <div class="leaderboard-item">
            <div class="leaderboard-rank ${rankClass}">${rank}</div>
            ${trophyIcon}
            <div class="leaderboard-content">
                <div class="leaderboard-card-info">
                    <div class="card-item ${rarityClass}${effectClasses}" style="max-width: 300px; margin-bottom: 0;">
                        <div>
                            <div class="card-name">${cardData.cardName}</div>
                            <div class="card-attributes">
                                ${shinyBadge}
                                ${variantBadge}
                            </div>
                        </div>
                        <div>
                            <span class="card-rarity ${rarityClass}">${getRarityDisplayName(cardData.rarity)}</span>
                            <div class="card-price">
                                <i class="fas fa-coins"></i> ${cardData.actualPrice.toFixed(2)}
                            </div>
                        </div>
                    </div>
                    <div style="font-size: 0.9rem; color: #6b7280; margin-top: 5px;">
                        序列号: ${cardData.serialNumber}
                    </div>
                </div>
                <div class="leaderboard-player-info">
                    <div class="leaderboard-player-name">${cardData.playerName}</div>
                    <div style="font-size: 0.8rem; color: #6b7280;">
                        拥有者
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return itemDiv;
}

// 计算排行榜统计
function calculateLeaderboardStats(data) {
    const totalCards = data.length;
    const playerSet = new Set(data.map(item => item.playerName));
    const totalPlayers = playerSet.size;
    const prices = data.map(item => item.actualPrice);
    const highestPrice = Math.max(...prices);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    return {
        totalCards,
        totalPlayers,
        highestPrice,
        averagePrice
    };
}

// 排行榜筛选
function filterLeaderboard(filter) {
    if (!window.allLeaderboardData) return;
    
    let filteredData = [...window.allLeaderboardData];
    
    switch (filter) {
        case 'COMMON':
        case 'RARE':
        case 'EPIC':
        case 'LEGENDARY':
            filteredData = filteredData.filter(item => item.rarity === filter);
            break;
        case 'shiny':
            filteredData = filteredData.filter(item => item.isShiny);
            break;
        case 'variant':
            filteredData = filteredData.filter(item => item.isVariant && !item.isShiny);
            break;
        case 'shinyVariant':
            filteredData = filteredData.filter(item => item.isShiny && item.isVariant);
            break;
        default:
            break;
    }
    
    renderLeaderboard(filteredData);
}

// 刷新排行榜
async function refreshLeaderboard() {
    await loadLeaderboard();
}

// 计算卡牌册统计信息
function calculateCollectionStats(cards) {
    const stats = {
        total: cards.length,
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
        shiny: 0,
        variant: 0,
        shinyVariant: 0,
        totalValue: 0
    };

    cards.forEach(card => {
        // 稀有度统计
        switch (card.rarity) {
            case 'COMMON': stats.common++; break;
            case 'RARE': stats.rare++; break;
            case 'EPIC': stats.epic++; break;
            case 'LEGENDARY': stats.legendary++; break;
        }
        
        // 特殊属性统计
        const isShiny = card.shiny || card.isShiny;
        const isVariant = card.variant || card.isVariant;
        
        if (isShiny) stats.shiny++;
        if (isVariant) stats.variant++;
        if (isShiny && isVariant) stats.shinyVariant++;
        
        // 价值统计
        stats.totalValue += card.actualPrice;
    });

    return stats;
}

// 筛选卡牌册
function filterCollection(filter) {
    renderCollection(filter);
}

// 显示卡牌详情
function showCardDetail(cardId) {
    currentCardId = cardId;
    let card = currentPlayer.cardCollection.find(c => c.id === cardId);
    
    // 如果在卡牌册中找不到，尝试从开包结果中查找
    if (!card && window.currentOpenPackCards) {
        card = window.currentOpenPackCards.find(c => c.id === cardId);
    }
    
    if (!card) return;

    const detailContent = document.getElementById('cardDetailContent');
    const rarityClass = (card.rarity || 'COMMON').toLowerCase();
    const rarityDisplayName = getRarityDisplayName(card.rarity);
    
    // 构建特效类
    let effectClasses = '';
    const isShiny = card.shiny || card.isShiny;
    const isVariant = card.variant || card.isVariant;
    
    if (isShiny) {
        effectClasses += ' shiny-effect';
    }
    
    if (isVariant) {
        const variantType = card.variantType || card.variantTypeEnum;
        if (variantType === 'BLACK') {
            effectClasses += ' black-variant black-effect';
            if (isShiny) {
                effectClasses += ' rainbow-border';
            }
        } else if (variantType === 'WHITE') {
            effectClasses += ' white-variant white-effect';
            if (isShiny) {
                effectClasses += ' rainbow-border';
            }
        }
    }
    
    detailContent.innerHTML = `
        <div class="text-center">
            <div class="card-item ${rarityClass}${effectClasses} mx-auto" style="max-width: 300px;">
                <div>
                    <h4>${card.actualName || card.fixedName}</h4>
                    <div class="card-attributes mb-3">
                        ${isShiny ? '<span class="shiny-badge">✨ 闪卡</span>' : ''}
                        ${isVariant ? '<span class="variant-badge">🎨 变异卡</span>' : ''}
                    </div>
                </div>
                <div>
                    <span class="card-rarity ${rarityClass}">${rarityDisplayName}</span>
                    <div class="card-price">
                        <i class="fas fa-coins"></i> ${card.actualPrice.toFixed(2)}
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <p><strong>序列号:</strong> ${card.serialNumber}</p>
                <p><strong>基础名称:</strong> ${card.fixedName}</p>
                <p><strong>稀有度:</strong> ${rarityDisplayName}</p>
                <p><strong>基础价格:</strong> ${card.basePrice.toFixed(2)} 金币</p>
                <p><strong>实际价格:</strong> ${card.actualPrice.toFixed(2)} 金币</p>
                <p><strong>描述:</strong> ${card.description}</p>
            </div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('cardDetailModal'));
    modal.show();
}

// 出售卡牌
async function sellCard() {
    if (!currentCardId) return;

    try {
        const response = await fetch(`${API_BASE}/player/${currentPlayer.username}/sell-card?cardId=${currentCardId}`, {
            method: 'POST'
        });

        if (response.ok) {
            const result = await response.json();
            bootstrap.Modal.getInstance(document.getElementById('cardDetailModal')).hide();
            showToast(result.message, 'success');
            
            // 从卡牌册中移除已出售的卡牌
            currentPlayer.cardCollection = currentPlayer.cardCollection.filter(card => card.id !== currentCardId);
            localStorage.setItem('currentPlayer', JSON.stringify(currentPlayer));
            
            // 从开包结果中移除已出售的卡牌
            if (window.currentOpenPackCards) {
                window.currentOpenPackCards = window.currentOpenPackCards.filter(card => card.id !== currentCardId);
                
                // 重新渲染开包结果
                refreshOpenPackResult();
            }
            
            refreshPlayerInfo();
            renderCollection();
        } else {
            const error = await response.json();
            showToast(error.message, 'error');
        }
    } catch (error) {
        console.error('出售卡牌失败:', error);
        showToast('网络错误，请重试', 'error');
    }
}

// 刷新开包结果显示
function refreshOpenPackResult() {
    const resultContainer = document.getElementById('openPackResult');
    resultContainer.innerHTML = '';
    
    if (window.currentOpenPackCards && window.currentOpenPackCards.length > 0) {
        // 创建上三下二的布局
        const topRow = document.createElement('div');
        topRow.className = 'row justify-content-center mb-3';
        
        const bottomRow = document.createElement('div');
        bottomRow.className = 'row justify-content-center';
        
        // 上三张卡牌
        for (let i = 0; i < 3 && i < window.currentOpenPackCards.length; i++) {
            const cardElement = createOpenPackCardElement(window.currentOpenPackCards[i]);
            cardElement.classList.add('card-reveal');
            topRow.appendChild(cardElement);
        }
        
        // 下两张卡牌
        for (let i = 3; i < 5 && i < window.currentOpenPackCards.length; i++) {
            const cardElement = createOpenPackCardElement(window.currentOpenPackCards[i]);
            cardElement.classList.add('card-reveal');
            bottomRow.appendChild(cardElement);
        }
        
        resultContainer.appendChild(topRow);
        resultContainer.appendChild(bottomRow);
    } else {
        resultContainer.innerHTML = '<div class="text-center text-muted py-5">所有卡牌已出售</div>';
    }
}

// 隐藏所有页面
function hideAllPages() {
    document.getElementById('welcomePage').style.display = 'none';
    document.getElementById('packShopPage').style.display = 'none';
    document.getElementById('backpackPage').style.display = 'none';
    document.getElementById('collectionPage').style.display = 'none';
    document.getElementById('leaderboardPage').style.display = 'none';
}

// 显示Toast通知
function showToast(message, type = 'info') {
    const toastElement = document.getElementById('liveToast');
    const toastMessage = document.getElementById('toastMessage');
    const toastHeader = toastElement.querySelector('.toast-header');
    
    toastMessage.textContent = message;
    
    // 根据类型设置样式
    toastHeader.className = 'toast-header';
    switch (type) {
        case 'success':
            toastHeader.classList.add('bg-success', 'text-white');
            break;
        case 'error':
            toastHeader.classList.add('bg-danger', 'text-white');
            break;
        case 'warning':
            toastHeader.classList.add('bg-warning', 'text-dark');
            break;
        default:
            toastHeader.classList.add('bg-info', 'text-white');
    }
    
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

// 工具函数：格式化数字
function formatNumber(num) {
    return num.toLocaleString('zh-CN');
}

// 工具函数：获取稀有度颜色
function getRarityColor(rarity) {
    const colors = {
        'COMMON': '#6b7280',
        'RARE': '#3b82f6',
        'EPIC': '#a855f7',
        'LEGENDARY': '#f59e0b'
    };
    return colors[rarity] || '#6b7280';
}

// 工具函数：获取卡牌包类型显示名称
function getPackTypeDisplayName(packType) {
    const names = {
        'COMMON': '普通卡牌包',
        'RARE': '稀有卡牌包',
        'EPIC': '史诗卡牌包',
        'LEGENDARY': '传说卡牌包'
    };
    return names[packType] || '普通卡牌包';
}

// 工具函数：获取稀有度显示名称
function getRarityDisplayName(rarity) {
    const names = {
        'COMMON': '普通',
        'RARE': '稀有',
        'EPIC': '史诗',
        'LEGENDARY': '传说'
    };
    return names[rarity] || '普通';
}

// 作弊功能相关函数
async function checkCheatButton() {
    if (!currentPlayer) return;
    
    try {
        const response = await fetch(`${API_BASE}/player/${currentPlayer.username}/cheat-status`);
        if (response.ok) {
            const status = await response.json();
            if (status.isCheater) {
                document.getElementById('cheatBtn').style.display = 'block';
            } else {
                document.getElementById('cheatBtn').style.display = 'none';
            }
        }
    } catch (error) {
        console.error('检查作弊状态失败:', error);
    }
}

async function showCheatSettings() {
    if (!currentPlayer) return;
    
    try {
        const response = await fetch(`${API_BASE}/player/${currentPlayer.username}/cheat-status`);
        if (response.ok) {
            const status = await response.json();
            document.getElementById('guaranteedLegendary').checked = status.guaranteedLegendary;
            document.getElementById('guaranteedShiny').checked = status.guaranteedShiny;
            document.getElementById('guaranteedVariant').checked = status.guaranteedVariant;
            
            const modal = new bootstrap.Modal(document.getElementById('cheatModal'));
            modal.show();
        }
    } catch (error) {
        console.error('获取作弊设置失败:', error);
        showToast('获取作弊设置失败', 'error');
    }
}

async function updateCheatSettings() {
    if (!currentPlayer) return;
    
    const guaranteedLegendary = document.getElementById('guaranteedLegendary').checked;
    const guaranteedShiny = document.getElementById('guaranteedShiny').checked;
    const guaranteedVariant = document.getElementById('guaranteedVariant').checked;
    
    try {
        const response = await fetch(`${API_BASE}/player/${currentPlayer.username}/cheat-settings?guaranteedLegendary=${guaranteedLegendary}&guaranteedShiny=${guaranteedShiny}&guaranteedVariant=${guaranteedVariant}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            bootstrap.Modal.getInstance(document.getElementById('cheatModal')).hide();
            showToast(result.message, 'success');
        } else {
            const error = await response.json();
            showToast(error.message, 'error');
        }
    } catch (error) {
        console.error('更新作弊设置失败:', error);
        showToast('网络错误，请重试', 'error');
    }
}

// 批量选择相关函数
function toggleSelectMode() {
    const selectMode = document.getElementById('selectMode').checked;
    const bulkActions = document.getElementById('bulkActions');
    const checkboxes = document.querySelectorAll('.card-select-checkbox');
    
    if (selectMode) {
        bulkActions.style.display = 'block';
        checkboxes.forEach(cb => {
            cb.style.display = 'flex';
            // 添加淡入动画
            cb.style.opacity = '0';
            setTimeout(() => {
                cb.style.transition = 'opacity 0.3s ease';
                cb.style.opacity = '1';
            }, 50);
        });
    } else {
        bulkActions.style.display = 'none';
        checkboxes.forEach(cb => {
            cb.style.display = 'none';
            cb.querySelector('input').checked = false;
            // 移除选中样式
            cb.closest('.card-item').classList.remove('selected');
        });
        updateSelectedCount();
    }
}

function selectAllCards() {
    const checkboxes = document.querySelectorAll('.card-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = true;
        cb.closest('.card-item').classList.add('selected');
    });
    updateSelectedCount();
}

function deselectAllCards() {
    const checkboxes = document.querySelectorAll('.card-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = false;
        cb.closest('.card-item').classList.remove('selected');
    });
    updateSelectedCount();
}

function selectByRarity(rarity) {
    const checkboxes = document.querySelectorAll('.card-checkbox');
    checkboxes.forEach(cb => {
        const cardElement = cb.closest('.card-item');
        const cardRarity = cardElement.dataset.cardRarity;
        const shouldSelect = cardRarity === rarity;
        cb.checked = shouldSelect;
        if (shouldSelect) {
            cardElement.classList.add('selected');
        } else {
            cardElement.classList.remove('selected');
        }
    });
    updateSelectedCount();
}

function updateSelectedCount() {
    const checkedBoxes = document.querySelectorAll('.card-checkbox:checked');
    document.getElementById('selectedCount').textContent = checkedBoxes.length;
}

async function sellSelectedCards() {
    const checkedBoxes = document.querySelectorAll('.card-checkbox:checked');
    const keepOneCopy = document.getElementById('keepOneCopy').checked;
    
    if (checkedBoxes.length === 0) {
        showToast('请选择要出售的卡牌', 'warning');
        return;
    }
    
    const selectedCardIds = [];
    const cardNames = {};
    
    checkedBoxes.forEach(cb => {
        const cardId = parseInt(cb.value);
        const cardElement = cb.closest('.card-item');
        const cardName = cardElement.dataset.cardName;
        
        selectedCardIds.push(cardId);
        cardNames[cardId] = cardName;
    });
    
    // 如果选择了至少保留一张，则筛选出需要保留的卡牌
    let cardsToSell = selectedCardIds;
    if (keepOneCopy) {
        cardsToSell = filterCardsToKeepOne(selectedCardIds, cardNames);
    }
    
    if (cardsToSell.length === 0) {
        showToast('没有可出售的卡牌（已保留每种一张）', 'info');
        return;
    }
    
    try {
        // 使用批量出售API
        const response = await fetch(`${API_BASE}/player/${currentPlayer.username}/sell-cards-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cardsToSell)
        });
        
        if (response.ok) {
            const result = await response.json();
            
            if (result.success) {
                // 从本地数据中移除已出售的卡牌
                currentPlayer.cardCollection = currentPlayer.cardCollection.filter(card => 
                    !result.successfulIds.includes(card.id)
                );
                
                localStorage.setItem('currentPlayer', JSON.stringify(currentPlayer));
                showToast(result.message, 'success');
                refreshPlayerInfo();
                renderCollection();
                // 关闭批量选择模式
                document.getElementById('selectMode').checked = false;
                toggleSelectMode();
            } else {
                showToast(result.message || '出售失败', 'error');
            }
        } else {
            const error = await response.json();
            showToast(error.message || '出售失败，请重试', 'error');
        }
    } catch (error) {
        console.error('批量出售卡牌失败:', error);
        showToast('网络错误，请重试', 'error');
    }
}

function filterCardsToKeepOne(cardIds, cardNames) {
    const nameCount = {};
    const cardsToSell = [];
    
    // 统计每种卡牌的数量
    cardIds.forEach(id => {
        const name = cardNames[id];
        nameCount[name] = (nameCount[name] || 0) + 1;
    });
    
    // 找出需要保留的卡牌（每种保留一张）
    const cardsToKeep = new Set();
    Object.keys(nameCount).forEach(name => {
        if (nameCount[name] > 1) {
            // 这种卡牌有多张，需要保留一张
            // 找到第一张这种卡牌的ID
            for (const id of cardIds) {
                if (cardNames[id] === name) {
                    cardsToKeep.add(id);
                    break;
                }
            }
        } else if (nameCount[name] === 1) {
            // 这种卡牌只有一张，保留
            cardsToKeep.add(cardIds.find(id => cardNames[id] === name));
        }
    });
    
    // 返回需要出售的卡牌（排除需要保留的）
    return cardIds.filter(id => !cardsToKeep.has(id));
}