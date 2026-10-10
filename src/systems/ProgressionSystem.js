export function awardXP(player, amount) {
  player.xp += Math.max(0, Math.floor(amount));
  const levels = [];
  while (player.xp >= player.nextXp) {
    player.xp -= player.nextXp;
    player.level += 1;
    player.nextXp = Math.floor(player.nextXp * 1.32 + 18);
    player.maxHp += 12;
    player.maxMana += 8;
    player.baseAttack += 2;
    player.baseDefense += 1;
    player.hp = Math.min(player.maxHp, player.hp + 22);
    player.mana = Math.min(player.maxMana, player.mana + 15);
    levels.push(player.level);
  }
  return levels;
}
