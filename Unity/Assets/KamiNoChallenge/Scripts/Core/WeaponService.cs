using System;
using System.Collections.Generic;

namespace KamiNoChallenge {
    public static class WeaponService {
        public static readonly Dictionary<int,float> RarityMult = new Dictionary<int,float>{
            {1,1f},{2,5f},{3,15f},{4,50f},{5,150f},{6,450f},{7,1100f},{8,2700f}
        };
        public static readonly Dictionary<int,int> BonusStatSlots = new Dictionary<int,int>{
            {1,0},{2,1},{3,1},{4,2},{5,3},{6,4},{7,5},{8,6}
        };
        public static readonly Dictionary<int,int> PassiveSlots = new Dictionary<int,int>{
            {1,0},{2,0},{3,1},{4,1},{5,2},{6,3},{7,4},{8,5}
        };
        public static readonly Dictionary<int,int> UpgradeBaseGold = new Dictionary<int,int>{
            {1,100},{2,180},{3,320},{4,550},{5,900},{6,1500},{7,2500},{8,4000}
        };

        static readonly (string id,string name,int hands,int min,int max)[] Families = {
            ("sword","Espada",1,3,5),("greatsword","Mandoble",2,5,8),("rapier","Estoque",1,2,5),
            ("dagger","Daga",1,2,4),("axe","Hacha",1,3,6),("throwaxe","Hacha arrojadiza",1,2,5),
            ("mace","Maza",1,3,6),("kanabo","Kanabō",2,6,9),("hammer","Gran martillo",2,6,9),
            ("spear","Lanza",1,3,6),("longspear","Lanza larga",2,4,7),("halberd","Alabarda",2,5,8),
            ("javelin","Jabalina",1,3,5),("scythe","Guadaña",2,4,7),("bow","Arco",2,3,6),
            ("crossbow","Ballesta",2,4,7),("staff","Bastón",2,2,4),("wand","Varita",1,1,3),
            ("tome","Tomo",1,1,2),("scepter","Cetro",1,2,4),("catalyst","Catalizador",1,1,2),
            ("gauntlets","Guanteletes",2,2,5),("chakrams","Chakrams",2,2,5),("cannon","Cañón",2,5,8),
            ("fan","Abanico ritual",1,1,3),("spikelauncher","Lanzador orgánico",2,3,6),
            ("armblades","Cuchillas de antebrazo",2,3,5),("bioweapon","Arma biológica mutable",2,3,6)
        };

        public static WeaponInstance CreateRandom(Random rng,int rarity,int level=1) {
            var f=Families[rng.Next(Families.Length)];
            int variant=rng.Next(1,11);
            float rm=RarityMult[Math.Max(1,Math.Min(8,rarity))];
            var w=new WeaponInstance{
                templateId=$"W{rarity}-{f.id}-{variant:00}",
                name=$"{f.name} {variant:00}",
                family=f.name, rarity=rarity, level=Math.Max(1,Math.Min(100,level)), hands=f.hands,
                baseMinDamage=Math.Max(1,(int)Math.Round(f.min*rm)),
                baseMaxDamage=Math.Max(1,(int)Math.Round(f.max*rm)),
                bonusStatSlots=BonusStatSlots[rarity],
                passiveSlots=PassiveSlots[rarity]
            };
            Recalculate(w);
            return w;
        }

        public static float LevelMultiplier(int level)=>1f+(Math.Max(1,Math.Min(100,level))-1)*0.018f;
        public static float EnhancementMultiplier(int plus)=>1f+Math.Max(0,Math.Min(15,plus))*0.04f;

        public static void Recalculate(WeaponInstance w) {
            float m=LevelMultiplier(w.level)*EnhancementMultiplier(w.enhancement);
            w.damageMin=Math.Max(1,(int)Math.Round(w.baseMinDamage*m));
            w.damageMax=Math.Max(w.damageMin,(int)Math.Round(w.baseMaxDamage*m));
        }

        public static int UpgradeCost(WeaponInstance w) {
            if(w.enhancement>=15) return 0;
            int b=UpgradeBaseGold[w.rarity];
            return (int)Math.Round(b*(1+w.enhancement*0.28f)*(1+(w.level-1)*0.015f));
        }

        public static bool Upgrade(GameState s,WeaponInstance w,out string error) {
            error=null;
            if(w.enhancement>=15){error="El arma ya está en +15.";return false;}
            int cost=UpgradeCost(w);
            if(s.gold<cost){error="No tienes suficiente oro.";return false;}
            s.gold-=cost; w.enhancement++; Recalculate(w); return true;
        }
    }
}
