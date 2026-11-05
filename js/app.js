/*
  configuracao do controle de leitura do gps, calculo de distancia por haversine
  e gerencia o carregamento dos modelos 3d e a exibicao da caixa de dialogo com o audio.
*/

import { OBRAS } from './obras.js';

const RAIO_ATIVACAO_METROS = 50;

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

window.addEventListener('load', () => {
    let modeloInstanciado = false;
    let obraAtivaNoPainel = null;

    const hudGps = document.getElementById('hud-gps');
    const hudPrecisao = document.getElementById('hud-precisao');
    const hudModelo = document.getElementById('hud-modelo');

    const caixaObra = document.getElementById('caixa-obra');
    const tituloObra = document.getElementById('titulo-obra');
    const textoDescricao = document.getElementById('texto-descricao');
    const btnAudio = document.getElementById('btn-audio');
    const audioNarracao = document.getElementById('audio-narracao');

    const cena = document.querySelector('a-scene');
    const cameraEl = document.querySelector('[gps-new-camera]');

    if (!cameraEl) {
        hudGps.innerText = 'GPS: erro ao localizar componente da camera';
        return;
    }

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

        // filtra so as obras que ja tem coordenada preenchida pra nao quebrar a projecao do three.js com valor nulo
        const obrasAtivas = OBRAS.filter(obra => obra.latitude !== null && obra.longitude !== null);

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

        /*
          verifica qual obra ativa esta mais perto do usuario neste momento.
          se estiver a 50 metros ou menos, abre a caixa de dialogo; se sair do raio, esconde a caixa e pausa a narracao.
        */
        let obraMaisProxima = null;
        let menorDistancia = Infinity;

        obrasAtivas.forEach((obra) => {
            const distancia = calcularDistanciaMetros(latitude, longitude, obra.latitude, obra.longitude);
            if (distancia < menorDistancia) {
                menorDistancia = distancia;
                obraMaisProxima = obra;
            }
        });

        if (obraMaisProxima && menorDistancia <= RAIO_ATIVACAO_METROS) {
            caixaObra.classList.remove('escondido');
            tituloObra.innerText = `${obraMaisProxima.nome} (${Math.round(menorDistancia)}m)`;

            // so troca o src do audio quando entra numa obra diferente, senao cada leitura do gps reiniciaria o mp3 do zero
            if (obraAtivaNoPainel !== obraMaisProxima.nome) {
                obraAtivaNoPainel = obraMaisProxima.nome;
                textoDescricao.innerText = obraMaisProxima.descricao;
                audioNarracao.pause();
                audioNarracao.src = obraMaisProxima.audio;
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