# Kami No Challenge — Unity layer

Esta carpeta contiene la primera capa jugable del proyecto en Unity y convive con el prototipo web.

## Qué queda portado
- Estado persistente local.
- Personajes, stats, rareza, nivel y permadeath.
- Curva de experiencia lenta.
- Goblins Nv.1: 2 XP al mismo nivel, 1 XP a Nv.2 y 0 XP desde Nv.3.
- Caps de nivel por rareza y ascensión con Piedra de Ascensión.
- Armas ★1–★8, Nv.1–100 y mejora segura +0…+15.
- Multiplicadores de arma: 1 / 5 / 15 / 50 / 150 / 450 / 1100 / 2700.
- 28 familias × 10 variantes × 8 rarezas disponibles proceduralmente.
- Slots reservados de stats/pasivas por rareza.
- Supervivencia I con 45 Goblins Nv.1, permadeath, recompensas y métricas.
- Drop por kill 10%; dentro del drop: ★1 94%, ★2 5%, ★3 1%.
- Derrota: sin oro, materiales, armas ni experiencia.
- Generador determinista de 9.000 pasivas y 2.000 skills por cada una de las 38 clases.
- Lobby funcional provisional por IMGUI para poder probar sistemas antes de la UI final.

## Uso
El componente `KamiBootstrap` se crea automáticamente al ejecutar cualquier escena, así que no necesita configuración manual.

La UI actual es deliberadamente funcional/provisional. Después se sustituirá por UI Toolkit/UGUI y arte definitivo.

## Datos
Desde Unity: **Kami No Challenge > Sync repository data to StreamingAssets** copia los JSON del directorio `/data` del repo a StreamingAssets para tenerlos disponibles en builds futuros.
