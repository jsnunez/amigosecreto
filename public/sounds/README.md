# Sistema de Audio - Amigo Secreto

## 🎵 Efectos de Sonido Implementados

### 1. **Sonido de Ruleta** 🎰
- **Función**: `playRouletteSound()`
- **Duración**: 3 segundos
- **Descripción**: Simula el sonido de una ruleta girando con desaceleración progresiva
- **Técnica**: Web Audio API con oscilador sawtooth + efectos de tick

### 2. **Sonido de Victoria** 🎉
- **Función**: `playWinSound()`
- **Descripción**: Arpeggio ascendente cuando se revela el amigo secreto
- **Notas**: C5, E5, G5, C6 (Do, Mi, Sol, Do)

### 3. **Sonido de Hover** ✨
- **Función**: `playHoverSound()`
- **Descripción**: Efecto sutil al pasar el mouse sobre la carta misteriosa
- **Frecuencia**: 600Hz → 800Hz

## 🔧 Tecnología Utilizada

- **Web Audio API**: Generación de sonidos dinámicos sin archivos externos
- **Compatibilidad**: Funciona en navegadores modernos
- **Fallback**: Si no es compatible, los errores se capturan silenciosamente

## 📁 Estructura de Archivos

```
public/sounds/
├── README.md          # Este archivo de documentación
└── [futuros archivos] # Para archivos de audio opcionales
```

## 🎯 Ventajas del Sistema Actual

1. **Sin dependencias externas**: No requiere archivos MP3/WAV
2. **Ligero**: Los sonidos se generan programáticamente
3. **Personalizable**: Fácil modificar frecuencias y duraciones
4. **Responsive**: Se adapta a la duración de las animaciones

## 🔊 Configuración de Volumen

Los volúmenes están optimizados para no ser intrusivos:
- **Ruleta**: 0.1 (variable con velocidad)
- **Ticks**: 0.15
- **Victoria**: 0.2
- **Hover**: 0.05

## 🛠️ Personalización

Para modificar los sonidos, edita las funciones en `dashboard.ejs`:
- Cambiar frecuencias en las funciones de sonido
- Ajustar duraciones modificando los parámetros de tiempo
- Agregar nuevos tipos de osciladores ('sine', 'square', 'triangle', 'sawtooth')