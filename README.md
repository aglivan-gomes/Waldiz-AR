# Waldiz-AR

Aplicação WebAR geolocalizada usando A-Frame (v1.6.0) e AR.js (v3.4.7) para exibir reconstruções 3D (`.glb`), textos descritivos e narração em áudio de construções históricas em suas coordenadas reais.

## Estrutura e funcionamento

- `js/obras.js`: Lista separada das obras (`Casa da Fazenda`, `Hotel NSF` e `Prefeitura Antiga`) com coordenadas, caminhos dos `.glb`, arquivos `.mp3` e descrições.
- `js/app.js`: Gerencia a leitura do GPS, o cálculo de distância (fórmula de Haversine) e o azimute (direção) até a obra mais próxima.
- **Filtro de 50 metros e guia de direção:** Para evitar que todos os modelos apareçam de longe ou fora de lugar, as entidades iniciam ocultas (`visible="false"`). Uma barra superior com seta giratória indica a direção e a distância em metros até a obra mais próxima. Ao entrar no raio de 50 metros, o modelo 3D daquela obra e a caixa inferior com a descrição e o botão de áudio são liberados.

## Como testar

O navegador do celular bloqueia a câmera e o GPS se abrir por IP local sem HTTPS. Pra testar rápido, é melhor subir no GitHub Pages / Firebase Hosting ou usar o port forwarding do Chrome (`chrome://inspect/#devices`) com o cabo USB ligado no PC.

Caso o arquivo `.mp3` específico de alguma obra ainda não esteja na pasta `assets/audio/`, o player carrega automaticamente o `audio-teste.mp3` como fallback.

## Anotações e referências (problemas do AR.js)

Deixando salvo os links da documentação e das issues que resolveram os bugs dessa versão:

- **Documentação base:** [AR.js Location Based com A-Frame](https://ar-js-org.github.io/AR.js-Docs/location-based-aframe/) e [lista de parâmetros do gps-new-camera](https://ar-js-org.github.io/AR.js-Docs/location-based/). A ordem dos scripts no HTML importa: o `ar-threex-location-only.js` tem que vir antes do `aframe-ar.js`, senão o componente novo de GPS nem registra.
- **Modelo grudado na tela:** Os tutoriais mais antigos usam `gps-camera` e `gps-entity-place`, mas isso tem um bug no Android que faz o modelo 3D colar no centro da câmera. A solução foi migrar tudo pro `gps-new-camera` e `gps-new-entity-place` ([Issue #278](https://github.com/AR-js-org/AR.js/issues/278)).
- **Evento de GPS não dispara:** Na API nova (`gps-new-camera`), escutar o `gps-camera-update-position` no `window` não funciona mais. Tem que dar um `querySelector` na câmera e colocar o listener direto nela ([Issue #437](https://github.com/AR-js-org/AR.js/issues/437)).
- **Modelo tremendo ou saindo do lugar ao girar a câmera:** Ajuste do `gpsMinDistance: 10`, `positionMinAccuracy: 30` e `smoothingFactor: 0.4` no `arjs-device-orientation-controls` para cortar o atraso elástico ao virar o aparelho e filtrar leituras ruins do GPS ([Issue #490](https://github.com/AR-js-org/AR.js/issues/490), [Discussion #412](https://github.com/AR-js-org/AR.js/discussions/412) e [Exemplo oficial avoid-shaking](https://github.com/AR-js-org/AR.js/blob/master/aframe/examples/location-based/avoid-shaking/index.html)).
- **Cálculo de distância (Haversine), Azimute (Bearing) e rotação da bússola:** Como o parâmetro antigo `maxDistance` foi removido na `gps-new-camera`, o filtro de 50m e o ângulo da seta guia usam as equações geodésicas de [Movable Type Scripts - Latitude/Longitude Formulae](https://www.movable-type.co.uk/scripts/latlong.html) combinadas com a extração de ângulo `THREE.Euler` na ordem `'YXZ'` da [documentação do Three.js](https://threejs.org/docs/#api/en/math/Euler.setFromQuaternion).
- **Bloqueio de áudio e clique na UI sobre o A-Frame:** Navegadores mobile bloqueiam áudio disparado automaticamente pelo GPS, exigindo clique direto do usuário ([MDN Autoplay Guide](https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide)) em um painel com `pointer-events: auto` acima do canvas WebGL ([A-Frame Issue #3976](https://github.com/aframevr/aframe/issues/3976)).