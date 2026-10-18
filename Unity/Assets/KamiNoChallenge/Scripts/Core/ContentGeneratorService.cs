using System;
using System.Collections.Generic;

namespace KamiNoChallenge {
    public static class ContentGeneratorService {
        public const int PassiveTotal = 9000;
        public const int SkillsPerClass = 2000;

        public static readonly string[] ClassIds = {
            "guerrero","defensor","ranger","picaro","segador","mago","invocador","apoyo",
            "proyector_venas","lancero_cuerno","resonador_kairakh","depredador_cumbres","guardian_cuerno",
            "arquero_arboleda","cantor_raices","danzante_luna","guardian_silvano","tejedor_espiritus",
            "lanzador_calamidades","destructor_kijin","devorador_maldiciones","monje_cuernos","senor_cien_demonios",
            "hemolancero","sanguinario_noble","senor_murcielagos","tejedor_carmesi","caballero_sed",
            "artillero_quitinoso","emperador_colmena","segador_mantideo","bastion_escarabajo","maestro_metamorfosis",
            "garra_fulminante","azote_cola","ojo_pedregal","bastion_escama","conductor_sol"
        };

        static ContentRank RankForIndex(int i,int total) {
            float p=(i+0.5f)/total;
            if(p<.25f)return ContentRank.F;if(p<.44f)return ContentRank.E;if(p<.59f)return ContentRank.D;
            if(p<.71f)return ContentRank.C;if(p<.805f)return ContentRank.B;if(p<.875f)return ContentRank.A;
            if(p<.925f)return ContentRank.S;if(p<.96f)return ContentRank.SS;if(p<.9825f)return ContentRank.SSS;
            if(p<.995f)return ContentRank.SSSPlus;return ContentRank.U;
        }

        public static List<PassiveDescriptor> GeneratePassives() {
            var list=new List<PassiveDescriptor>(PassiveTotal);
            string[] ops={"stat_pct","weapon_damage_pct","class_damage_pct","skill_tag_damage_pct","accuracy_pct","cooldown_pct","resistance_pct"};
            string[] triggers={"always","hp_below_50","hp_above_80","on_hit","on_crit","on_dodge","on_kill","after_skill","near_ally","when_outnumbered"};
            for(int i=0;i<PassiveTotal;i++){
                var rank=RankForIndex(i,PassiveTotal);
                list.Add(new PassiveDescriptor{
                    id=$"P-{i+1:00000}",name=$"Pasiva {rank} #{i+1}",rank=rank,scope=i%5==0?"racial":i%4==0?"weapon":"universal",
                    effects=new List<EffectDescriptor>{new EffectDescriptor{op=ops[i%ops.Length],trigger=triggers[i%triggers.Length],value=1f+(int)rank*1.5f}}
                });
            }
            return list;
        }

        public static List<SkillDescriptor> GenerateSkillsForClass(string classId) {
            var list=new List<SkillDescriptor>(SkillsPerClass);
            string[] ops={"damage","heal","shield","penetration_pct","summon_boost_pct"};
            for(int i=0;i<SkillsPerClass;i++){
                var rank=RankForIndex(i,SkillsPerClass);
                list.Add(new SkillDescriptor{
                    id=$"S-{classId}-{i+1:0000}",name=$"{classId} · Técnica {i+1}",classId=classId,rank=rank,
                    effects=new List<EffectDescriptor>{new EffectDescriptor{op=ops[i%ops.Length],value=5f+(int)rank*6f}}
                });
            }
            return list;
        }
    }
}
