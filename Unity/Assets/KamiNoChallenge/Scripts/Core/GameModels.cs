using System;
using System.Collections.Generic;

namespace KamiNoChallenge {
    [Serializable] public class Stats {
        public int FUE=1, AGI=1, CON=1, DEF=1, INT=1, VOL=1;
        public int Sum => FUE+AGI+CON+DEF+INT+VOL;
    }

    [Serializable] public class CharacterModel {
        public string id = Guid.NewGuid().ToString("N");
        public string name = "Aspirante";
        public string raceId = "kairakh";
        public string classId = "guerrero";
        public int birthStar = 1;
        public int currentStar = 1;
        public int level = 1;
        public int experience = 0;
        public bool dead = false;
        public Stats stats = new Stats();
        public List<string> passiveIds = new List<string>();
        public List<string> skillIds = new List<string>();
        public string mainHandWeaponId;
        public string offHandWeaponId;
        public int Power => stats.Sum*100 + level*25 + currentStar*250;
    }

    [Serializable] public class WeaponInstance {
        public string id = Guid.NewGuid().ToString("N");
        public string templateId;
        public string name;
        public string family;
        public int rarity = 1;
        public int level = 1;
        public int enhancement = 0;
        public int hands = 1;
        public int baseMinDamage;
        public int baseMaxDamage;
        public int damageMin;
        public int damageMax;
        public int bonusStatSlots;
        public int passiveSlots;
        public bool isNew = true;
        public string equippedBy;
    }

    [Serializable] public class AscensionStoneStack {
        public int star;
        public int count;
    }

    [Serializable] public class MissionTeamPresets {
        public List<string> lastUsed = new List<string>();
        public List<string> team1 = new List<string>();
        public List<string> team2 = new List<string>();
        public List<string> team3 = new List<string>();
    }

    [Serializable] public class GameState {
        public int gold = 1000;
        public int wood = 0;
        public int stone = 0;
        public int lobbyLevel = 1;
        public long inhabitantsRemaining = 8000000000L;
        public List<CharacterModel> characters = new List<CharacterModel>();
        public List<WeaponInstance> weapons = new List<WeaponInstance>();
        public List<AscensionStoneStack> ascensionStones = new List<AscensionStoneStack>();
        public MissionTeamPresets missionTeams = new MissionTeamPresets();
        public string activeCharacterId;
        public int survival1Completions = 0;
    }

    [Serializable] public class DamageMetric {
        public string characterId;
        public string name;
        public int damage;
        public int kills;
        public int xp;
        public bool survived;
    }

    [Serializable] public class MissionResult {
        public bool completed;
        public int enemiesDefeated;
        public int totalEnemies;
        public int gold;
        public int wood;
        public int stone;
        public List<string> events = new List<string>();
        public List<DamageMetric> metrics = new List<DamageMetric>();
        public List<WeaponInstance> weaponDrops = new List<WeaponInstance>();
    }

    public enum ContentRank { F,E,D,C,B,A,S,SS,SSS,SSSPlus,U }

    [Serializable] public class EffectDescriptor {
        public string op;
        public string trigger = "always";
        public float value;
        public string tag;
    }

    [Serializable] public class PassiveDescriptor {
        public string id, name, scope, raceId, classId;
        public ContentRank rank;
        public List<EffectDescriptor> effects = new List<EffectDescriptor>();
    }

    [Serializable] public class SkillDescriptor {
        public string id, name, classId;
        public ContentRank rank;
        public List<EffectDescriptor> effects = new List<EffectDescriptor>();
    }
}
