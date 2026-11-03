# Waldiz-AR

Estrutura inicial usando A-Frame e AR.js (v3.4.7) pra validar a captura do GPS e renderizar um `.glb` na cena sem precisar de marcador.

## Como testar

O navegador do celular bloqueia a câmera e o GPS se abrir por IP local sem HTTPS. Pra testar rápido, é melhor subir no GitHub Pages / Firebase Hosting ou usar o port forwarding do Chrome (`chrome://inspect/#devices`) com o cabo USB ligado no PC.

No `js/app.js`, o código pega a primeira leitura do GPS e soma `0.0002` na latitude pra jogar o modelo uns 20 metros pro norte de onde o celular estiver. Fiz isso só pra validar se o modelo aparece na tela sem precisar ir até a coordenada final toda vez. Depois é só trocar pelos valores fixos.

## Anotações e referências (problemas do AR.js)

Deixando salvo os links da documentação e das issues que resolveram os bugs de inicialização dessa versão:

- **Documentação base:** [AR.js Location Based com A-Frame](https://ar-js-org.github.io/AR.js-Docs/location-based-aframe/) e [lista de parâmetros do gps-new-camera](https://ar-js-org.github.io/AR.js-Docs/location-based/). A ordem dos scripts no HTML importa: o `ar-threex-location-only.js` tem que vir antes do `aframe-ar.js`, senão o componente novo de GPS nem registra.
- **Modelo grudado na tela:** Os tutoriais mais antigos usam `gps-camera` e `gps-entity-place`, mas isso tem um bug no Android que faz o modelo 3D colar no centro da câmera. A solução foi migrar tudo pro `gps-new-camera` e `gps-new-entity-place` ([Issue #278](https://github.com/AR-js-org/AR.js/issues/278)).
- **Evento de GPS não dispara:** Na API nova (`gps-new-camera`), escutar o `gps-camera-update-position` no `window` não funciona mais. Tem que dar um `querySelector` na câmera e colocar o listener direto nela ([Issue #437](https://github.com/AR-js-org/AR.js/issues/437)).
- **Modelo tremendo sozinho (drift):** Configuração do `gpsMinDistance` e ajustes de escala/precisão pra evitar que qualquer variação mínima do sensor faça o modelo andar sozinho ([Issue #490](https://github.com/AR-js-org/AR.js/issues/490) e [Discussion #412](https://github.com/AR-js-org/AR.js/discussions/412)).