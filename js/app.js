/*
  configuracao do controle de leitura do gps, calculo de distancia por haversine
  e gerencia o carregamento dos modelos 3d e a exibicao da caixa de dialogo com o audio.
*/

import { OBRAS } from './obras.js';

const RAIO_ATIVACAO_METROS = 50;
const AUDIO_PADRAO_TESTE = 'assets/audio/audio-teste.mp3';

/*
  calculo de distancia em metros entre dois pares de coordenadas usando a formula de haversine.
  usado a cada atualizacao do gps pra saber se o usuario ja entrou no raio de 50m de alguma obra.
*/
function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
    const raioTerra = 6371000;
    const paraRad = (graus) => (graus * Math.PI) / 180;

    const dLat = paraRad(lat2 - lat1);
    const dLon = paraRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(paraRad(lat1)) * Math.cos(paraRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return raioTerra * c;
}

/*
  calcula o angulo de direcao (azimute/bearing de 0 a 360 graus em relacao ao norte)
  do ponto onde o usuario esta ate a coordenada da obra.
*/
function calcularAzimuteGraus(lat1, lon1, lat2, lon2) {
    const paraRad = (graus) => (graus * Math.PI) / 180;
    const paraGraus = (rad) => (rad * 180) / Math.PI;

    const phi1 = paraRad(lat1);
    const phi2 = paraRad(lat2);
    const deltaLon = paraRad(lon2 - lon1);

    const y = Math.sin(deltaLon) * Math.cos(phi2);
    const x =
        Math.cos(phi1) * Math.sin(phi2) -
        Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLon);

    const brng = paraGraus(Math.atan2(y, x));
    return (brng + 360) % 360;
}

window.addEventListener('load', () => {
    let modeloInstanciado = false;
    let obraAtivaNoPainel = null;
    let azimuteObraAlvo = null;
    let ultimaPosicaoUsuario = null;

    const hudGps = document.getElementById('hud-gps');
    const hudPrecisao = document.getElementById('hud-precisao');
    const hudModelo = document.getElementById('hud-modelo');

    const btnMenu = document.getElementById('btn-menu');
    const modalBoasVindas = document.getElementById('modal-boas-vindas');
    const btnFecharModal = document.getElementById('btn-fechar-modal');

    const hudGuia = document.getElementById('hud-guia');
    const setaDirecao = document.getElementById('seta-direcao');
    const labelGuia = document.getElementById('label-guia');
    const selectDestino = document.getElementById('select-destino');

    const caixaObra = document.getElementById('caixa-obra');
    const tituloObra = document.getElementById('titulo-obra');
    const textoDescricao = document.getElementById('texto-descricao');
    const btnAudio = document.getElementById('btn-audio');
    const audioNarracao = document.getElementById('audio-narracao');

    const cena = document.querySelector('a-scene');
    const cameraEl = document.querySelector('[gps-new-camera]');

    /*
      abertura e fechamento da caixa de boas-vindas pelo botao superior direito.
    */
    btnFecharModal.addEventListener('click', () => {
        modalBoasVindas.classList.add('escondido');
    });

    btnMenu.addEventListener('click', () => {
        modalBoasVindas.classList.remove('escondido');
    });

    if (!cameraEl) {
        hudGps.innerText = 'GPS: erro ao localizar componente da camera';
        return;
    }

    // filtra so as obras que ja tem coordenada preenchida pra nao quebrar a projecao do three.js com valor nulo
    const obrasAtivas = OBRAS.filter(obra => obra.latitude !== null && obra.longitude !== null);

    /*
      preenche o seletor de destino com as obras disponiveis e recalcula o angulo da seta
      sempre que o usuario escolher outra obra manualmente na lista.
    */
    obrasAtivas.forEach((obra, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.innerText = obra.nome;
        selectDestino.appendChild(option);
    });

    const atualizarAlvoDaSeta = () => {
        if (!ultimaPosicaoUsuario || obrasAtivas.length === 0) return;

        const obraEscolhida = obrasAtivas[Number(selectDestino.value)];
        if (!obraEscolhida) return;

        azimuteObraAlvo = calcularAzimuteGraus(
            ultimaPosicaoUsuario.latitude,
            ultimaPosicaoUsuario.longitude,
            obraEscolhida.latitude,
            obraEscolhida.longitude
        );

        const distAlvo = Math.round(
            calcularDistanciaMetros(
                ultimaPosicaoUsuario.latitude,
                ultimaPosicaoUsuario.longitude,
                obraEscolhida.latitude,
                obraEscolhida.longitude
            )
        );

        if (distAlvo <= RAIO_ATIVACAO_METROS) {
            labelGuia.innerText = `No local (${distAlvo}m) - aponte na direção da seta ou troque a obra:`;
        } else {
            labelGuia.innerText = `Guiando até (${distAlvo}m) - toque abaixo para trocar:`;
        }
    };

    selectDestino.addEventListener('change', atualizarAlvoDaSeta);

    /*
      atualiza o giro da seta de direcao na tela combinando o azimute da obra escolhida com a bussola da camera.
      precisa extrair o euler na ordem YXZ pra inclinacao vertical do celular nao distorcer o angulo do norte.
    */
    const eulerCamera = new AFRAME.THREE.Euler(0, 0, 0, 'YXZ');
    function atualizarSetaDirecao() {
        if (azimuteObraAlvo !== null && cameraEl.object3D) {
            eulerCamera.setFromQuaternion(cameraEl.object3D.quaternion, 'YXZ');
            const giroCameraGraus = AFRAME.THREE.MathUtils.radToDeg(eulerCamera.y);
            const anguloFinal = azimuteObraAlvo + giroCameraGraus;
            setaDirecao.style.transform = `rotate(${anguloFinal.toFixed(1)}deg)`;
        }
        requestAnimationFrame(atualizarSetaDirecao);
    }
    requestAnimationFrame(atualizarSetaDirecao);

    /*
      controle manual do botao de play/pause no topo da caixa de descricao.
      usar a tag audio do html direto no clique evita o bloqueio de WebAudio que o chrome mobile aplica no a-sound do a-frame.
    */
    btnAudio.addEventListener('click', () => {
        if (audioNarracao.paused) {
            audioNarracao.play().then(() => {
                btnAudio.innerText = 'Pausar';
            }).catch((erro) => {
                console.error('Erro ao reproduzir audio:', erro);
                btnAudio.innerText = 'Erro Audio';
            });
        } else {
            audioNarracao.pause();
            btnAudio.innerText = 'Play Audio';
        }
    });

    audioNarracao.addEventListener('ended', () => {
        btnAudio.innerText = 'Play Audio';
    });

    // se o mp3 especifico da obra ainda nao estiver na pasta e der 404, carrega o audio de teste pra nao quebrar o play
    audioNarracao.addEventListener('error', () => {
        if (!audioNarracao.src.endsWith('audio-teste.mp3')) {
            audioNarracao.src = AUDIO_PADRAO_TESTE;
        }
    });

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
        ultimaPosicaoUsuario = { latitude, longitude };

        hudGps.innerText = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

        const primeiraLeitura = !modeloInstanciado;

        if (!modeloInstanciado) {
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
                // inicia invisivel pra nao mostrar os 3 modelos de longe; so libera quando entrar nos 50m
                entidade.setAttribute('visible', false);

                entidade.addEventListener('model-loaded', () => {
                    carregados++;
                    hudModelo.innerText = `Modelo: ${carregados}/${obrasAtivas.length} prontos na cena`;
                });

                entidade.addEventListener('model-error', (erro) => {
                    hudModelo.innerText = `Modelo: erro ao carregar ${obra.nome}`;
                    console.error(`Falha ao carregar o arquivo glb (${obra.nome}):`, erro);
                });

                cena.appendChild(entidade);
                obra.entidade = entidade;
            });

            modeloInstanciado = true;
        }

        /*
          verifica a distancia de cada obra ativa para esconder os modelos que estao longe,
          atualiza a distancia de cada opcao no seletor da seta e abre a caixa de dialogo
          automaticamente para a obra que estiver dentro do raio de 50 metros.
        */
        let obraMaisProxima = null;
        let indiceMaisProxima = 0;
        let menorDistancia = Infinity;

        obrasAtivas.forEach((obra, index) => {
            const distancia = calcularDistanciaMetros(latitude, longitude, obra.latitude, obra.longitude);

            if (obra.entidade) {
                obra.entidade.setAttribute('visible', distancia <= RAIO_ATIVACAO_METROS);
            }

            if (selectDestino.options[index]) {
                selectDestino.options[index].innerText = `${obra.nome} (${Math.round(distancia)}m)`;
            }

            if (distancia < menorDistancia) {
                menorDistancia = distancia;
                obraMaisProxima = obra;
                indiceMaisProxima = index;
            }
        });

        if (obrasAtivas.length > 0) {
            hudGuia.classList.remove('escondido');
            // na primeira leitura do gps ja seleciona a obra mais proxima como destino inicial
            if (primeiraLeitura) {
                selectDestino.value = String(indiceMaisProxima);
            }
            atualizarAlvoDaSeta();
        }

        if (obraMaisProxima && menorDistancia <= RAIO_ATIVACAO_METROS) {
            caixaObra.classList.remove('escondido');
            tituloObra.innerText = `${obraMaisProxima.nome} (${Math.round(menorDistancia)}m)`;

            // so troca o src do audio quando entra numa obra diferente, senao cada leitura do gps reiniciaria o mp3 do zero
            if (obraAtivaNoPainel !== obraMaisProxima.nome) {
                obraAtivaNoPainel = obraMaisProxima.nome;
                textoDescricao.innerText = obraMaisProxima.descricao;
                audioNarracao.pause();
                audioNarracao.src = obraMaisProxima.audio;
                audioNarracao.load();
                btnAudio.innerText = 'Play Audio';
            }
        } else {
            caixaObra.classList.add('escondido');
            if (!audioNarracao.paused) {
                audioNarracao.pause();
                btnAudio.innerText = 'Play Audio';
            }
            obraAtivaNoPainel = null;
        }
    });
});