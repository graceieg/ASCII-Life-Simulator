import React, { useState, useEffect, useCallback } from 'react';
import GameLegend from './components/GameLegend';

// Game configuration - Dynamic grid sizes per level
const LEVEL_GRID_SIZES = [12, 16, 20];
const CELL_EMPTY = ' ';
const CELL_PLAYER = '@';
const CELL_WALL = '#';
const CELL_ITEM = '*';
const CELL_NPC = '&';
const CELL_ENEMY = 'E';
const CELL_KEY = 'K';
const CELL_DOOR = 'D';
const CELL_POTION = 'P';
const CELL_WEAPON = 'W';
const CELL_TELEPORTER = 'T';
const CELL_SWITCH = 'S';
const CELL_TREASURE = '$';

// Item types
interface Item {
  x: number;
  y: number;
  type: 'item' | 'key' | 'potion' | 'weapon' | 'treasure';
  id?: string;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  movePattern: 'random' | 'patrol' | 'chase';
  patrolPath?: { x: number; y: number }[];
  patrolIndex?: number;
  lastMove?: number;
}

interface Door {
  x: number;
  y: number;
  keyId: string;
  isOpen: boolean;
}

interface Teleporter {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  id: string;
}

interface Switch {
  x: number;
  y: number;
  isActive: boolean;
  affects: string;
}

// NPC dialogues with context
const NPC_DIALOGUES = {
  merchant: [
    "Welcome, traveler! I have potions for sale.",
    "Beware the enemies ahead, they're dangerous!",
    "I've heard rumors of great treasure beyond the doors.",
    "Keys are precious here, guard them well!"
  ],
  guard: [
    "Halt! This area is dangerous.",
    "The enemies grow stronger each level.",
    "Find the switches to unlock new areas.",
    "Combat tip: Attack enemies by walking into them!"
  ],
  sage: [
    "The teleporters will aid your journey.",
    "Some doors require special keys to open.",
    "Collect potions to restore your health.",
    "The treasure is well guarded..."
  ]
};

// Level configurations with progressively larger grids and more complex mechanics
const LEVELS = [
  {
    name: "Training Grounds",
    gridSize: 12,
    walls: [
      { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
      { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 },
      { x: 2, y: 7 }, { x: 3, y: 8 }, { x: 4, y: 9 }
    ],
    npcs: [
      { x: 2, y: 2, type: 'guard' },
      { x: 9, y: 8, type: 'merchant' }
    ],
    items: [
      { x: 6, y: 2, type: 'item', id: 'coin1' },
      { x: 8, y: 3, type: 'potion', id: 'health1' },
      { x: 3, y: 6, type: 'weapon', id: 'sword1' },
      { x: 5, y: 8, type: 'treasure', id: 'treasure1' }
    ],
    enemies: [
      { x: 6, y: 6, health: 2, movePattern: 'random' },
      { x: 8, y: 7, health: 1, movePattern: 'patrol', patrolPath: [{ x: 8, y: 7 }, { x: 9, y: 7 }, { x: 9, y: 6 }, { x: 8, y: 6 }], patrolIndex: 0 }
    ],
    doors: [],
    teleporters: [],
    switches: [],
    playerStart: { x: 1, y: 1 },
    objective: "Collect all items and defeat enemies"
  },
  {
    name: "The Locked Chambers",
    gridSize: 16,
    walls: [
      // Main hall walls - creating distinct rooms
      { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }, { x: 10, y: 5 }, { x: 11, y: 5 }, { x: 12, y: 5 }, { x: 13, y: 5 }, { x: 14, y: 5 },
      
      // Red Key Room (Northwest) - sealed chamber
      { x: 1, y: 6 }, { x: 1, y: 7 }, { x: 1, y: 8 }, { x: 1, y: 9 },
      { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, { x: 5, y: 9 },
      { x: 5, y: 8 }, { x: 5, y: 7 }, { x: 5, y: 6 },
      
      // Blue Key Treasure Vault (Northeast) - valuable items behind blue door
      { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 }, { x: 9, y: 9 },
      { x: 10, y: 9 }, { x: 11, y: 9 }, { x: 12, y: 9 }, { x: 13, y: 9 }, { x: 14, y: 9 },
      { x: 14, y: 8 }, { x: 14, y: 7 }, { x: 14, y: 6 },
      
      // Central maze area
      { x: 3, y: 11 }, { x: 4, y: 11 }, { x: 5, y: 11 }, { x: 7, y: 11 }, { x: 8, y: 11 }, { x: 9, y: 11 },
      { x: 6, y: 12 }, { x: 6, y: 13 },
      
      // Boss Chamber (South) - final challenge area
      { x: 10, y: 11 }, { x: 11, y: 11 }, { x: 12, y: 11 }, { x: 13, y: 11 }, { x: 14, y: 11 },
      { x: 10, y: 12 }, { x: 14, y: 12 },
      { x: 10, y: 13 }, { x: 14, y: 13 },
      { x: 10, y: 14 }, { x: 11, y: 14 }, { x: 12, y: 14 }, { x: 13, y: 14 }, { x: 14, y: 14 }
    ],
    npcs: [
      { x: 7, y: 3, type: 'sage' },
      { x: 13, y: 2, type: 'guard' },
      { x: 2, y: 13, type: 'merchant' }
    ],
    items: [
      // Keys in accessible starting areas
      { x: 3, y: 2, type: 'key', id: 'redkey' },
      { x: 12, y: 3, type: 'key', id: 'bluekey' },
      
      // Red Key Room rewards (valuable but not treasure)
      { x: 2, y: 7, type: 'weapon', id: 'iron_sword' },
      { x: 4, y: 7, type: 'potion', id: 'health_potion' },
      { x: 3, y: 8, type: 'key', id: 'greenkey' }, // Green key hidden in red room
      
      // Blue Key Vault rewards (high value items)
      { x: 11, y: 7, type: 'treasure', id: 'vault_treasure' },
      { x: 13, y: 7, type: 'weapon', id: 'magic_sword' },
      { x: 12, y: 8, type: 'potion', id: 'mega_potion' },
      
      // Boss Chamber rewards (ultimate treasure)
      { x: 12, y: 12, type: 'treasure', id: 'boss_treasure' },
      
      // Maze area items
      { x: 8, y: 12, type: 'potion', id: 'health_boost' }
    ],
    enemies: [
      // Entrance guards
      { x: 4, y: 3, health: 2, movePattern: 'patrol', patrolPath: [{ x: 4, y: 3 }, { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 4, y: 4 }], patrolIndex: 0 },
      { x: 10, y: 3, health: 2, movePattern: 'patrol', patrolPath: [{ x: 10, y: 3 }, { x: 11, y: 3 }, { x: 11, y: 4 }, { x: 10, y: 4 }], patrolIndex: 0 },
      
      // Red room guardian
      { x: 3, y: 7, health: 3, movePattern: 'random' },
      
      // Vault guardians (stronger)
      { x: 11, y: 6, health: 4, movePattern: 'chase' },
      { x: 13, y: 8, health: 3, movePattern: 'random' },
      
      // Boss chamber elite guard
      { x: 12, y: 13, health: 5, movePattern: 'chase' },
      
      // Maze area enemies
      { x: 7, y: 12, health: 2, movePattern: 'random' }
    ],
    doors: [
      // Red Key Room entrance
      { x: 3, y: 6, keyId: 'redkey', isOpen: false },
      
      // Blue Key Vault entrance  
      { x: 12, y: 6, keyId: 'bluekey', isOpen: false },
      
      // Boss Chamber entrance (requires green key from red room)
      { x: 12, y: 11, keyId: 'greenkey', isOpen: false }
    ],
    teleporters: [
      { x: 1, y: 12, targetX: 14, targetY: 2, id: 'portal1' },
      { x: 14, y: 2, targetX: 1, targetY: 12, id: 'portal2' }
    ],
    switches: [
      { x: 1, y: 14, isActive: false, affects: 'maze_walls' },
      { x: 14, y: 14, isActive: false, affects: 'vault_doors' }
    ],
    playerStart: { x: 7, y: 1 },
    objective: "Find keys to unlock chambers and collect all treasures"
  },
  {
    name: "The Final Challenge",
    gridSize: 20,
    walls: [
      // Entrance Hall (rows 1-6)
      { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 }, { x: 15, y: 6 }, { x: 16, y: 6 }, { x: 17, y: 6 }, { x: 18, y: 6 },
      
      // West Wing - Armory (sealed with master key)
      { x: 1, y: 7 }, { x: 1, y: 8 }, { x: 1, y: 9 }, { x: 1, y: 10 }, { x: 1, y: 11 },
      { x: 2, y: 11 }, { x: 3, y: 11 }, { x: 4, y: 11 }, { x: 5, y: 11 }, { x: 6, y: 11 }, { x: 7, y: 11 },
      { x: 7, y: 10 }, { x: 7, y: 9 }, { x: 7, y: 8 }, { x: 7, y: 7 },
      
      // East Wing - Treasury (sealed with boss key)  
      { x: 12, y: 7 }, { x: 12, y: 8 }, { x: 12, y: 9 }, { x: 12, y: 10 }, { x: 12, y: 11 },
      { x: 13, y: 11 }, { x: 14, y: 11 }, { x: 15, y: 11 }, { x: 16, y: 11 }, { x: 17, y: 11 }, { x: 18, y: 11 },
      { x: 18, y: 10 }, { x: 18, y: 9 }, { x: 18, y: 8 }, { x: 18, y: 7 },
      
      // Central Corridor
      { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 },
      
      // Vault Antechamber (middle section)
      { x: 3, y: 13 }, { x: 4, y: 13 }, { x: 5, y: 13 }, { x: 6, y: 13 }, { x: 7, y: 13 }, { x: 8, y: 13 }, { x: 11, y: 13 }, { x: 12, y: 13 }, { x: 13, y: 13 }, { x: 14, y: 13 }, { x: 15, y: 13 }, { x: 16, y: 13 },
      
      // Inner Vault (requires vault key)
      { x: 6, y: 14 }, { x: 6, y: 15 }, { x: 6, y: 16 },
      { x: 7, y: 16 }, { x: 8, y: 16 }, { x: 9, y: 16 }, { x: 10, y: 16 }, { x: 11, y: 16 }, { x: 12, y: 16 }, { x: 13, y: 16 },
      { x: 13, y: 15 }, { x: 13, y: 14 },
      
      // Boss Chamber (bottom section - requires boss key)
      { x: 7, y: 17 }, { x: 8, y: 17 }, { x: 11, y: 17 }, { x: 12, y: 17 },
      { x: 7, y: 18 }, { x: 12, y: 18 }
    ],
    npcs: [
      { x: 9, y: 3, type: 'sage' },
      { x: 3, y: 4, type: 'guard' },
      { x: 16, y: 4, type: 'merchant' },
      { x: 9, y: 12, type: 'sage' }
    ],
    items: [
      // Starting area keys
      { x: 5, y: 2, type: 'key', id: 'masterkey' },
      { x: 14, y: 2, type: 'key', id: 'bosskey' },
      { x: 9, y: 4, type: 'potion', id: 'entrance_potion' },
      
      // West Wing Armory rewards (master key required)
      { x: 3, y: 8, type: 'weapon', id: 'legendary_sword' },
      { x: 5, y: 9, type: 'weapon', id: 'magic_shield' },
      { x: 4, y: 10, type: 'potion', id: 'power_potion' },
      { x: 2, y: 9, type: 'key', id: 'vaultkey' }, // Vault key hidden in armory
      
      // East Wing Treasury rewards (boss key required)
      { x: 15, y: 8, type: 'treasure', id: 'golden_crown' },
      { x: 17, y: 9, type: 'treasure', id: 'ruby_staff' },
      { x: 16, y: 10, type: 'potion', id: 'elixir_of_life' },
      { x: 14, y: 8, type: 'key', id: 'bosskey2' }, // Second boss key for boss chamber
      
      // Central Vault rewards (vault key required)
      { x: 9, y: 15, type: 'treasure', id: 'ultimate_treasure' },
      { x: 10, y: 15, type: 'weapon', id: 'godly_blade' },
      
      // Boss Chamber final reward
      { x: 10, y: 18, type: 'treasure', id: 'victory_crown' },
      
      // Scattered items in accessible areas
      { x: 2, y: 12, type: 'potion', id: 'health_boost' },
      { x: 17, y: 12, type: 'potion', id: 'mana_boost' }
    ],
    enemies: [
      // Entrance guards
      { x: 6, y: 4, health: 3, movePattern: 'patrol', patrolPath: [{ x: 6, y: 4 }, { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 6, y: 5 }], patrolIndex: 0 },
      { x: 13, y: 4, health: 3, movePattern: 'patrol', patrolPath: [{ x: 13, y: 4 }, { x: 12, y: 4 }, { x: 12, y: 5 }, { x: 13, y: 5 }], patrolIndex: 0 },
      
      // West Wing guardians (armory defenders)
      { x: 3, y: 9, health: 4, movePattern: 'chase' },
      { x: 5, y: 8, health: 3, movePattern: 'random' },
      
      // East Wing guardians (treasury defenders)
      { x: 15, y: 9, health: 4, movePattern: 'chase' },
      { x: 17, y: 8, health: 3, movePattern: 'random' },
      
      // Central corridor patrol (moved to accessible area)
      { x: 9, y: 5, health: 5, movePattern: 'patrol', patrolPath: [{ x: 9, y: 5 }, { x: 10, y: 5 }, { x: 10, y: 4 }, { x: 9, y: 4 }], patrolIndex: 0 },
      
      // Vault guardians (elite)
      { x: 8, y: 15, health: 6, movePattern: 'chase' },
      { x: 11, y: 15, health: 6, movePattern: 'chase' },
      
      // Final Boss
      { x: 9, y: 18, health: 10, movePattern: 'chase' },
      
      // Roaming guards in accessible areas
      { x: 2, y: 2, health: 2, movePattern: 'random' },
      { x: 17, y: 2, health: 2, movePattern: 'random' }
    ],
    doors: [
      // Main entrance to fortress halls
      { x: 9, y: 6, keyId: 'none', isOpen: true }, // Open passage
      
      // West Wing Armory entrance
      { x: 4, y: 7, keyId: 'masterkey', isOpen: false },
      
      // East Wing Treasury entrance  
      { x: 15, y: 7, keyId: 'bosskey', isOpen: false },
      
      // Central Vault entrance (requires vault key from armory)
      { x: 9, y: 13, keyId: 'vaultkey', isOpen: false },
      
      // Final Boss Chamber entrance (needs second boss key)
      { x: 9, y: 17, keyId: 'bosskey2', isOpen: false }
    ],
    teleporters: [
      { x: 1, y: 2, targetX: 18, targetY: 2, id: 'portal1' },
      { x: 18, y: 2, targetX: 1, targetY: 2, id: 'portal2' },
      { x: 1, y: 12, targetX: 18, targetY: 12, id: 'portal3' },
      { x: 18, y: 12, targetX: 1, targetY: 12, id: 'portal4' }
    ],
    switches: [
      { x: 1, y: 5, isActive: false, affects: 'armory_access' },
      { x: 18, y: 5, isActive: false, affects: 'treasury_access' },
      { x: 1, y: 14, isActive: false, affects: 'vault_security' },
      { x: 18, y: 14, isActive: false, affects: 'boss_weakness' }
    ],
    playerStart: { x: 9, y: 1 },
    objective: "Unlock the fortress wings, gather powerful equipment, and defeat the final boss"
  }
];

interface GameState {
  grid: string[][];
  playerPos: { x: number; y: number };
  playerHealth: number;
  maxHealth: number;
  inventory: { [key: string]: number };
  score: number;
  message: string;
  npcs: { x: number; y: number; type: string }[];
  items: Item[];
  enemies: Enemy[];
  doors: Door[];
  teleporters: Teleporter[];
  switches: Switch[];
  level: number;
  maxLevel: number;
  weapon: string | null;
  gameTime: number;
  gridSize: number;
}

  const initializeLevel = (levelIndex: number) => {
    const levelConfig = LEVELS[levelIndex];
    const gridSize = levelConfig.gridSize;
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(CELL_EMPTY));
    
    // Add walls around the border
    for (let i = 0; i < gridSize; i++) {
      grid[0][i] = CELL_WALL;
      grid[gridSize - 1][i] = CELL_WALL;
      grid[i][0] = CELL_WALL;
      grid[i][gridSize - 1] = CELL_WALL;
    }
    
    // Add level-specific walls
    levelConfig.walls.forEach(wall => {
      grid[wall.y][wall.x] = CELL_WALL;
    });
    
    // Place doors
    levelConfig.doors.forEach(door => {
      grid[door.y][door.x] = CELL_DOOR;
    });
    
    // Place teleporters
    levelConfig.teleporters.forEach(teleporter => {
      grid[teleporter.y][teleporter.x] = CELL_TELEPORTER;
    });
    
    // Place switches
    levelConfig.switches.forEach(switchObj => {
      grid[switchObj.y][switchObj.x] = CELL_SWITCH;
    });
    
    // Place NPCs
    levelConfig.npcs.forEach(npc => {
      grid[npc.y][npc.x] = CELL_NPC;
    });
    
    // Place items
    levelConfig.items.forEach(item => {
      const symbol = item.type === 'key' ? CELL_KEY : 
                    item.type === 'potion' ? CELL_POTION :
                    item.type === 'weapon' ? CELL_WEAPON :
                    item.type === 'treasure' ? CELL_TREASURE :
                    CELL_ITEM;
      grid[item.y][item.x] = symbol;
    });
    
    // Place enemies
    levelConfig.enemies.forEach(enemy => {
      grid[enemy.y][enemy.x] = CELL_ENEMY;
    });
    
    // Player starting position
    const playerPos = levelConfig.playerStart;
    grid[playerPos.y][playerPos.x] = CELL_PLAYER;
    
    return {
      grid,
      playerPos,
      npcs: [...levelConfig.npcs],
      items: [...levelConfig.items],
      enemies: levelConfig.enemies.map(e => ({ ...e, lastMove: 0 })),
      doors: [...levelConfig.doors],
      teleporters: [...levelConfig.teleporters],
      switches: [...levelConfig.switches],
      gridSize
    };
  };

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const levelData = initializeLevel(0);
    
    return {
      ...levelData,
      playerHealth: 10,
      maxHealth: 10,
      inventory: {},
      score: 0,
      level: 1,
      maxLevel: LEVELS.length,
      weapon: null,
      gameTime: 0,
      gridSize: LEVELS[0].gridSize,
      message: `Level 1: ${LEVELS[0].name} - ${LEVELS[0].objective}`
    };
  });

  // Enemy AI and movement
  const moveEnemies = useCallback(() => {
    setGameState(prevState => {
      const newEnemies = prevState.enemies.map(enemy => {
        const currentTime = Date.now();
        if (currentTime - (enemy.lastMove || 0) < 1000) return enemy; // Move every second
        
        let newX = enemy.x;
        let newY = enemy.y;
        
        if (enemy.movePattern === 'random') {
          const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          const [dx, dy] = directions[Math.floor(Math.random() * directions.length)];
          newX = enemy.x + dx;
          newY = enemy.y + dy;
        } else if (enemy.movePattern === 'patrol' && enemy.patrolPath) {
          const nextIndex = ((enemy.patrolIndex || 0) + 1) % enemy.patrolPath.length;
          const nextPos = enemy.patrolPath[nextIndex];
          newX = nextPos.x;
          newY = nextPos.y;
          enemy.patrolIndex = nextIndex;
        } else if (enemy.movePattern === 'chase') {
          const dx = prevState.playerPos.x - enemy.x;
          const dy = prevState.playerPos.y - enemy.y;
          if (Math.abs(dx) > Math.abs(dy)) {
            newX = enemy.x + Math.sign(dx);
          } else {
            newY = enemy.y + Math.sign(dy);
          }
        }
        
        // Check if new position is valid
        if (newX > 0 && newX < prevState.gridSize - 1 && newY > 0 && newY < prevState.gridSize - 1) {
          const targetCell = prevState.grid[newY][newX];
          if (targetCell === CELL_EMPTY || targetCell === CELL_PLAYER) {
            return { ...enemy, x: newX, y: newY, lastMove: currentTime };
          }
        }
        
        return { ...enemy, lastMove: currentTime };
      });
      
      // Update grid with new enemy positions
      const newGrid = prevState.grid.map(row => [...row]);
      
      // Clear old enemy positions
      prevState.enemies.forEach(enemy => {
        if (newGrid[enemy.y][enemy.x] === CELL_ENEMY) {
          newGrid[enemy.y][enemy.x] = CELL_EMPTY;
        }
      });
      
      // Place enemies in new positions
      newEnemies.forEach(enemy => {
        if (newGrid[enemy.y][enemy.x] === CELL_EMPTY) {
          newGrid[enemy.y][enemy.x] = CELL_ENEMY;
        }
      });
      
      // Replace player if they weren't overwritten
      newGrid[prevState.playerPos.y][prevState.playerPos.x] = CELL_PLAYER;
      
      return {
        ...prevState,
        grid: newGrid,
        enemies: newEnemies
      };
    });
  }, []);

  const movePlayer = useCallback((dx: number, dy: number) => {
    setGameState(prevState => {
      const newX = prevState.playerPos.x + dx;
      const newY = prevState.playerPos.y + dy;
      
      // Check boundaries
      if (newX < 0 || newX >= prevState.gridSize || newY < 0 || newY >= prevState.gridSize) {
        return prevState;
      }
      
      const targetCell = prevState.grid[newY][newX];
      
      // Check for walls
      if (targetCell === CELL_WALL) {
        return { ...prevState, message: "You can't walk through walls!" };
      }
      
      // Check for doors
      if (targetCell === CELL_DOOR) {
        const door = prevState.doors.find(d => d.x === newX && d.y === newY);
        if (door && !door.isOpen) {
          if (door.keyId === 'none' || prevState.inventory[door.keyId]) {
            // Open door with key (or if no key required)
            const newDoors = prevState.doors.map(d => 
              d.x === newX && d.y === newY ? { ...d, isOpen: true } : d
            );
            const newInventory = { ...prevState.inventory };
            if (door.keyId !== 'none') {
              newInventory[door.keyId]--;
              if (newInventory[door.keyId] === 0) delete newInventory[door.keyId];
            }
            
            const newGrid = prevState.grid.map(row => [...row]);
            newGrid[newY][newX] = CELL_EMPTY;
            
            return {
              ...prevState,
              doors: newDoors,
              inventory: newInventory,
              grid: newGrid,
              message: door.keyId === 'none' ? "Door opened!" : "Door unlocked!"
            };
          } else {
            return { ...prevState, message: `You need a ${door.keyId} to open this door!` };
          }
        }
      }
      
      // Create new grid and state
      const newGrid = prevState.grid.map(row => [...row]);
      let newMessage = "";
      let newInventory = { ...prevState.inventory };
      let newScore = prevState.score;
      let newItems = [...prevState.items];
      let newHealth = prevState.playerHealth;
      let newWeapon = prevState.weapon;
      let newEnemies = [...prevState.enemies];
      let newSwitches = [...prevState.switches];
      
      // Clear old player position
      newGrid[prevState.playerPos.y][prevState.playerPos.x] = CELL_EMPTY;
      
      // Handle combat with enemies
      if (targetCell === CELL_ENEMY) {
        const enemy = prevState.enemies.find(e => e.x === newX && e.y === newY);
        if (enemy) {
          const damage = newWeapon ? 3 : 1;
          enemy.health -= damage;
          if (enemy.health <= 0) {
            newEnemies = newEnemies.filter(e => !(e.x === newX && e.y === newY));
            newScore += 20;
            newMessage = `Enemy defeated! +20 points`;
          } else {
            newHealth -= 2;
            newMessage = `You attack the enemy! Enemy health: ${enemy.health}. You take 2 damage!`;
          }
        }
      }
      
      // Handle item collection
      else if ([CELL_ITEM, CELL_KEY, CELL_POTION, CELL_WEAPON, CELL_TREASURE].includes(targetCell)) {
        const item = prevState.items.find(i => i.x === newX && i.y === newY);
        if (item) {
          if (item.type === 'key') {
            newInventory[item.id!] = (newInventory[item.id!] || 0) + 1;
            newMessage = `Found ${item.id}!`;
            newScore += 5;
          } else if (item.type === 'potion') {
            newHealth = Math.min(prevState.maxHealth, newHealth + 5);
            newMessage = `Health restored! +5 HP`;
            newScore += 5;
          } else if (item.type === 'weapon') {
            newWeapon = item.id!;
            newMessage = `Weapon acquired: ${item.id}!`;
            newScore += 15;
          } else if (item.type === 'treasure') {
            newScore += 50;
            newMessage = `Treasure found! +50 points`;
          } else {
            newScore += 10;
            newMessage = `Item collected! +10 points`;
          }
          
          newItems = newItems.filter(i => !(i.x === newX && i.y === newY));
        }
      }
      
      // Handle teleporters
      else if (targetCell === CELL_TELEPORTER) {
        const teleporter = prevState.teleporters.find(t => t.x === newX && t.y === newY);
        if (teleporter) {
          newMessage = "Teleported!";
          return {
            ...prevState,
            playerPos: { x: teleporter.targetX, y: teleporter.targetY },
            message: newMessage
          };
        }
      }
      
      // Handle switches
      else if (targetCell === CELL_SWITCH) {
        const switchIndex = prevState.switches.findIndex(s => s.x === newX && s.y === newY);
        if (switchIndex !== -1) {
          newSwitches[switchIndex] = { ...newSwitches[switchIndex], isActive: !newSwitches[switchIndex].isActive };
          newMessage = `Switch ${newSwitches[switchIndex].isActive ? 'activated' : 'deactivated'}!`;
        }
      }
      
      // Handle NPC interaction
      else if (targetCell === CELL_NPC) {
        const npc = prevState.npcs.find(n => n.x === newX && n.y === newY);
        if (npc) {
          const dialogues = NPC_DIALOGUES[npc.type as keyof typeof NPC_DIALOGUES] || ["Hello there!"];
          const randomDialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
          newMessage = randomDialogue;
        }
        // Restore NPC on grid
        newGrid[newY][newX] = CELL_NPC;
      }
      
      // Check if player died
      if (newHealth <= 0) {
        return {
          ...prevState,
          playerHealth: 0,
          message: "Game Over! Press R to restart."
        };
      }
      
      // Place player in new position (unless it's an NPC cell)
      if (targetCell !== CELL_NPC) {
        newGrid[newY][newX] = CELL_PLAYER;
      }
      
      // Check if level is complete (all treasures collected and no enemies)
      const treasuresRemaining = newItems.filter(i => i.type === 'treasure').length;
      const enemiesRemaining = newEnemies.length;
      
      if (treasuresRemaining === 0 && enemiesRemaining === 0) {
        if (prevState.level < prevState.maxLevel) {
          // Advance to next level
          const nextLevelIndex = prevState.level;
          const levelData = initializeLevel(nextLevelIndex);
          const currentLevel = prevState.level + 1;
          
          return {
            ...levelData,
            playerHealth: Math.min(prevState.maxHealth, newHealth + 5), // Heal on level up
            maxHealth: prevState.maxHealth,
            inventory: newInventory,
            score: newScore + 100, // Bonus for completing level
            level: currentLevel,
            maxLevel: prevState.maxLevel,
            weapon: newWeapon,
            gameTime: prevState.gameTime,
            message: `Level Complete! Advancing to Level ${currentLevel}: ${LEVELS[nextLevelIndex].name}`
          };
        } else {
          newMessage = "Victory! You completed all levels!";
        }
      }
      
      return {
        ...prevState,
        grid: newGrid,
        playerPos: { x: newX, y: newY },
        playerHealth: newHealth,
        inventory: newInventory,
        score: newScore,
        message: newMessage || prevState.message,
        items: newItems,
        enemies: newEnemies,
        switches: newSwitches,
        weapon: newWeapon
      };
    });
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameState.playerHealth <= 0) return;
      
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          movePlayer(0, -1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          movePlayer(0, 1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          movePlayer(-1, 0);
          break;
        case 'ArrowRight':
          event.preventDefault();
          movePlayer(1, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePlayer, gameState.playerHealth]);

  // Enemy movement timer
  useEffect(() => {
    if (gameState.playerHealth <= 0) return;
    
    const interval = setInterval(moveEnemies, 1000);
    return () => clearInterval(interval);
  }, [moveEnemies, gameState.playerHealth]);

  // Game timer
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => ({ ...prev, gameTime: prev.gameTime + 1 }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Restart functionality
  const restartGame = useCallback(() => {
    const levelData = initializeLevel(0);
    setGameState({
      ...levelData,
      playerHealth: 10,
      maxHealth: 10,
      inventory: {},
      score: 0,
      level: 1,
      maxLevel: LEVELS.length,
      weapon: null,
      gameTime: 0,
      gridSize: LEVELS[0].gridSize,
      message: `Level 1: ${LEVELS[0].name} - ${LEVELS[0].objective}`
    });
  }, []);

  // Handle restart key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'r' || event.key === 'R') {
        restartGame();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [restartGame]);

  // Render the grid
  const renderGrid = () => {
    return gameState.grid.map(row => row.join('')).join('\n');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="size-full flex items-center justify-center bg-gray-50 text-gray-700 p-4">
      <div className="text-center space-y-4 max-w-5xl w-full">
        <h1 className="text-gray-800 mb-4">ASCII Life Simulator</h1>
        
        <div className="bg-white p-4 rounded border border-gray-300 shadow-sm">
          <pre className={`font-mono leading-tight text-gray-800 ${
            gameState.gridSize <= 12 ? 'text-base' : 
            gameState.gridSize <= 16 ? 'text-sm' : 
            'text-xs'
          }`}>
            {renderGrid()}
          </pre>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-100 p-3 rounded border border-gray-200">
            <div className="space-y-1">
              <div>Level: {gameState.level}/{gameState.maxLevel}</div>
              <div>Grid: {gameState.gridSize}x{gameState.gridSize}</div>
              <div>Health: {gameState.playerHealth}/{gameState.maxHealth}</div>
              <div>Score: {gameState.score}</div>
              <div>Time: {formatTime(gameState.gameTime)}</div>
              {gameState.weapon && <div>Weapon: {gameState.weapon}</div>}
            </div>
          </div>
          
          <div className="bg-gray-100 p-3 rounded border border-gray-200">
            <div>Inventory:</div>
            {Object.keys(gameState.inventory).length > 0 ? (
              Object.entries(gameState.inventory).map(([key, count]) => (
                <div key={key}>{key}: {count}</div>
              ))
            ) : (
              <div className="text-gray-500">Empty</div>
            )}
          </div>
          
          <div className="bg-gray-100 p-3 rounded border border-gray-200">
            <div>Status:</div>
            <div>Enemies: {gameState.enemies.length}</div>
            <div>Treasures: {gameState.items.filter(i => i.type === 'treasure').length}</div>
            <div>Items: {gameState.items.filter(i => i.type !== 'treasure').length}</div>
          </div>
        </div>
        
        <div className="bg-gray-100 p-3 rounded border border-gray-200 max-w-2xl mx-auto">
          <p className="text-gray-700">{gameState.message}</p>
        </div>
        
        <GameLegend />
        
        {gameState.level > gameState.maxLevel && (
          <div className="bg-blue-50 text-blue-800 p-3 rounded border border-blue-200">
            <p>Victory! All levels conquered!</p>
          </div>
        )}
        
        {gameState.playerHealth <= 0 && (
          <div className="bg-red-50 text-red-800 p-3 rounded border border-red-200">
            <p>Game Over! Press R to restart.</p>
          </div>
        )}
      </div>
    </div>
  );
}