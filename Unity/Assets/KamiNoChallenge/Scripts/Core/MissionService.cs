using System;
using System.Collections.Generic;

namespace KamiNoChallenge {
    public static class MissionService {
        public const int Survival1EnemyLevel=1;
        public const int Survival1BaseXpPerKill=2;
        public const int Survival1Enemies=45;

        public static MissionResult RunSurvival1(GameState s,List<CharacterModel> team,int seed=0) {
            var rng=seed==0?new Random():new Random(seed);
            var result=new MissionResult{totalEnemies=Survival1Enemies};
            if(team==null||team.Count==0){result.events.Add("No hay equipo.");return result;}

            var hp=new Dictionary<string,int>();
            var alive=new HashSet<string>();
            foreach(var c in team){ hp[c.id]=Math.Max(35,55+c.stats.CON*7+c.stats.DEF*3+(c.level-1)*5); alive.Add(c.id); }

            int[] waves={5,6,7,8,9,10};
            int remaining=0;
            result.events.Add("El grupo cruza el portal. Comienza Supervivencia I.");
            foreach(var wave in waves){
                remaining+=wave;
                result.events.Add($"Aparecen {wave} goblins Nv.1.");
                for(int tick=0;tick<6 && alive.Count>0;tick++){
                    foreach(var c in team){
                        if(!alive.Contains(c.id)||remaining<=0) continue;
                        int power=Math.Max(4,(int)Math.Round((c.stats.FUE*1.15+c.stats.AGI*1.05+c.stats.INT*1.15+c.stats.VOL*.7+c.stats.CON*.9+c.stats.DEF*.85)*(1+(c.level-1)*.035)*(1+(c.currentStar-1)*.08)));
                        int dmg=Math.Max(1,(int)Math.Round(power*(.82+rng.NextDouble()*.36)));
                        var metric=result.metrics.Find(x=>x.characterId==c.id);
                        if(metric==null){metric=new DamageMetric{characterId=c.id,name=c.name,survived=true};result.metrics.Add(metric);}
                        metric.damage+=dmg;
                        double killChance=Math.Max(.05,Math.Min(.72,dmg/45.0));
                        if(rng.NextDouble()<killChance){remaining--;result.enemiesDefeated++;metric.kills++;}
                    }
                    if(remaining>0 && alive.Count>0){
                        int attacks=Math.Min(remaining,Math.Max(1,(int)Math.Ceiling(remaining*.45)));
                        var targets=new List<string>(alive);
                        for(int i=0;i<attacks && targets.Count>0;i++){
                            string id=targets[rng.Next(targets.Count)];
                            var c=team.Find(x=>x.id==id);
                            double mitigation=1+c.stats.DEF*.025+c.stats.CON*.012;
                            int incoming=Math.Max(1,(int)Math.Round((4+rng.NextDouble()*8)/mitigation));
                            hp[id]-=incoming;
                            if(hp[id]<=0){alive.Remove(id); var m=result.metrics.Find(x=>x.characterId==id); if(m!=null)m.survived=false; result.events.Add(c.name+" cae en combate.");}
                        }
                    }
                }
                if(alive.Count==0) break;
            }

            result.completed=alive.Count>0;
            result.events.Add(result.completed?"Misión completada.":"Misión fallida.");
            foreach(var c in team){
                var m=result.metrics.Find(x=>x.characterId==c.id);
                if(m==null){m=new DamageMetric{characterId=c.id,name=c.name,survived=alive.Contains(c.id)};result.metrics.Add(m);}
                if(result.completed) m.xp=m.kills*ProgressionService.KillXp(c.level,Survival1EnemyLevel,Survival1BaseXpPerKill);
            }

            if(result.completed){
                result.gold=250+(rng.NextDouble()<.45?rng.Next(0,101):0);
                result.wood=rng.Next(0,6); result.stone=rng.Next(0,5);
                for(int i=0;i<result.enemiesDefeated;i++){
                    if(rng.NextDouble()>=.10) continue;
                    double rr=rng.NextDouble();
                    int rarity=rr<.01?3:rr<.06?2:1;
                    result.weaponDrops.Add(WeaponService.CreateRandom(rng,rarity,1));
                }
            }
            return result;
        }

        public static void Apply(GameState s,MissionResult r) {
            foreach(var m in r.metrics){
                var c=s.characters.Find(x=>x.id==m.characterId);
                if(c==null)continue;
                if(!m.survived)c.dead=true;
            }
            if(!r.completed)return;
            s.gold+=r.gold;s.wood+=r.wood;s.stone+=r.stone;s.survival1Completions++;
            foreach(var m in r.metrics){
                var c=s.characters.Find(x=>x.id==m.characterId);
                if(c!=null&&!c.dead)ProgressionService.GrantXp(c,m.xp);
            }
            s.weapons.AddRange(r.weaponDrops);
        }
    }
}
