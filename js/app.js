/*
  configuracao da coordenada fixa da obra e controle de leitura do gps.
  assim que o sensor pega a primeira posicao valida, instancia o modelo 3d na coordenada real
  e mantem o painel do topo atualizado com a latitude, longitude e margem de erro em metros.
*/

// lista das obras com seus respectivos ids de modelo e coordenadas exatas onde vao ficar ancoradas
const OBRAS = [
    {
        nome: 'Casa da Fazenda',
        modelo: '#glb-casa-fazenda',
        latitude: -4.971222,
        longitude: -39.016225
    },
    {
        nome: 'Hotel NSF',
        modelo: '#glb-hotel-nsf',
        latitude: null, // substituir pela coordenada real
        longitude: null
    },
    {
        nome: 'Prefeitura Antiga',
        modelo: '#glb-prefeitura-antiga',
        latitude: null, // substituir pela coordenada real
        longitude: null
    }
];

window.addEventListener('load', () => {
    let modeloInstanciado = false;

    const hudGps = document.getElementById('hud-gps');
    const hudPrecisao = document.getElementById('hud-precisao');
    const hudModelo = document.getElementById('hud-modelo');

    const cena = document.querySelector('a-scene');
    const cameraEl = document.querySelector('[gps-new-camera]');

    if (!cameraEl) {
        hudGps.innerText = 'GPS: erro ao localizar componente da camera';
        return;
    }

// monitora a precisao bruta do sensor do celular e possiveis bloqueios de permissao.
    if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(
            (pos) => {
                const precisao = pos.coords.accuracy;
                hudPrecisao.innerText = `Precisão: ±${precisao.toFixed(1)}m`;
            },
            (erro) => {
                hudGps.innerText = `Erro GPS (${erro.code}): verifique a permissão`;
            },
            { enableHighAccuracy: true, maximumAge: 0 }
        );
    }

    cameraEl.addEventListener('gps-camera-update-position', (evento) => {
        const { latitude, longitude } = evento.detail.position;

        hudGps.innerText = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

        if (!modeloInstanciado) {
            // filtra so as obras que ja tem coordenada preenchida pra nao quebrar a projecao do three.js com valor nulo
            const obrasAtivas = OBRAS.filter(obra => obra.latitude !== null && obra.longitude !== null);
            let carregados = 0;

            hudModelo.innerText = `Modelo: carregando (0/${obrasAtivas.length})...`;

            obrasAtivas.forEach((obra) => {
                const entidade = document.createElement('a-entity');

                // nao pode misturar com o gps-entity-place antigo senao o modelo ignora a coordenada e cola na tela
                entidade.setAttribute('gps-new-entity-place', {
                    latitude: obra.latitude,
                    longitude: obra.longitude
                });

                entidade.setAttribute('gltf-model', obra.modelo);
                entidade.setAttribute('scale', '1 1 1');

                entidade.addEventListener('model-loaded', () => {
                    carregados++;
                    hudModelo.innerText = `Modelo: ${carregados}/${obrasAtivas.length} ativos na cena`;
                });

                entidade.addEventListener('model-error', (erro) => {
                    hudModelo.innerText = `Modelo: erro ao carregar ${obra.nome}`;
                    console.error(`Falha ao carregar o arquivo glb (${obra.nome}):`, erro);
                });

                cena.appendChild(entidade);
            });

            modeloInstanciado = true;
        }
    });
});