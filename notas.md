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

Advertencias:

- **No cambiar el orden de los parámetros**, porque los interpreta distinto según dónde estén ubicados y probablemente tire error.
- En algún momento tuve problemas tratando de usar JPGs, no pude.
- Hay que **usar yuv420p** como formato de pixeles, sino no se ve el video en muchos reproductores incluído instagram, whatsapp, etc.
- También me daba error cuando el frame tenía un ancho impar en pixeles (decía algo así como que no podía dividir por dos), por lo que hay que asegurarse de que el canvas tenga un tamaño par.

## Reverse video y performance

```javascript
await ffmpeg.exec([
  "-framerate",
  `${frameRate}`,
  "-i",
  "input%d.png",
  "-vf",
  `reverse,tpad=stop_mode=clone:stop_duration=${lastFrameRepeat}`,
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "output.mp4",
]);
```

Inicialmente probe hacer la inversión del video con el parámetro -vf reverse, pero agotaba la memoria.
Lo que hice para solucionarlo fue ir creando pequeñas partes del video final, que se vaya liberando memoria y luego juntar todo en un video.
Para hacer el reverse en lugar de hacerlo con la función de ffmpeg refactorice la creación del video en dos partes, la creación de imagenes y el armado del video, la parte de las imagenes es la más lenta, pero una vez que se las tiene en un array se puede pasar el array invertido y crea el video en reverse, y eso es más rápido pero igual tiene que hacer la parte del writefile que insume tiempo.
Trabajando con chunks de 20 frames logro que no se agote la memoria, pero tendría que probar que pasa en otras pcs, teléfono, etc, e investigar cuánto es que ffmpeg puede alocar de memoria en el browser, si se puede cambiar, etc.

Otra opción es esta:

```javascript
await ffmpeg.exec([
  "-r",
  `${frameRate}`,
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  "imagesfilelist.txt",
  "-vf",
  `tpad=stop_mode=clone:stop_duration=${lastFrameRepeat}`,
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "output.mp4",
]);
```

Antes de eso hay que crear la filelist. El siguiente código es para el caso de forward, para reverse hay que ir del último al primero.

```javascript
let blobfiles = "";
for (let i = 0; i < videoFrames.length - 1; i++) {
  blobfiles += `file 'input${i + 1}.png'\n`;
}
console.log(blobfiles);
const blobFileList = new Blob([blobfiles], {
  type: "text/plain",
});
await ffmpeg.writeFile("imagesfilelist.txt", blobFileList);
```

En principio funciona, no se queda sin memoria, tendría que ver si es más lento y qué tanto, y por otra parte tira unos mensajes respecto a dropping frames, que no sé si es un problema o no (no parece serlo, pero tengo que probar mejor).

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

## Para usar enums:

```javascript
/**
 * @typedef {typeof ZoomFit[keyof typeof ZoomFit]} ZoomFit
 * @readonly */

export const ZoomFit = {
  WIDTH: "width",
  HEIGHT: "height",
};
```
