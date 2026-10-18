using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace KamiNoChallenge {
    public class KamiBootstrap : MonoBehaviour {
        GameState S => GameStateService.State;
        string screen="lobby";
        Vector2 scroll;
        string message="";
        MissionResult lastResult;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void AutoStart(){
            if(FindObjectOfType<KamiBootstrap>()!=null)return;
            var go=new GameObject("KamiNoChallenge_Bootstrap");
            DontDestroyOnLoad(go);
            go.AddComponent<KamiBootstrap>();
        }

        void Awake(){
            if(S.characters.Count==0){
                var hero=new CharacterModel{name="Protagonista",raceId="kairakh",classId="guerrero",birthStar=1,currentStar=1,level=1};
                S.characters.Add(hero);S.activeCharacterId=hero.id;S.inhabitantsRemaining--;
                GameStateService.Save();
            }
        }

        void OnGUI(){
            GUI.skin.button.wordWrap=true;
            GUILayout.BeginArea(new Rect(12,12,Mathf.Min(Screen.width-24,900),Screen.height-24),GUI.skin.box);
            Header();
            scroll=GUILayout.BeginScrollView(scroll);
            if(screen=="lobby")Lobby();
            else if(screen=="characters")Characters();
            else if(screen=="storage")Storage();
            else if(screen=="missions")Missions();
            else if(screen=="progression")Progression();
            GUILayout.EndScrollView();
            if(!string.IsNullOrEmpty(message))GUILayout.Label(message);
            GUILayout.EndArea();
        }

        void Header(){
            GUILayout.BeginHorizontal();
            if(screen!="lobby"&&GUILayout.Button("← Lobby",GUILayout.Width(90)))screen="lobby";
            GUILayout.Label($"KAMI NO CHALLENGE  |  Oro {S.gold:N0}  Madera {S.wood:N0}  Piedra {S.stone:N0}");
            GUILayout.EndHorizontal();
        }

        CharacterModel Active => S.characters.FirstOrDefault(x=>x.id==S.activeCharacterId)??S.characters.FirstOrDefault(x=>!x.dead);

        void Lobby(){
            var h=Active;
            GUILayout.Space(10);GUILayout.Label($"PRADERA DEL AMANECER · Asentamiento Nv.{S.lobbyLevel}");
            if(h!=null)GUILayout.Label($"{h.name} · {new string('★',h.currentStar)} · Nv.{h.level} · Poder {h.Power:N0}");
            GUILayout.Space(8);
            GUILayout.BeginHorizontal();
            if(GUILayout.Button($"Personajes\n{S.characters.Count(x=>!x.dead)} vivos"))screen="characters";
            if(GUILayout.Button("Santuario\n(invocación en siguiente capa UI)"))message="La lógica de invocación queda preservada en datos; la UI definitiva se montará con UI Toolkit.";
            if(GUILayout.Button($"Misiones\nSupervivencia I"))screen="missions";
            if(GUILayout.Button($"Almacén\n{S.weapons.Count(x=>x.isNew)} nuevos"))screen="storage";
            GUILayout.EndHorizontal();
        }

        void Characters(){
            foreach(var c in S.characters.OrderByDescending(x=>x.Power)){
                GUILayout.BeginHorizontal(GUI.skin.box);
                GUILayout.Label($"{c.name} · {new string('★',c.currentStar)} · Nv.{c.level} · XP {c.experience}/{ProgressionService.XpToNext(c.level)} · Poder {c.Power:N0}"+(c.dead?" · CAÍDO":""));
                if(!c.dead&&GUILayout.Button("Seleccionar",GUILayout.Width(100))){S.activeCharacterId=c.id;GameStateService.Save();}
                if(GUILayout.Button("Progresión",GUILayout.Width(100))){S.activeCharacterId=c.id;screen="progression";}
                GUILayout.EndHorizontal();
            }
        }

        void Progression(){
            var c=Active;if(c==null)return;
            GUILayout.Label($"{c.name} · {new string('★',c.currentStar)} · Nv.{c.level}/{ProgressionService.LevelCap(c)}");
            GUILayout.Label($"XP: {c.experience:N0}/{ProgressionService.XpToNext(c.level):N0}");
            if(GUILayout.Button("Ascender")){
                if(ProgressionService.Ascend(S,c,out var err)){message="Ascensión completada.";GameStateService.Save();}
                else message=err;
            }
        }

        void Storage(){
            foreach(var w in S.weapons.OrderByDescending(x=>x.rarity).ThenByDescending(x=>x.level)){
                GUILayout.BeginHorizontal(GUI.skin.box);
                GUILayout.Label($"{(w.isNew?"NUEVO · ":"")}{w.name} · {new string('★',w.rarity)} · Nv.{w.level} · +{w.enhancement} · {w.damageMin}-{w.damageMax} daño");
                if(GUILayout.Button(w.enhancement>=15?"+15 MAX":$"Mejorar {WeaponService.UpgradeCost(w)} oro",GUILayout.Width(150))){
                    if(WeaponService.Upgrade(S,w,out var err)){w.isNew=false;GameStateService.Save();message="Arma mejorada.";}else message=err;
                }
                if(GUILayout.Button("Visto",GUILayout.Width(70))){w.isNew=false;GameStateService.Save();}
                GUILayout.EndHorizontal();
            }
            if(S.weapons.Count==0)GUILayout.Label("Aún no tienes armas.");
        }

        void Missions(){
            var living=S.characters.Where(x=>!x.dead).Take(5).ToList();
            GUILayout.Label("SUPERVIVENCIA I · Piso 1 · 45 Goblins Nv.1 · 180 s simulados");
            GUILayout.Label("Drop por kill: 10% arma. Si cae: 94% ★1 / 5% ★2 / 1% ★3. Derrota = 0 recompensas y 0 XP.");
            foreach(var c in living)GUILayout.Label($"• {c.name} · Nv.{c.level}");
            if(GUILayout.Button("Enviar equipo")){
                lastResult=MissionService.RunSurvival1(S,living);
                MissionService.Apply(S,lastResult);GameStateService.Save();
            }
            if(lastResult!=null){
                GUILayout.Label(lastResult.completed?"MISIÓN COMPLETADA":"MISIÓN FALLIDA");
                foreach(var e in lastResult.events)GUILayout.Label(e);
                if(lastResult.completed)GUILayout.Label($"Oro +{lastResult.gold} · Madera +{lastResult.wood} · Piedra +{lastResult.stone} · Armas {lastResult.weaponDrops.Count}");
                foreach(var m in lastResult.metrics)GUILayout.Label($"{m.name}: {m.damage} daño · {m.kills} bajas · +{m.xp} XP · {(m.survived?"Vivo":"Caído")}");
            }
        }
    }
}
