using System.IO;
using UnityEngine;

namespace KamiNoChallenge {
    public static class GameStateService {
        static GameState state;
        public static GameState State => state ?? Load();
        static string PathName => Path.Combine(Application.persistentDataPath,"kami_no_challenge_unity.json");

        public static GameState Load() {
            if(File.Exists(PathName)) {
                try { state = JsonUtility.FromJson<GameState>(File.ReadAllText(PathName)); }
                catch { state = null; }
            }
            if(state==null) state = new GameState();
            Normalize(state);
            return state;
        }

        static void Normalize(GameState s) {
            if(s.characters==null) s.characters=new System.Collections.Generic.List<CharacterModel>();
            if(s.weapons==null) s.weapons=new System.Collections.Generic.List<WeaponInstance>();
            if(s.ascensionStones==null) s.ascensionStones=new System.Collections.Generic.List<AscensionStoneStack>();
            if(s.missionTeams==null) s.missionTeams=new MissionTeamPresets();
        }

        public static void Save() {
            if(state==null) return;
            File.WriteAllText(PathName,JsonUtility.ToJson(state,true));
        }

        public static void Reset() {
            state=new GameState();
            Save();
        }
    }
}
