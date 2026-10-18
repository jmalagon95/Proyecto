#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEngine;

namespace KamiNoChallenge.Editor {
    public static class RepositoryDataSync {
        [MenuItem("Kami No Challenge/Sync repository data to StreamingAssets")]
        public static void Sync(){
            var assets=Application.dataPath;
            var unityRoot=Directory.GetParent(assets).FullName;
            var repoRoot=Directory.GetParent(unityRoot)?.FullName;
            if(string.IsNullOrEmpty(repoRoot)){Debug.LogError("No se pudo resolver la raíz del repositorio.");return;}
            var source=Path.Combine(repoRoot,"data");
            if(!Directory.Exists(source)){Debug.LogWarning("No existe /data en la raíz del repo. Si tu proyecto Unity está en otra ruta, mueve esta carpeta Unity dentro del repo.");return;}
            var dest=Path.Combine(assets,"StreamingAssets","KamiNoChallenge","Data");
            CopyRecursive(source,dest);
            AssetDatabase.Refresh();
            Debug.Log("Kami No Challenge: datos sincronizados a StreamingAssets.");
        }

        static void CopyRecursive(string source,string dest){
            Directory.CreateDirectory(dest);
            foreach(var file in Directory.GetFiles(source,"*.json",SearchOption.AllDirectories)){
                var rel=file.Substring(source.Length).TrimStart(Path.DirectorySeparatorChar,Path.AltDirectorySeparatorChar);
                var target=Path.Combine(dest,rel);
                Directory.CreateDirectory(Path.GetDirectoryName(target));
                File.Copy(file,target,true);
            }
        }
    }
}
#endif
