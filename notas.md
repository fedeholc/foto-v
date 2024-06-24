# Notas

## Parámetros en ejecución de ffmpeg

Para ejecutar ffmpeg y que genere el video a partir de las imágenes lo hago así:

```javascript
await ffmpeg.exec([
  "-framerate",
  "30", // Velocidad de fotogramas
  "-i",
  "input%d.png", // Plantilla de entrada de los nombres de archivo
  "-vf", // Filtro para extender el último frame 5 segundos
  "tpad=stop_mode=clone:stop_duration=5",
  "-c:v",
  "libx264", // Codec de video
  "-pix_fmt", // Formato de pixeles
  "yuv420p",
  "output.mp4", // Archivo de salida
]);
```

Advertecias:

- **No cambiar el orden de los parámetros**, porque los interpreta distinto según dónde estén ubicados y probablemente tire error.
- En algún momento tuve problemas tratando de usar JPGs, no pude.
- Hay que **usar yuv420p** como formato de pixeles, sino no se ve el video en muchos reproductores incluído instagram, whatsapp, etc.
- También me daba error cuando el frame tenía un ancho impar en pixeles (decía algo así como que no podía dividir por dos), por lo que hay que asegurarse de que el canvas tenga un tamaño par.

## Escritura de imagenes y performance

Al momento de escribir las imagenes que va a usar ffmpeg para generar el video se puede hacer de este modo:

```javascript
for (let i = 0; i < frames.length; i++) {
  await ffmpeg.writeFile(`input${i + 1}.png`, frames[i]);
}
```

También probé hacerlo con promises para ver si corrían en paralelo y lo hacía más rápido, pero no noté diferencias.

```javascript
await Promise.all(
  frames.map((frame, index) => ffmpeg.writeFile(`input${index + 1}.png`, frame))
);
```

Para usar enums:

```javascript
/**
 * @typedef {typeof ZoomFit[keyof typeof ZoomFit]} ZoomFit
 * @readonly */

export const ZoomFit = {
  WIDTH: "width",
  HEIGHT: "height",
};
```
