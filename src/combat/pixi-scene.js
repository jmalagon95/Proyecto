import { Application, Container, Graphics, Text } from 'pixi.js';

// Base real de PixiJS preparada para el sistema de 3 carriles invisibles.
export async function mountCombat(container) {
  const app = new Application();
  await app.init({ resizeTo: container, backgroundColor: 0x17251f, antialias: true });
  container.appendChild(app.canvas);
  const field = new Container(); app.stage.addChild(field);
  const g = new Graphics();
  g.roundRect(24, 24, Math.max(300, container.clientWidth - 48), Math.max(240, container.clientHeight - 48), 22).fill({color:0x304f3b});
  field.addChild(g);
  const label = new Text({ text:'Combate PixiJS · 3 carriles invisibles', style:{ fill:0xffffff, fontSize:18 } });
  label.x=44;label.y=44;field.addChild(label);
  return app;
}
