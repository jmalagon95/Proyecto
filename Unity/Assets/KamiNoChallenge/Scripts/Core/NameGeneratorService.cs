using System;
using System.Collections.Generic;
using System.Text;

namespace KamiNoChallenge {
    public static class NameGeneratorService {
        public const int NamesPerRace = 1048576;
        public const int TotalNameSpace = NamesPerRace * 6;

        static readonly Dictionary<string,string[]> Onsets = new Dictionary<string,string[]>{
            {"kairakh",new[]{"k","v","r","th","z","kh","n","s"}},
            {"elfos",new[]{"a","e","l","s","th","v","n","r"}},
            {"kijins",new[]{"ka","ra","shi","yo","ku","zan","rei","to"}},
            {"vampiros",new[]{"va","ka","se","no","ri","ve","dra","lu"}},
            {"insectoides",new[]{"ki","xi","tri","ve","za","shi","kra","ni"}},
            {"reptro",new[]{"r","s","th","k","z","vr","sk","kr"}}
        };
        static readonly Dictionary<string,string[]> Vowels = new Dictionary<string,string[]>{
            {"kairakh",new[]{"a","e","i","o"}},{"elfos",new[]{"ae","ei","ia","y"}},
            {"kijins",new[]{"a","i","o","u"}},{"vampiros",new[]{"a","e","i","o"}},
            {"insectoides",new[]{"a","i","o","u"}},{"reptro",new[]{"a","e","i","o"}}
        };
        static readonly Dictionary<string,string[]> Endings = new Dictionary<string,string[]>{
            {"kairakh",new[]{"r","k","th","n","s","m","l","x"}},
            {"elfos",new[]{"el","iel","ion","ir","is","ael","eth","yn"}},
            {"kijins",new[]{"maru","jin","ra","to","zen","ki","do","shi"}},
            {"vampiros",new[]{"r","n","s","l","th","v","en","is"}},
            {"insectoides",new[]{"x","th","k","r","n","s","q","z"}},
            {"reptro",new[]{"k","ss","r","th","x","n","z","q"}}
        };

        static List<string> Segments(string race){
            if(!Onsets.ContainsKey(race))race="kairakh";
            var list=new List<string>(32);
            foreach(var o in Onsets[race])foreach(var v in Vowels[race])list.Add(o+v);
            return list;
        }

        public static string FromIndex(string race,int index){
            var seg=Segments(race);
            if(!Endings.ContainsKey(race))race="kairakh";
            int n=((index%NamesPerRace)+NamesPerRace)%NamesPerRace;
            int a=n&31;n>>=5;int b=n&31;n>>=5;int c=n&31;n>>=5;int d=n&31;
            string ending=Endings[race][d%Endings[race].Length]+Vowels[race][(d/Endings[race].Length)%4];
            string raw=seg[a]+seg[b]+seg[c]+ending;
            if(raw.Length==0)return "Aspirante";
            return char.ToUpperInvariant(raw[0])+raw.Substring(1);
        }

        public static string GenerateUnique(string race,IEnumerable<string> existing,Random rng=null){
            rng=rng??new Random();
            var used=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if(existing!=null)foreach(var n in existing)if(!string.IsNullOrWhiteSpace(n))used.Add(n);
            for(int i=0;i<256;i++){
                var name=FromIndex(race,rng.Next(NamesPerRace));
                if(!used.Contains(name))return name;
            }
            int start=rng.Next(NamesPerRace);
            for(int i=0;i<NamesPerRace;i++){
                var name=FromIndex(race,(start+i)%NamesPerRace);
                if(!used.Contains(name))return name;
            }
            return "Aspirante";
        }
    }
}
