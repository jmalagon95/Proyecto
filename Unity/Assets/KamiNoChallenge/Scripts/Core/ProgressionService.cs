using System;
using System.Collections.Generic;

namespace KamiNoChallenge {
    public static class ProgressionService {
        public static readonly Dictionary<int,int> StarLevelCaps = new Dictionary<int,int>{
            {1,10},{2,20},{3,30},{4,40},{5,50},{6,60},{7,70},{8,80}
        };

        public static int LevelCap(CharacterModel c) => StarLevelCaps.TryGetValue(c.currentStar,out var v)?v:80;
        public static int XpToNext(int level) => (int)Math.Round(150*Math.Pow(Math.Max(1,level),1.585));

        public static int KillXp(int characterLevel,int enemyLevel,int baseXp) {
            int diff=characterLevel-enemyLevel;
            if(diff>=2) return 0;
            if(diff==1) return (int)Math.Floor(baseXp*0.5);
            if(diff==0) return baseXp;
            float bonus=Math.Min(2f,1f+Math.Abs(diff)*0.25f);
            return Math.Max(1,(int)Math.Floor(baseXp*bonus));
        }

        public static int GrantXp(CharacterModel c,int amount) {
            if(c.dead || amount<=0) return 0;
            c.experience+=amount;
            int gained=0, cap=LevelCap(c);
            while(c.level<cap) {
                int need=XpToNext(c.level);
                if(c.experience<need) break;
                c.experience-=need; c.level++; gained++;
            }
            if(c.level>=cap) c.experience=Math.Min(c.experience,XpToNext(cap)-1);
            return gained;
        }

        static AscensionStoneStack StoneStack(GameState s,int star) {
            var stack=s.ascensionStones.Find(x=>x.star==star);
            if(stack==null){ stack=new AscensionStoneStack{star=star,count=0}; s.ascensionStones.Add(stack); }
            return stack;
        }

        public static bool CraftStone(GameState s,int star,List<string> sacrificeIds,out string error) {
            error=null;
            if(star<1||star>7){error="Rango inválido.";return false;}
            var ids=new HashSet<string>(sacrificeIds??new List<string>());
            var candidates=s.characters.FindAll(c=>ids.Contains(c.id)&&!c.dead&&c.currentStar==star);
            if(candidates.Count!=10){error="Necesitas exactamente 10 personajes del mismo rango.";return false;}
            if(candidates.Exists(c=>c.id==s.activeCharacterId)){error="No puedes sacrificar al personaje activo.";return false;}
            foreach(var c in candidates) s.characters.Remove(c);
            StoneStack(s,star).count++;
            return true;
        }

        public static bool Ascend(GameState s,CharacterModel c,out string error) {
            error=null;
            if(c.currentStar>=8){error="★8 es el máximo.";return false;}
            if(c.level<LevelCap(c)){error="Debes alcanzar el nivel máximo de la rareza.";return false;}
            var stack=StoneStack(s,c.currentStar);
            if(stack.count<1){error="Falta la Piedra de Ascensión correspondiente.";return false;}
            stack.count--; c.currentStar++; c.level=1; c.experience=0;
            return true;
        }
    }
}
